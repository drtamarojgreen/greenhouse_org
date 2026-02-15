import bpy
import random
import math
import mathutils

def get_action_curves(action, create_if_missing=False):
    """Helper to get fcurves/curves collection from Action for Blender 5.0+ compatibility."""
    if not action: return []
    
    # Check legacy fcurves first, but only return if populated
    if hasattr(action, 'fcurves') and len(action.fcurves) > 0:
        return action.fcurves
    if hasattr(action, 'curves') and len(action.curves) > 0:
        return action.curves
        
    # Blender 5.0 / Animation 2025 Layered Action support
    if hasattr(action, 'layer') and hasattr(action.layer, 'fcurves'):
        return action.layer.fcurves
    if hasattr(action, 'layers'):
        if len(action.layers) == 0 and create_if_missing:
            action.layers.new(name="Layer")
        if len(action.layers) > 0 and hasattr(action.layers[0], 'fcurves'):
            return action.layers[0].fcurves
    return []

def get_or_create_fcurve(action, data_path, index=0, ref_obj=None):
    """
    Retrieves or creates an F-Curve, handling legacy and Blender 5.0+ (Layered Action) APIs.
    ref_obj: The object/datablock the action is assigned to (required for Blender 5.0+ new actions).
    """
    curves = get_action_curves(action, create_if_missing=True)
    
    # Legacy / Standard Collection Access
    if not (isinstance(curves, list) and not curves):
        for fc in curves:
            if fc.data_path == data_path and fc.array_index == index:
                return fc
        return curves.new(data_path=data_path, index=index)
    
    # Blender 5.0+ Fallback
    if hasattr(action, 'fcurve_ensure_for_datablock') and ref_obj:
        return action.fcurve_ensure_for_datablock(ref_obj, data_path, index=index)
    return None

def get_eevee_engine_id():
    """Probes Blender for the correct Eevee engine identifier (EEVEE vs EEVEE_NEXT)."""
    # Check render engines available in current build
    # In some 4.2+ builds it is BLENDER_EEVEE_NEXT, in 5.0 it might revert to BLENDER_EEVEE
    # We probe by checking what the current scene allows
    try:
        # Fallback list in order of preference
        for engine in ['BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE']:
            if engine in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items:
                return engine
    except Exception:
        pass
    return 'BLENDER_EEVEE' # Legacy default

def get_compositor_node_tree(scene):
    """Safely retrieves the compositor node tree for Blender 4.x/5.x compatibility."""
    if hasattr(scene, "use_nodes") and not scene.use_nodes:
        scene.use_nodes = True
    
    tree = getattr(scene, 'node_tree', None) or \
           getattr(scene, 'compositing_node_group', None) or \
           getattr(scene, 'compositor_node_tree', None)
    
    if not tree and hasattr(bpy.data, "node_groups"):
        # Fallback: Search for the first available Compositing Node Tree
        for group in bpy.data.node_groups:
            if group.type in ('COMPOSITING', 'CompositorNodeTree'):
                tree = group
                break

    # Explicit creation if missing (Blender 5.0+ edge case)
    if not tree and hasattr(bpy.data, "node_groups"):
        try:
            tree = bpy.data.node_groups.new(name="Compositing Nodetree", type='CompositorNodeTree')
        except (TypeError, ValueError):
            tree = bpy.data.node_groups.new(name="Compositing Nodetree", type='COMPOSITING')

    # Ensure it is assigned to the scene
    if tree and hasattr(scene, 'compositing_node_group') and not getattr(scene, 'compositing_node_group', None):
        try:
            scene.compositing_node_group = tree
        except Exception:
            pass

    return tree

