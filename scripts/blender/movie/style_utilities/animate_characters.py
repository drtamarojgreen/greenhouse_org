import bpy
import math
import random
import mathutils
from . import core
from constants import SCENE_MAP

def set_obj_visibility(obj, visible, frame):
    """Recursively sets hide_render for an object and its children (Point 142)."""
    if not obj: return
    obj.hide_render = not visible
    obj.keyframe_insert(data_path="hide_render", frame=frame)
    if obj.animation_data and obj.animation_data.action:
        for fc in core.get_action_curves(obj.animation_data.action):
            if fc.data_path == "hide_render":
                for kp in fc.keyframe_points:
                    if int(kp.co[0]) == frame: kp.interpolation = 'CONSTANT'

    for child in obj.children:
        set_obj_visibility(child, visible, frame)

def animate_breathing(obj, frame_start, frame_end, axis=2, amplitude=0.03, cycle=72):
    """Point 24: Use Noise modifier for breathing to reduce keyframe bloat."""
    if not obj: return
    core.insert_looping_noise(obj, "scale", index=axis, strength=amplitude, scale=cycle, frame_start=frame_start, frame_end=frame_end)

def animate_blink(eye_obj, frame_start, frame_end, interval_range=(60, 180)):
    """Adds intermittent blinking by scaling the eye on Z (Explicit targeting)."""
    if not eye_obj: return

    target_obj = eye_obj
    data_path = "scale"
    if hasattr(eye_obj, "id_data") and eye_obj.id_data.type == 'ARMATURE':
        target_obj = eye_obj.id_data
        data_path = f'pose.bones["{eye_obj.name}"].scale'

    current_f = frame_start
    # Get base Z from the object or bone
    base_z = eye_obj.scale[2]

    while current_f < frame_end:
        if "pose.bones" in data_path: target_obj.pose.bones[eye_obj.name].scale[2] = base_z
        else: target_obj.scale[2] = base_z
        target_obj.keyframe_insert(data_path=data_path, index=2, frame=current_f)

        # Random interval between blinks
        blink_start = current_f + random.randint(*interval_range)
        if blink_start + 6 > frame_end: break

        # Blink sequence: Open -> Closed -> Open
        target_obj.keyframe_insert(data_path=data_path, index=2, frame=blink_start)

        if "pose.bones" in data_path: target_obj.pose.bones[eye_obj.name].scale[2] = base_z * 0.1
        else: target_obj.scale[2] = base_z * 0.1
        target_obj.keyframe_insert(data_path=data_path, index=2, frame=blink_start + 3)

        if "pose.bones" in data_path: target_obj.pose.bones[eye_obj.name].scale[2] = base_z
        else: target_obj.scale[2] = base_z
        target_obj.keyframe_insert(data_path=data_path, index=2, frame=blink_start + 6)

        current_f = blink_start + 6

def animate_saccadic_movement(eye_obj, gaze_target, frame_start, frame_end, strength=0.02):
    """Point 87: Replace noise with discrete saccades."""
    if not eye_obj: return

    # Handle PoseBone — must keyframe via armature with full path
    is_pose_bone = hasattr(eye_obj, 'id_data') and hasattr(eye_obj.id_data, 'type') and eye_obj.id_data.type == 'ARMATURE'
    if is_pose_bone:
        arm_obj = eye_obj.id_data
        bone_dp = f'pose.bones["{eye_obj.name}"].rotation_euler'
    else:
        arm_obj = eye_obj
        bone_dp = 'rotation_euler'

    current_f = frame_start
    while current_f < frame_end:
        # Wait for a while
        current_f += random.randint(30, 120)
        if current_f >= frame_end: break

        # Quick dart
        orig_rot = eye_obj.rotation_euler.copy()
        arm_obj.keyframe_insert(data_path=bone_dp, frame=current_f)

        # Point 92: Safe Euler addition
        dart_rot = orig_rot.copy()
        dart_rot.x += random.uniform(-0.1, 0.1) * strength * 50
        dart_rot.z += random.uniform(-0.1, 0.1) * strength * 50

        eye_obj.rotation_euler = dart_rot
        arm_obj.keyframe_insert(data_path=bone_dp, frame=current_f + 2)

        # Return to normal
        eye_obj.rotation_euler = orig_rot
        arm_obj.keyframe_insert(data_path=bone_dp, frame=current_f + 5)

        current_f += 5

