import bpy
import random
import math
import mathutils

def get_action_curves(action):
    """Helper to get fcurves/curves collection from Action for Blender 5.0+ compatibility."""
    if hasattr(action, 'fcurves'):
        return action.fcurves
    if hasattr(action, 'curves'):
        return action.curves
    # Blender 5.0 / Animation 2025 Layered Action support
    if hasattr(action, 'layer') and hasattr(action.layer, 'fcurves'):
        return action.layer.fcurves
    if hasattr(action, 'layers') and len(action.layers) > 0:
        if hasattr(action.layers[0], 'fcurves'):
            return action.layers[0].fcurves
    return []

def apply_scene_grade(master, scene_name, frame_start, frame_end):
    """Applies scene mood presets: world tint, light energy/color ratios."""
    scene = master.scene
    world = scene.world
    nodes = world.node_tree.nodes
    bg = nodes.get("Background")

    # Default values (Reset)
    bg_color = (0, 0, 0, 1)
    sun_energy = 5.0
    sun_color = (1, 1, 1, 1)
    rim_energy = 5000
    rim_color = (1, 1, 1, 1)
    fill_energy = 2000
    fill_color = (1, 1, 1, 1)
    spot_energy = 10000
    spot_color = (1, 1, 1, 1)

    if scene_name == 'garden': # Scenes 1-4
        bg_color = (0.01, 0.02, 0.01, 1) # Dark mossy green
        sun_color = (1, 0.9, 0.7, 1) # Warm amber
        rim_color = (0.8, 1, 0.8, 1) # Soft green
    elif scene_name == 'resonance': # Scenes 5-6
        bg_color = (0, 0.01, 0.02, 1) # Dark cyan
        sun_color = (0.7, 0.9, 1, 1) # Electric cyan
        rim_color = (0.5, 0.8, 1, 1) # Teal
    elif scene_name == 'shadow': # Scenes 7-8
        bg_color = (0.02, 0, 0.03, 1) # Dark violet
        sun_energy = 2.0 # Dimmer
        sun_color = (0.8, 0.7, 1, 1) # Pale violet
        rim_energy = 8000 # Stronger rim to separate from dark
        rim_color = (0.6, 0.4, 1, 1) # Violet rim
        spot_energy = 5000
        spot_color = (0.7, 0.5, 1, 1)
    elif scene_name == 'sanctuary': # Scenes 9-11
        bg_color = (0.02, 0.02, 0, 1) # Dark gold/olive
        sun_color = (1, 0.95, 0.8, 1) # Rich gold
        rim_color = (1, 1, 0.9, 1) # Warm white

    # Apply to world
    if bg:
        bg.inputs[0].default_value = bg_color
        bg.inputs[0].keyframe_insert(data_path="default_value", frame=frame_start)

    # Apply to lights
    lights = {
        "Sun": (sun_energy, sun_color),
        "RimLight": (rim_energy, rim_color),
        "FillLight": (fill_energy, fill_color),
        "Spot": (spot_energy, spot_color)
    }

    for name, (energy, color) in lights.items():
        # Map master attributes if they exist
        attr_map = {"Sun": "sun", "RimLight": "rim", "FillLight": "fill", "Spot": "spot"}
        light_obj = getattr(master, attr_map.get(name, ""), None)
        if not light_obj:
            light_obj = bpy.data.objects.get(name)

        if light_obj and hasattr(light_obj, "data"):
            light_obj.data.energy = energy
            light_obj.data.keyframe_insert(data_path="energy", frame=frame_start)
            if hasattr(light_obj.data, "color"):
                light_obj.data.color = color[:3]
                light_obj.data.keyframe_insert(data_path="color", frame=frame_start)

def animate_foliage_wind(objects, strength=0.05, frame_start=1, frame_end=5000):
    """Adds subtle sway to foliage objects within a specific frame range."""
    for obj in objects:
        if obj.type != 'MESH': continue
        insert_looping_noise(obj, "rotation_euler", strength=strength, frame_start=frame_start, frame_end=frame_end)