def create_mix_node(tree, node_type_legacy, node_type_modern, blend_type='MIX', data_type='RGBA'):
    """Creates a Mix node handling version differences (MixRGB vs Mix Node)."""
    node = None
    # Try legacy, then modern, then generic ShaderNodeMix (unified in 4.0+)
    types_to_try = [node_type_legacy, node_type_modern, 'ShaderNodeMix']
    
    for n_type in types_to_try:
        try:
            node = tree.nodes.new(n_type)
            break
        except RuntimeError:
            continue
            
    if node is None:
        raise RuntimeError(f"Could not create Mix node. Tried: {types_to_try}")

    if hasattr(node, 'data_type'):
        node.data_type = data_type
    
    if hasattr(node, 'blend_type'):
        try:
            node.blend_type = blend_type
        except (TypeError, AttributeError, ValueError):
            pass
            
    return node

def get_mix_sockets(node):
    """Returns (Factor, Input1, Input2) sockets for a Mix node."""
    inputs = node.inputs
    # Modern Mix Node (Blender 3.4+)
    if 'A' in inputs and 'B' in inputs:
        return inputs['Factor'], inputs['A'], inputs['B']
    # Legacy MixRGB
    return inputs[0], inputs[1], inputs[2]

def get_mix_output(node):
    """Returns the main output socket for a Mix node."""
    return node.outputs.get('Result') or node.outputs.get('Image') or node.outputs.get('Color') or node.outputs[0]

def set_principled_socket(mat_or_node, socket_name, value, frame=None):
    """Guarded setter for Principled BSDF sockets to handle naming drift (e.g. Specular)."""
    node = mat_or_node
    if hasattr(mat_or_node, "node_tree"):
        node = mat_or_node.node_tree.nodes.get("Principled BSDF")

    if not node: return False

    # Mapping of legacy names to modern names
    mapping = {
        'Specular': ['Specular', 'Specular IOR Level'],
        'Transmission': ['Transmission', 'Transmission Weight'],
        'Emission': ['Emission', 'Emission Color'],
    }

    target_sockets = mapping.get(socket_name, [socket_name])

    for s in target_sockets:
        if s in node.inputs:
            node.inputs[s].default_value = value
            if frame is not None:
                node.inputs[s].keyframe_insert(data_path="default_value", frame=frame)
            return True

    print(f"Warning: Could not find socket {socket_name} (or alternatives) on {node.name}")
    return False

def patch_fbx_importer():
    """
    Patches the Blender 5.0 FBX importer to handle missing 'files' attribute.
    Centralized utility to avoid redundancy.
    """
    try:
        import sys
        # Attempt to locate the loaded io_scene_fbx module
        fbx_module = sys.modules.get('io_scene_fbx')
        if not fbx_module:
            try:
                import io_scene_fbx
                fbx_module = io_scene_fbx
            except ImportError:
                pass

        if fbx_module and hasattr(fbx_module, 'ImportFBX'):
            ImportFBX = fbx_module.ImportFBX
            if not getattr(ImportFBX, '_is_patched', False):
                original_execute = ImportFBX.execute
                def patched_execute(self, context):
                    if not hasattr(self, 'files'):
                        self.files = []
                    return original_execute(self, context)
                ImportFBX.execute = patched_execute
                ImportFBX._is_patched = True
                print("Patched io_scene_fbx.ImportFBX for Blender 5.0 compatibility.")
                return True
    except Exception as e:
        print(f"Warning: Failed to patch FBX importer: {e}")
    return False

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

def animate_foliage_wind(objects, strength=0.05, frame_start=1, frame_end=10000):
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

    fcurve = get_or_create_fcurve(light_obj.data.animation_data.action, "energy", ref_obj=light_obj.data)
    if not fcurve:
        print(f"Warning: Could not access fcurves for light {light_name}")
        return

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

def insert_looping_noise(obj, data_path, index=-1, frame_start=1, frame_end=10000, strength=0.05, scale=10.0, phase=None):
    """Inserts noise modifier to a data path, ensuring the range is respected."""
    if not obj.animation_data:
        obj.animation_data_create()
    if not obj.animation_data.action:
        obj.animation_data.action = bpy.data.actions.new(name=f"Noise_{obj.name}_{data_path.replace('.', '_')}")

    action = obj.animation_data.action
    indices = [index] if index >= 0 else [0, 1, 2]

    for idx in indices:
        fcurve = get_or_create_fcurve(action, data_path, idx, ref_obj=obj)
        
        if not fcurve:
            print(f"Warning: Could not access/create fcurve for {obj.name} ({data_path}[{idx}])")
            continue

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