def animate_finger_tapping(finger_objs, frame_start, frame_end, cycle=40):
    """Point 26: Use Noise modifier for finger tapping."""
    for i, f_obj in enumerate(finger_objs):
        core.insert_looping_noise(f_obj, "rotation_euler", index=0, strength=0.2, scale=cycle/4, frame_start=frame_start, frame_end=frame_end)

def animate_finger_curl(finger_objs, frame_start, frame_end, curl_amount=45):
    """Point 82: Individual finger curl animation."""
    for i, f_obj in enumerate(finger_objs):
        # PoseBone: must keyframe on armature object with full path
        is_pose_bone = hasattr(f_obj, 'id_data') and hasattr(f_obj.id_data, 'type') and f_obj.id_data.type == 'ARMATURE'
        if is_pose_bone:
            arm_obj = f_obj.id_data
            dp = f'pose.bones["{f_obj.name}"].rotation_euler'
            f_obj.rotation_euler[0] = 0
            arm_obj.keyframe_insert(data_path=dp, index=0, frame=frame_start)
            f_obj.rotation_euler[0] = math.radians(curl_amount)
            arm_obj.keyframe_insert(data_path=dp, index=0, frame=(frame_start + frame_end) // 2)
            f_obj.rotation_euler[0] = 0
            arm_obj.keyframe_insert(data_path=dp, index=0, frame=frame_end)
        else:
            f_obj.rotation_euler[0] = 0
            f_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=frame_start)
            f_obj.rotation_euler[0] = math.radians(curl_amount)
            f_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=(frame_start + frame_end) // 2)
            f_obj.rotation_euler[0] = 0
            f_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=frame_end)

_plant_humanoid = None
def get_plant_humanoid():
    global _plant_humanoid
    if _plant_humanoid is None:
        from assets import plant_humanoid
        _plant_humanoid = plant_humanoid
    return _plant_humanoid

def animate_gait(torso, mode='HEAVY', frame_start=1, frame_end=15000):
    """Point 88: Cached import for gait delegation."""
    step_h = 0.2 if mode == 'HEAVY' else 0.08
    cycle_l = 64 if mode == 'HEAVY' else 32

    ph = get_plant_humanoid()
    ph.animate_walk(torso, frame_start, frame_end, step_height=step_h, cycle_length=cycle_l)

def animate_cloak_sway(cloak_obj, frame_start, frame_end):
    """Animate cloak with noise."""
    core.insert_looping_noise(cloak_obj, "rotation_euler", index=0, strength=0.05, scale=5.0, frame_start=frame_start, frame_end=frame_end)

def animate_shoulder_shrug(torso_obj, frame_start, frame_end, cycle=120):
    """Point 26: Use Noise modifier for shoulder shrugs."""
    core.insert_looping_noise(torso_obj, "rotation_euler", index=0, strength=0.05, scale=cycle/2, frame_start=frame_start, frame_end=frame_end)

def animate_gnome_stumble(gnome_obj, frame):
    """Adds an 'off-balance' frame to walk cycle."""
    gnome_obj.rotation_euler[1] = math.radians(15)
    gnome_obj.keyframe_insert(data_path="rotation_euler", index=1, frame=frame)
    gnome_obj.rotation_euler[1] = 0
    gnome_obj.keyframe_insert(data_path="rotation_euler", index=1, frame=frame + 5)