def animate_light_flicker(light_name, frame_start, frame_end, strength=0.2, seed=None):
    """Adds magical flicker to a light within a specific frame range."""
    light_obj = bpy.data.objects.get(light_name)
    if not light_obj: return

    if seed is not None:
        random.seed(seed)

    if not light_obj.data.animation_data:
        light_obj.data.animation_data_create()
    if not light_obj.data.animation_data.action:
        light_obj.data.animation_data.action = bpy.data.actions.new(name=f"Flicker_{light_name}")

    curves = get_action_curves(light_obj.data.animation_data.action)
    if isinstance(curves, list) and not curves:
        print(f"Warning: Could not access fcurves for light {light_name}")
        return

    fcurve = None
    for fc in curves:
        if fc.data_path == "energy":
            fcurve = fc
            break
    if not fcurve:
        fcurve = curves.new(data_path="energy")

    modifier = fcurve.modifiers.new(type='NOISE')
    modifier.strength = light_obj.data.energy * strength
    modifier.scale = 2.0
    modifier.phase = random.random() * 100

    # Restrict range to avoid global flicker
    modifier.use_restricted_range = True
    modifier.frame_start = frame_start
    modifier.frame_end = frame_end
    modifier.blend_in = 5
    modifier.blend_out = 5

def insert_looping_noise(obj, data_path, index=-1, frame_start=1, frame_end=5000, strength=0.05, scale=10.0, phase=None):
    """Inserts noise modifier to a data path, ensuring the range is respected."""
    if not obj.animation_data:
        obj.animation_data_create()
    if not obj.animation_data.action:
        obj.animation_data.action = bpy.data.actions.new(name=f"Noise_{obj.name}_{data_path.replace('.', '_')}")

    action = obj.animation_data.action
    curves = get_action_curves(action)
    
    if isinstance(curves, list) and not curves:
        print(f"Warning: Could not access fcurves for {obj.name}. Action attributes: {dir(action)}")
        return

    indices = [index] if index >= 0 else [0, 1, 2]

    for idx in indices:
        fcurve = None
        for fc in curves:
            if fc.data_path == data_path and fc.array_index == idx:
                fcurve = fc
                break
        if not fcurve:
            fcurve = curves.new(data_path=data_path, index=idx)

        if not fcurve.keyframe_points:
            obj.keyframe_insert(data_path=data_path, index=idx, frame=frame_start)

        modifier = fcurve.modifiers.new(type='NOISE')
        modifier.strength = strength * (0.8 + random.random() * 0.4)
        modifier.scale = scale * (0.8 + random.random() * 0.4)
        modifier.phase = phase if phase is not None else random.random() * 100

        modifier.use_restricted_range = True
        modifier.frame_start = frame_start
        modifier.frame_end = frame_end
        modifier.blend_in = 10
        modifier.blend_out = 10

def animate_breathing(obj, frame_start, frame_end, axis=2, amplitude=0.03, cycle=72):
    """Adds a rhythmic scale oscillation to simulate breathing."""
    if not obj: return
    base_val = obj.scale[axis]
    for f in range(frame_start, frame_end + 1, cycle):
        obj.scale[axis] = base_val
        obj.keyframe_insert(data_path="scale", index=axis, frame=f)
        if f + cycle // 2 <= frame_end:
            obj.scale[axis] = base_val * (1.0 + amplitude)
            obj.keyframe_insert(data_path="scale", index=axis, frame=f + cycle // 2)

    obj.scale[axis] = base_val
    obj.keyframe_insert(data_path="scale", index=axis, frame=frame_end)

def animate_dust_particles(center, volume_size=(5, 5, 5), density=20, color=(1, 1, 1, 1), frame_start=1, frame_end=5000):
    """Creates a group of small drifting motes."""
    container = bpy.data.collections.get("DustParticles")
    if not container:
        container = bpy.data.collections.new("DustParticles")
        bpy.context.scene.collection.children.link(container)

    mat = bpy.data.materials.get("DustMat")
    if not mat:
        mat = bpy.data.materials.new(name="DustMat")
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Emission Strength"].default_value = 2.0
        mat.blend_method = 'BLEND'

    for i in range(density):
        loc = center + mathutils.Vector((
            random.uniform(-volume_size[0], volume_size[0]),
            random.uniform(-volume_size[1], volume_size[1]),
            random.uniform(0, volume_size[2])
        ))
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.01, location=loc)
        mote = bpy.context.object
        mote.name = f"DustMote_{i}"
        container.objects.link(mote)
        for col in mote.users_collection:
            if col != container:
                col.objects.unlink(mote)
        mote.data.materials.append(mat)

        insert_looping_noise(mote, "location", strength=0.2, scale=20.0, frame_start=frame_start, frame_end=frame_end)

        mote.hide_render = True
        mote.keyframe_insert(data_path="hide_render", frame=frame_start - 1)
        mote.hide_render = False
        mote.keyframe_insert(data_path="hide_render", frame=frame_start)
        mote.hide_render = True
        mote.keyframe_insert(data_path="hide_render", frame=frame_end)