def animate_dust_particles(center, volume_size=(5, 5, 5), density=20, color=(1, 1, 1, 1), frame_start=1, frame_end=10000):
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

def animate_saccadic_movement(eye_obj, gaze_target, frame_start, frame_end, strength=0.02):
    """Adds quick, subtle eye darting when looking at a target."""
    if not eye_obj or not gaze_target: return
    insert_looping_noise(eye_obj, "rotation_euler", strength=strength, scale=2.0, frame_start=frame_start, frame_end=frame_end)

def animate_finger_tapping(finger_objs, frame_start, frame_end, cycle=40):
    """Adds rhythmic tapping to vine fingers."""
    for i, f_obj in enumerate(finger_objs):
        offset = i * 5
        for f in range(frame_start + offset, frame_end, cycle):
            f_obj.rotation_euler[0] = 0
            f_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=f)
            f_obj.rotation_euler[0] = math.radians(15)
            f_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=f + cycle // 4)
            f_obj.rotation_euler[0] = 0
            f_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=f + cycle // 2)

def apply_reactive_foliage(foliage_objs, trigger_obj, frame_start, frame_end, threshold=3.0):
    """Increases foliage sway intensity when a trigger object is nearby."""
    for obj in foliage_objs:
        if not obj.animation_data or not obj.animation_data.action: continue
        for fcurve in get_action_curves(obj.animation_data.action):
            for mod in fcurve.modifiers:
                if mod.type == 'NOISE':
                    # In a real script we would keyframe the strength, here we simulate with noise phase
                    mod.strength = 0.05 # Base
                    for f in range(frame_start, frame_end, 24):
                        dist = (obj.location - trigger_obj.location).length
                        if dist < threshold:
                            # Dynamic property animation in Blender is usually via Drivers or Keyframes
                            # For simplicity in this procedural script, we set a high base if they are ever close
                            mod.strength = 0.15
                            break

def animate_leaf_twitches(leaf_objs, frame_start, frame_end):
    """Adds randomized 'ear-like' twitches to head-leaves."""
    for leaf in leaf_objs:
        insert_looping_noise(leaf, "rotation_euler", index=1, strength=0.1, scale=5.0, frame_start=frame_start, frame_end=frame_end)

def animate_pulsing_emission(obj, frame_start, frame_end, base_strength=5.0, pulse_amplitude=10.0, cycle=48):
    """Implements a breathing light emission effect."""
    for slot in obj.material_slots:
        mat = slot.material
        if not mat or not mat.use_nodes: continue
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if not bsdf: continue

        for f in range(frame_start, frame_end + 1, cycle):
            bsdf.inputs["Emission Strength"].default_value = base_strength
            bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=f)
            bsdf.inputs["Emission Strength"].default_value = base_strength + pulse_amplitude
            bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=f + cycle // 2)

def animate_dynamic_pupils(pupil_objs, light_energy_provider, frame_start, frame_end):
    """Scales pupils based on scene light energy (simulated)."""
    for p in pupil_objs:
        p.scale = (1, 1, 1)
        p.keyframe_insert(data_path="scale", frame=frame_start)
        # Contract in 'light' scenes, dilate in 'shadow'
        p.scale = (0.5, 0.5, 0.5)
        p.keyframe_insert(data_path="scale", frame=2000) # Peak light
        p.scale = (1.5, 1.5, 1.5)
        p.keyframe_insert(data_path="scale", frame=2300) # Shadow