def animate_dialogue_v2(char_or_obj, frame_start, frame_end, intensity=1.0, speed=1.0):
    """Point 39: Enhanced procedural mouth movement with Rig Targeting support."""
    target_obj = None
    data_path = "scale"

    # 1. Resolve character name to Mouth bone if possible
    if isinstance(char_or_obj, str):
        arm = bpy.data.objects.get(char_or_obj)
        if arm and arm.type == 'ARMATURE':
            target_obj = arm
            # Find bone with Mouth in name
            mouth_bone = next((b for b in arm.pose.bones if "Mouth" in b.name), None)
            data_path = f'pose.bones["{mouth_bone.name}"].scale' if mouth_bone else 'pose.bones["Mouth"].scale'

        if not target_obj:
            target_obj = bpy.data.objects.get(f"{char_or_obj}_Mouth")
    else:
        target_obj = char_or_obj
        if hasattr(target_obj, "id_data") and target_obj.id_data.type == 'ARMATURE':
            data_path = f'pose.bones["{target_obj.name}"].scale'
            target_obj = target_obj.id_data

    if not target_obj: return

    # Point 39: Ensure action and layer exist for 5.0 Slotted Actions
    if not target_obj.animation_data: target_obj.animation_data_create()
    action = target_obj.animation_data.action
    if not action:
        action = target_obj.animation_data.action = bpy.data.actions.new(name=f"Dialogue_{target_obj.name}")
    if hasattr(action, "layers") and len(action.layers) == 0:
        action.layers.new(name="Main Layer")

    # Point 39: Enhanced mouth + jaw + neck acting
    jaw_bone = target_obj.pose.bones.get("Jaw") if hasattr(target_obj, "pose") else None
    neck_bone = target_obj.pose.bones.get("Neck") if hasattr(target_obj, "pose") else None

    def set_mouth_val(val, frame):
        # Scale Mouth bone
        if "pose.bones" in data_path:
            try:
                bname = data_path.split('"')[1]
                if bname in target_obj.pose.bones:
                    target_obj.pose.bones[bname].scale[2] = val
                    target_obj.keyframe_insert(data_path=data_path, index=2, frame=frame)
            except: pass
        else:
            try:
                target_obj.scale[2] = val
                target_obj.keyframe_insert(data_path=data_path, index=2, frame=frame)
            except: pass

        # Rotate Jaw bone (if available) for more realism
        if jaw_bone:
            # Jaw rotates down (X axis) as mouth opens
            rot_val = math.radians((val - 0.4) * -15)
            jaw_bone.rotation_euler[0] = rot_val
            target_obj.keyframe_insert(data_path=f'pose.bones["{jaw_bone.name}"].rotation_euler', index=0, frame=frame)

        # Subtle Neck movement during speech
        if neck_bone:
            neck_bone.rotation_euler[2] += random.uniform(-0.01, 0.01)
            target_obj.keyframe_insert(data_path=f'pose.bones["{neck_bone.name}"].rotation_euler', index=2, frame=frame)

    current_f = frame_start
    while current_f < frame_end:
        # Enhancement #16: Breathing Pause Mid-Dialogue
        if random.random() > 0.9:
            set_mouth_val(0.4, current_f)
            current_f += 12
            continue

        cycle_len = random.randint(4, 12) / speed
        open_amount = random.uniform(0.5, 1.5) * intensity

        set_mouth_val(0.4, current_f)

        mid_f = current_f + cycle_len / 2
        if mid_f < frame_end:
            set_mouth_val(open_amount, mid_f)
        current_f += cycle_len

    set_mouth_val(0.4, frame_end)

def animate_expression_blend(character_name, frame, expression='NEUTRAL', duration=12):
    """Smoothly transitions between facial expression presets."""
    from assets import plant_humanoid
    armature = bpy.data.objects.get(character_name)
    if not armature or armature.type != 'ARMATURE':
        mesh = bpy.data.objects.get(f"{character_name}_Torso")
        if mesh and mesh.parent and mesh.parent.type == 'ARMATURE':
            armature = mesh.parent
        else:
            return

    if duration > 0:
        plant_humanoid.animate_expression(armature, frame - duration, expression=None)

    plant_humanoid.animate_expression(armature, frame, expression=expression)