def apply_fade_transition(objs, frame_start, frame_end, mode='IN', duration=12):
    """Smoothly fades objects in or out using emission strength if they have materials."""
    for obj in objs:
        if obj.type != 'MESH': continue
        for slot in obj.material_slots:
            mat = slot.material
            if not mat or not mat.use_nodes: continue
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if not bsdf: continue

            if mode == 'IN':
                bsdf.inputs["Emission Strength"].default_value = 0.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=frame_start)
                bsdf.inputs["Emission Strength"].default_value = 5.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=frame_start + duration)
            else: # OUT
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=frame_end - duration)
                bsdf.inputs["Emission Strength"].default_value = 0.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=frame_end)

def camera_push_in(cam, target, frame_start, frame_end, distance=5):
    """Animates camera moving towards target."""
    direction = (target.location - cam.location).normalized()
    cam.keyframe_insert(data_path="location", frame=frame_start)
    cam.location += direction * distance
    cam.keyframe_insert(data_path="location", frame=frame_end)

def camera_pull_out(cam, target, frame_start, frame_end, distance=5):
    """Animates camera moving away from target."""
    camera_push_in(cam, target, frame_start, frame_end, distance=-distance)

def apply_camera_shake(cam, frame_start, frame_end, strength=0.05):
    """Adds a subtle handheld-style shake."""
    insert_looping_noise(cam, "location", strength=strength, scale=2.0, frame_start=frame_start, frame_end=frame_end)

def ease_action(obj, data_path, index=-1, interpolation='BEZIER', easing='EASE_IN_OUT'):
    """Sets easing for all keyframes of a specific data path."""
    if not obj.animation_data or not obj.animation_data.action: return
    for fcurve in get_action_curves(obj.animation_data.action):
        if fcurve.data_path == data_path and (index == -1 or fcurve.array_index == index):
            for kp in fcurve.keyframe_points:
                kp.interpolation = interpolation
                kp.easing = easing

def animate_blink(eye_obj, frame_start, frame_end, interval_range=(60, 180)):
    """Adds intermittent blinking by scaling the eye on Z."""
    if not eye_obj: return
    current_f = frame_start
    base_z = eye_obj.scale[2]

    while current_f < frame_end:
        eye_obj.scale[2] = base_z
        eye_obj.keyframe_insert(data_path="scale", index=2, frame=current_f)

        # Random interval between blinks
        blink_start = current_f + random.randint(*interval_range)
        if blink_start + 6 > frame_end: break

        # Blink sequence: Open -> Closed -> Open
        eye_obj.keyframe_insert(data_path="scale", index=2, frame=blink_start)
        eye_obj.scale[2] = base_z * 0.1
        eye_obj.keyframe_insert(data_path="scale", index=2, frame=blink_start + 3)
        eye_obj.scale[2] = base_z
        eye_obj.keyframe_insert(data_path="scale", index=2, frame=blink_start + 6)

        current_f = blink_start + 6