def apply_thought_motes(character_obj, frame_start, frame_end, count=5):
    """Floating icons that drift near characters."""
    for i in range(count):
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.05, location=character_obj.location + mathutils.Vector((0,0,2)))
        mote = bpy.context.object
        mote.name = f"ThoughtMote_{character_obj.name}_{i}"
        insert_looping_noise(mote, "location", strength=0.5, scale=10.0, frame_start=frame_start, frame_end=frame_end)

def animate_gait(torso, mode='HEAVY', frame_start=1, frame_end=10000):
    """Differentiates walk cycles by delegating to asset-specific animation logic."""
    step_h = 0.2 if mode == 'HEAVY' else 0.08
    cycle_l = 64 if mode == 'HEAVY' else 32

    # We attempt to import asset script here to avoid circular imports if needed
    # but since it's already in path we can use the torso's custom properties or naming
    import plant_humanoid
    plant_humanoid.animate_walk(torso, frame_start, frame_end, step_height=step_h, cycle_length=cycle_l)

def animate_cloak_sway(cloak_obj, frame_start, frame_end):
    """Animate cloak with noise."""
    insert_looping_noise(cloak_obj, "rotation_euler", index=0, strength=0.05, scale=5.0, frame_start=frame_start, frame_end=frame_end)

def animate_shoulder_shrug(torso_obj, frame_start, frame_end, cycle=120):
    """Adds subtle shoulder shrugs."""
    for f in range(frame_start, frame_end, cycle):
        torso_obj.rotation_euler[0] = math.radians(5)
        torso_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=f + cycle // 2)
        torso_obj.rotation_euler[0] = 0
        torso_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=f + cycle)

def animate_gnome_stumble(gnome_obj, frame):
    """Adds an 'off-balance' frame to walk cycle."""
    gnome_obj.rotation_euler[1] = math.radians(15)
    gnome_obj.keyframe_insert(data_path="rotation_euler", index=1, frame=frame)
    gnome_obj.rotation_euler[1] = 0
    gnome_obj.keyframe_insert(data_path="rotation_euler", index=1, frame=frame + 5)

def apply_reactive_bloom(flower_obj, trigger_obj, frame_start, frame_end):
    """Flower scales up when trigger passes."""
    pass # Implementation similar to reactive foliage

def apply_thermal_transition(master, frame_start, frame_end, color_start=(0.5, 0, 1), color_end=(1, 0.5, 0)):
    """Transitions world background color between two thermal-inspired colors."""
    bg = master.scene.world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (*color_start, 1)
        bg.inputs[0].keyframe_insert(data_path="default_value", frame=frame_start)
        bg.inputs[0].default_value = (*color_end, 1)
        bg.inputs[0].keyframe_insert(data_path="default_value", frame=frame_end)

def setup_chromatic_aberration(scene, strength=0.01):
    """Adds a Lens Distortion node for chromatic aberration."""
    tree = get_compositor_node_tree(scene)
    if not tree: return None
    distort = tree.nodes.get("ChromaticAberration") or tree.nodes.new(type='CompositorNodeLensdist')
    distort.name = "ChromaticAberration"
    distort.inputs['Dispersion'].default_value = strength
    return distort

def setup_god_rays(scene):
    """Configure volumetric shafts with color ramp and intensity shifts."""
    beam = bpy.data.objects.get("LightShaftBeam")
    if beam:
        # Volumetric shaft color shift (Green to Gold)
        beam.data.color = (0, 1, 0.2) # Greenish
        beam.data.keyframe_insert(data_path="color", frame=401)
        beam.data.color = (1, 0.7, 0.1) # Golden
        beam.data.keyframe_insert(data_path="color", frame=3801)

        # Intensity pulse
        animate_light_flicker("LightShaftBeam", 1, 10000, strength=0.1)

    sun = bpy.data.objects.get("Sun")
    if sun:
        sun.data.color = (1, 0.9, 0.8) # Neutral warm