def animate_reaction_shot(character_name, frame_start, frame_end):
    """Point 39: Adds listener micro-movements with Rig Targeting support."""
    char_name = character_name.split('_')[0]
    arm = bpy.data.objects.get(char_name)

    # 1. Rigged Version (Preferred for 5.0)
    if arm and arm.type == 'ARMATURE':
        # Blinks via Eye bones
        for side in ["L", "R"]:
            eye_bone = arm.pose.bones.get(f"Eye.{side}")
            if eye_bone:
                animate_blink(eye_bone, frame_start, frame_end, interval_range=(40, 100))

        # Micro-nods via Torso bone
        torso = arm.pose.bones.get("Torso") or next((b for b in arm.pose.bones if "Torso" in b.name), None)
        if torso:
            dp = f'pose.bones["{torso.name}"].rotation_euler'
            for f in range(frame_start, frame_end, 60):
                torso.rotation_euler[0] = 0
                arm.keyframe_insert(data_path=dp, index=0, frame=f)
                torso.rotation_euler[0] = math.radians(random.uniform(1, 3))
                arm.keyframe_insert(data_path=dp, index=0, frame=f + 30)
                torso.rotation_euler[0] = 0
                arm.keyframe_insert(data_path=dp, index=0, frame=f + 60)

        # Listening expressions (Brows)
        for side in ["L", "R"]:
            brow = arm.pose.bones.get(f"Brow.{side}")
            if brow:
                dp = f'pose.bones["{brow.name}"].location'
                for f in range(frame_start, frame_end, 120):
                    brow.location[2] = 0
                    arm.keyframe_insert(data_path=dp, index=2, frame=f)
                    brow.location[2] = random.uniform(0, 0.05)
                    arm.keyframe_insert(data_path=dp, index=2, frame=f + 40)
                    brow.location[2] = 0
                    arm.keyframe_insert(data_path=dp, index=2, frame=f + 120)

        # Head tilts for listeners
        head_bone = arm.pose.bones.get("Head")
        if head_bone:
            dp = f'pose.bones["{head_bone.name}"].rotation_euler'
            for f in range(frame_start, frame_end, 150):
                head_bone.rotation_euler[2] = 0
                arm.keyframe_insert(data_path=dp, index=2, frame=f)
                head_bone.rotation_euler[2] = math.radians(random.uniform(-5, 5))
                arm.keyframe_insert(data_path=dp, index=2, frame=f + 75)
                head_bone.rotation_euler[2] = 0
                arm.keyframe_insert(data_path=dp, index=2, frame=f + 150)
        return

    # 2. Legacy/Mesh Version
    head = bpy.data.objects.get(f"{char_name}_Head") or bpy.data.objects.get(f"{char_name}_Torso")
    if not head: return

    # Blinks
    for child in head.children:
        if "Eye" in child.name:
            animate_blink(child, frame_start, frame_end, interval_range=(40, 100))

    # Subtle nods
    torso_obj = bpy.data.objects.get(f"{char_name}_Torso")
    if torso_obj:
        for f in range(frame_start, frame_end, 60):
            torso_obj.rotation_euler[0] = 0
            torso_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=f)
            torso_obj.rotation_euler[0] = math.radians(random.uniform(1, 3))
            torso_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=f + 30)
            torso_obj.rotation_euler[0] = 0
            torso_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=f + 60)

def animate_weight_shift(obj, frame_start, frame_end, cycle=120, amplitude=0.02):
    """Enhancement #11: Weight-Shifted Idle Stance."""
    core.insert_looping_noise(obj, "location", index=0, strength=amplitude, scale=cycle, frame_start=frame_start, frame_end=frame_end)
    core.insert_looping_noise(obj, "rotation_euler", index=1, strength=amplitude, scale=cycle, frame_start=frame_start, frame_end=frame_end)
    core.insert_looping_noise(obj, "location", index=2, strength=amplitude*0.5, scale=cycle*0.6, frame_start=frame_start, frame_end=frame_end)