def animate_vignette(scene, frame_start, frame_end, start_val=1.0, end_val=0.5):
    """Decreases vignette radius for high tension."""
    tree = get_compositor_node_tree(scene)
    if not tree: return
    vig = tree.nodes.get("Vignette") or tree.nodes.new(type='CompositorNodeEllipseMask')
    vig.name = "Vignette"
    vig.width = start_val
    vig.height = start_val
    vig.keyframe_insert(data_path="width", frame=frame_start)
    vig.keyframe_insert(data_path="height", frame=frame_start)
    vig.width = end_val
    vig.height = end_val
    vig.keyframe_insert(data_path="width", frame=frame_end)
    vig.keyframe_insert(data_path="height", frame=frame_end)

def apply_neuron_color_coding(neuron_mat, frame, color=(1, 0, 0)):
    """Shifts neuron emission color."""
    if not neuron_mat or not neuron_mat.use_nodes: return
    bsdf = neuron_mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Emission Color"].default_value = (*color, 1)
        bsdf.inputs["Emission Color"].keyframe_insert(data_path="default_value", frame=frame)

def setup_bioluminescent_flora(mat, color=(0, 1, 0.5)):
    """Adds glowing 'veins' to materials."""
    if not mat or not mat.use_nodes: return
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    # Simple glowing effect
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Emission Color"].default_value = (*color, 1)
        bsdf.inputs["Emission Strength"].default_value = 2.0

def animate_mood_fog(scene, frame, density=0.01):
    """Adjusts volumetric haze density."""
    world = scene.world
    if not world.use_nodes: return
    vol = world.node_tree.nodes.get("Volume Scatter")
    if vol:
        vol.inputs['Density'].default_value = density
        vol.inputs['Density'].keyframe_insert(data_path="default_value", frame=frame)

def apply_film_flicker(scene, frame_start, frame_end, strength=0.05):
    """Randomized brightness jumps."""
    tree = get_compositor_node_tree(scene)
    if not tree: return
    
    bright = tree.nodes.get("Bright/Contrast")
    if not bright:
        try:
            bright = tree.nodes.new('CompositorNodeBrightContrast')
            bright.name = "Bright/Contrast"
        except RuntimeError:
            return

    for f in range(frame_start, frame_end + 1, 2):
        bright.inputs['Bright'].default_value = random.uniform(-strength, strength)
        bright.inputs['Bright'].keyframe_insert(data_path="default_value", frame=f)

def apply_glow_trails(scene):
    """Ghosting/Trail effect (simplified via Vector Blur)."""
    tree = get_compositor_node_tree(scene)
    if not tree: return None
    blur = tree.nodes.get("GlowTrail") or tree.nodes.new(type='CompositorNodeVecBlur')
    blur.name = "GlowTrail"
    if hasattr(blur, 'factor'):
        blur.factor = 0.8
    if hasattr(blur, 'samples'):
        blur.samples = 16
    return blur

def setup_saturation_control(scene):
    """Adds a Hue/Saturation node for global desaturation beats."""
    tree = get_compositor_node_tree(scene)
    if not tree: return None
    huesat = tree.nodes.get("GlobalSaturation") or tree.nodes.new(type='CompositorNodeHueSat')
    huesat.name = "GlobalSaturation"
    huesat.inputs['Saturation'].default_value = 1.0
    return huesat

def apply_desaturation_beat(scene, frame_start, frame_end, saturation=0.2):
    """Drops saturation for a specific range."""
    tree = get_compositor_node_tree(scene)
    if not tree: return
    huesat = tree.nodes.get("GlobalSaturation")
    if huesat:
        huesat.inputs['Saturation'].default_value = 1.0
        huesat.inputs['Saturation'].keyframe_insert(data_path="default_value", frame=frame_start - 5)
        huesat.inputs['Saturation'].default_value = saturation
        huesat.inputs['Saturation'].keyframe_insert(data_path="default_value", frame=frame_start)
        huesat.inputs['Saturation'].keyframe_insert(data_path="default_value", frame=frame_end)
        huesat.inputs['Saturation'].default_value = 1.0
        huesat.inputs['Saturation'].keyframe_insert(data_path="default_value", frame=frame_end + 5)