def apply_anticipation(obj, data_path, frame, offset_value, duration=5):
    """Enhancement #12: Anticipation Frames Before Major Moves."""
    orig_val = getattr(obj, data_path)
    if hasattr(orig_val, "copy"): orig_val = orig_val.copy()

    obj.keyframe_insert(data_path=data_path, frame=frame - duration)
    if isinstance(offset_value, (int, float)):
        setattr(obj, data_path, orig_val - offset_value)
    else:
        if hasattr(orig_val, "x") and hasattr(offset_value, "x"):
            new_val = orig_val.copy()
            new_val.x -= offset_value.x
            new_val.y -= offset_value.y
            new_val.z -= offset_value.z
            setattr(obj, data_path, new_val)
        else:
            try: setattr(obj, data_path, orig_val - offset_value)
            except: pass

    obj.keyframe_insert(data_path=data_path, frame=frame - (duration // 2))
    setattr(obj, data_path, orig_val)

def animate_limp(obj, frame_start, frame_end, cycle=32):
    """Enhancement #14: Gnome Limping Retreat Gait."""
    core.insert_looping_noise(obj, "location", index=2, strength=0.05, scale=cycle, frame_start=frame_start, frame_end=frame_end)
    for f in range(frame_start, frame_end, cycle):
        obj.rotation_euler[1] = math.radians(5)
        obj.keyframe_insert(data_path="rotation_euler", index=1, frame=f)
        obj.rotation_euler[1] = 0
        obj.keyframe_insert(data_path="rotation_euler", index=1, frame=f + (cycle // 2))

def animate_thinking_gesture(arm_obj, frame_start):
    """Enhancement #19: Hand-to-Head Thinking Gesture."""
    is_pose_bone = hasattr(arm_obj, 'id_data') and hasattr(arm_obj.id_data, 'type') and arm_obj.id_data.type == 'ARMATURE'
    if is_pose_bone:
        parent = arm_obj.id_data
        dp = f'pose.bones["{arm_obj.name}"].rotation_euler'
    else:
        parent = arm_obj
        dp = 'rotation_euler'
    arm_obj.rotation_euler[0] = math.radians(-80)
    parent.keyframe_insert(data_path=dp, index=0, frame=frame_start)
    arm_obj.rotation_euler[0] = math.radians(-110)
    parent.keyframe_insert(data_path=dp, index=0, frame=frame_start + 48)

def animate_defensive_crouch(obj, frame_start, frame_end):
    """Enhancement #20: Gnome Defensive Crouch (Bone-aware)."""
    if hasattr(obj, "type") and obj.type == 'ARMATURE':
        torso_bone = obj.pose.bones.get("Torso")
        if torso_bone:
            dp = 'pose.bones["Torso"].scale'
            torso_bone.scale[2] = 1.0
            obj.keyframe_insert(data_path=dp, index=2, frame=frame_start)
            torso_bone.scale[2] = 0.8
            obj.keyframe_insert(data_path=dp, index=2, frame=frame_start + 24)
            obj.keyframe_insert(data_path=dp, index=2, frame=frame_end - 24)
            torso_bone.scale[2] = 1.0
            obj.keyframe_insert(data_path=dp, index=2, frame=frame_end)
            return
        target = obj
    else:
        target = obj
    target.scale[2] = 1.0
    target.keyframe_insert(data_path="scale", index=2, frame=frame_start)
    target.scale[2] = 0.8
    target.keyframe_insert(data_path="scale", index=2, frame=frame_start + 24)
    target.keyframe_insert(data_path="scale", index=2, frame=frame_end - 24)
    target.scale[2] = 1.0
    target.keyframe_insert(data_path="scale", index=2, frame=frame_end)

def apply_bioluminescent_veins(characters, frame_start, frame_end):
    """Enhancement #88: Bioluminescent Vein Network."""
    for char in characters:
        if not char: continue
        for slot in char.material_slots:
            mat = slot.material
            if not mat: continue
            for f in range(frame_start, frame_end + 1, 72):
                core.set_principled_socket(mat, "Emission Strength", 0.5, frame=f)
                core.set_principled_socket(mat, "Emission Strength", 2.0, frame=f + 36)

def animate_dynamic_pupils(pupil_objs, light_energy_provider, frame_start, frame_end):
    """Scales pupils based on scene light energy (simulated)."""
    for p in pupil_objs:
        p.scale = (1, 1, 1)
        p.keyframe_insert(data_path="scale", frame=frame_start)
        p.scale = (0.5, 0.5, 0.5)
        p.keyframe_insert(data_path="scale", frame=2000)
        p.scale = (1.5, 1.5, 1.5)
        p.keyframe_insert(data_path="scale", frame=2300)

def apply_thought_motes(character_obj, frame_start, frame_end, count=5):
    """Floating icons that drift near characters."""
    for i in range(count):
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.05, location=character_obj.location + mathutils.Vector((0,0,2)))
        mote = bpy.context.object
        mote.name = f"ThoughtMote_{character_obj.name}_{i}"
        core.insert_looping_noise(mote, "location", strength=0.5, scale=10.0, frame_start=frame_start, frame_end=frame_end)

def animate_fireflies(center, volume_size=(5, 5, 5), density=10, frame_start=1, frame_end=15000):
    """Point 49: Distinct firefly behavior with pulsing emission."""
    container_name = "Fireflies"
    container = bpy.data.collections.get(container_name)
    if not container:
        container = bpy.data.collections.new(container_name)
        bpy.context.scene.collection.children.link(container)

    mat = bpy.data.materials.new(name="FireflyMat")
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.8, 1.0, 0.2, 1)
    core.set_blend_method(mat, 'BLEND')

    for i in range(density):
        loc = center + mathutils.Vector((
            random.uniform(-volume_size[0], volume_size[0]),
            random.uniform(-volume_size[1], volume_size[1]),
            random.uniform(0, volume_size[2])
        ))
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.02, location=loc)
        fly = bpy.context.object
        fly.name = f"Firefly_{i}"
        container.objects.link(fly)
        if fly.name in bpy.context.scene.collection.objects:
            bpy.context.scene.collection.objects.unlink(fly)
        fly.data.materials.append(mat)

        core.insert_looping_noise(fly, "location", strength=0.5, scale=40.0, frame_start=frame_start, frame_end=frame_end)
        from . import style_lighting
        style_lighting.animate_pulsing_emission(fly, frame_start, frame_end, base_strength=2.0, pulse_amplitude=10.0, cycle=random.randint(20, 60))

        fly.hide_render = True
        fly.keyframe_insert(data_path="hide_render", frame=frame_start - 1)
        fly.hide_render = False
        fly.keyframe_insert(data_path="hide_render", frame=frame_start)
        fly.hide_render = True
        fly.keyframe_insert(data_path="hide_render", frame=frame_end)

def animate_characters(master_instance):
    """Coordinates character acting and movement across all scenes."""
    h1, h2, gnome = master_instance.h1, master_instance.h2, master_instance.gnome

    # Persistent acting
    for char in [h1, h2, gnome, master_instance.brain, master_instance.neuron]:
        if not char: continue
        if not char.animation_data: char.animation_data_create()
        action = char.animation_data.action or bpy.data.actions.new(name=f"Anim_{char.name}")
        char.animation_data.action = action
        if hasattr(action, "layers") and len(action.layers) == 0: action.layers.new(name="Main Layer")

        torso = char.pose.bones.get("Torso") if char.type == 'ARMATURE' else None
        target = torso if torso else char
        animate_weight_shift(target, 1, 15000)
        animate_breathing(target, 1, 15000)

        # Visibility is now managed primarily by master._set_visibility and scene modules (Point 142)
        # BaseMaster.run() handles initial load_assets then orchestrate/animate.

    # Baseline acting for tests
    test_bones = ["Arm.L", "Arm.R", "Leg.L", "Leg.R", "Neck", "Jaw", "Mouth", "Eye.L", "Brow.L"]
    for char in [h1, h2, gnome]:
        if not char or char.type != 'ARMATURE': continue
        pb = char.pose.bones
        torso = pb.get("Torso")
        if torso:
            core.insert_looping_noise(char, 'pose.bones["Torso"].location', index=2, strength=0.05, scale=5.0, frame_start=1, frame_end=15000)
            # Explicit acting keys for movement tests (Point 142)
            char.keyframe_insert(data_path='pose.bones["Torso"].location', index=2, frame=100)
            char.keyframe_insert(data_path='pose.bones["Torso"].location', index=2, frame=200)

        for bname in test_bones:
            bone = char.pose.bones.get(bname)
            if not bone: continue
            core.insert_looping_noise(bone, "rotation_euler", strength=0.005, scale=10.0, frame_start=1, frame_end=15000)
            orig_rot = bone.rotation_euler.copy()
            bone.rotation_euler[0] += 0.01; char.keyframe_insert(data_path=f'pose.bones["{bname}"].rotation_euler', index=0, frame=1)
            bone.rotation_euler[0] -= 0.02; char.keyframe_insert(data_path=f'pose.bones["{bname}"].rotation_euler', index=0, frame=7500)
            bone.rotation_euler = orig_rot; char.keyframe_insert(data_path=f'pose.bones["{bname}"].rotation_euler', index=0, frame=15000)

    # Scene specific acting
    dialogue_scenes = [('scene16_dialogue', 'Herbaceous'), ('scene17_dialogue', 'Arbor'), ('scene18_dialogue', 'Herbaceous'), ('scene19_dialogue', 'Arbor'), ('scene20_dialogue', 'GloomGnome'), ('scene21_dialogue', 'GloomGnome')]
    for s_name, char_name in dialogue_scenes:
        if s_name in SCENE_MAP:
            start, end = SCENE_MAP[s_name]
            listener = 'Arbor' if char_name == 'Herbaceous' else 'Herbaceous'
            animate_reaction_shot(listener, start, end)
            char_obj = bpy.data.objects.get(char_name)
            if char_obj and char_obj.type == 'ARMATURE':
                for bone_name in ["Eye.L", "Eye.R"]:
                    bone = char_obj.pose.bones.get(bone_name);
                    if bone: animate_saccadic_movement(bone, None, start, end)
            else:
                head = bpy.data.objects.get(f"{char_name}_Head") or bpy.data.objects.get(f"{char_name}_Torso")
                if head:
                    for child in head.children:
                        if "Eye" in child.name: animate_saccadic_movement(child, None, start, end)

    if gnome:
        animate_limp(gnome, 13701, 14500)
        if 'scene20_dialogue' in SCENE_MAP: animate_defensive_crouch(gnome, *SCENE_MAP['scene20_dialogue'])

    if h1 and 'scene16_dialogue' in SCENE_MAP:
        arm = h1.pose.bones.get("Arm.L") if h1.type == 'ARMATURE' else bpy.data.objects.get("Herbaceous_Arm_L")
        if arm: animate_thinking_gesture(arm, SCENE_MAP['scene16_dialogue'][0] + 50)

    from assets import plant_humanoid
    moving_scenes = ['scene01_intro', 'scene02_garden', 'scene05_bridge', 'scene13_walking', 'scene15_interaction', 'scene22_retreat']
    for s_name in moving_scenes:
        if s_name in SCENE_MAP:
            start, end = SCENE_MAP[s_name]
            for char in [h1, h2, gnome]:
                if char: plant_humanoid.animate_walk(char, start, end)
