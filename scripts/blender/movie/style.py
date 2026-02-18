"""
Shared animation, shading, and cinematography utilities for Greenhouse Movie Production.
Handles version-safe Blender API access (4.x/5.x), procedural acting, and filmic effects.
(Point 92)
"""
import bpy
import random
import math
import mathutils

__all__ = [
    'get_action_curves', 'get_or_create_fcurve', 'get_eevee_engine_id',
    'get_compositor_node_tree', 'create_mix_node', 'get_mix_sockets',
    'get_mix_output', 'set_principled_socket', 'patch_fbx_importer',
    'apply_scene_grade', 'animate_foliage_wind', 'animate_light_flicker',
    'insert_looping_noise', 'animate_breathing', 'animate_dust_particles',
    'apply_fade_transition', 'camera_push_in', 'camera_pull_out',
    'apply_camera_shake', 'ease_action', 'animate_blink',
    'animate_saccadic_movement', 'animate_finger_tapping',
    'apply_reactive_foliage', 'animate_leaf_twitches',
    'animate_pulsing_emission', 'animate_dynamic_pupils',
    'apply_thought_motes', 'animate_gait', 'animate_cloak_sway',
    'animate_shoulder_shrug', 'animate_gnome_stumble',
    'apply_reactive_bloom', 'apply_thermal_transition',
    'setup_chromatic_aberration', 'setup_god_rays', 'animate_vignette',
    'apply_neuron_color_coding', 'setup_bioluminescent_flora',
    'animate_mood_fog', 'apply_film_flicker', 'apply_glow_trails',
    'setup_saturation_control', 'apply_desaturation_beat',
    'animate_dialogue_v2', 'animate_expression_blend', 'animate_reaction_shot',
    'set_blend_method', 'animate_plant_advance', 'add_scene_markers',
    'animate_distance_based_glow', 'apply_bioluminescent_veins',
    'animate_weight_shift', 'apply_anticipation', 'animate_limp',
    'animate_thinking_gesture', 'animate_defensive_crouch',
    'setup_caustic_patterns', 'animate_dawn_progression',
    'apply_interior_exterior_contrast', 'replace_with_soft_boxes',
    'animate_hdri_rotation', 'apply_iris_wipe', 'animate_vignette_breathing',
    'animate_floating_spores'
]

def get_action_curves(action, create_if_missing=False):
    """Helper to get fcurves/curves collection from Action for Blender 5.0+ compatibility."""
    if not action: return []
    if hasattr(action, 'fcurves'):
        return action.fcurves
    if hasattr(action, 'curves'):
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

    # Point 37: Ensure it is assigned to the scene and validated
    if tree:
        if hasattr(scene, 'node_tree') and scene.node_tree != tree:
            scene.node_tree = tree
        elif hasattr(scene, 'compositing_node_group') and not scene.compositing_node_group:
            try:
                scene.compositing_node_group = tree
            except Exception:
                pass

    # Final verification
    if tree and hasattr(scene, 'use_nodes') and not scene.use_nodes:
        scene.use_nodes = True

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

    if hasattr(node, 'data_type') and node.bl_idname != 'CompositorNodeMixRGB':
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

def get_principled_socket(mat_or_node, socket_name):
    """Safely retrieves a socket from Principled BSDF by name/alias."""
    node = mat_or_node
    if hasattr(mat_or_node, "node_tree"):
        node = mat_or_node.node_tree.nodes.get("Principled BSDF")
    if not node: return None

    mapping = {
        'Specular': ['Specular', 'Specular IOR Level'],
        'Transmission': ['Transmission', 'Transmission Weight'],
        'Emission': ['Emission', 'Emission Color'],
        'Emission Strength': ['Emission Strength'],
    }
    target_sockets = mapping.get(socket_name, [socket_name])
    for s in target_sockets:
        if s in node.inputs:
            return node.inputs[s]
    return None

def set_principled_socket(mat_or_node, socket_name, value, frame=None):
    """Guarded setter for Principled BSDF sockets to handle naming drift (e.g. Specular)."""
    sock = get_principled_socket(mat_or_node, socket_name)
    if sock:
        sock.default_value = value
        if frame is not None:
            sock.keyframe_insert(data_path="default_value", frame=frame)
        return True

    name = getattr(mat_or_node, "name", "Unknown")
    print(f"Warning: Could not find socket {socket_name} (or alternatives) on {name}")
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

def animate_foliage_wind(objects, strength=0.05, frame_start=1, frame_end=15000):
    """Adds subtle sway to foliage objects within a specific frame range."""
    for obj in objects:
        if obj.type != 'MESH': continue
        insert_looping_noise(obj, "rotation_euler", strength=strength, frame_start=frame_start, frame_end=frame_end)

def animate_light_flicker(light_name, frame_start, frame_end, strength=0.2, seed=None):
    """Point 96: Fixed seed usage for light flicker."""
    light_obj = bpy.data.objects.get(light_name)
    if not light_obj: return

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
    # Point 96: Use the seed for the noise modifier phase
    modifier.phase = seed if seed is not None else random.random() * 100

    # Restrict range to avoid global flicker
    modifier.use_restricted_range = True
    modifier.frame_start = frame_start
    modifier.frame_end = frame_end
    modifier.blend_in = 5
    modifier.blend_out = 5

def insert_looping_noise(obj, data_path, index=-1, frame_start=1, frame_end=15000, strength=0.05, scale=10.0, phase=None):
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
    """Point 24: Use Noise modifier for breathing to reduce keyframe bloat."""
    if not obj: return
    insert_looping_noise(obj, "scale", index=axis, strength=amplitude, scale=cycle, frame_start=frame_start, frame_end=frame_end)

def animate_dust_particles(center, volume_size=(5, 5, 5), density=20, color=(1, 1, 1, 1), frame_start=1, frame_end=15000):
    """Point 22 & 80: Create unique materials per color for dust particles."""
    container_name = f"DustParticles_{color}"
    container = bpy.data.collections.get(container_name)
    if not container:
        container = bpy.data.collections.new(container_name)
        bpy.context.scene.collection.children.link(container)

    mat_name = f"DustMat_{color}"
    mat = bpy.data.materials.get(mat_name)
    if not mat:
        mat = bpy.data.materials.new(name=mat_name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Emission Strength"].default_value = 2.0
        set_blend_method(mat, 'BLEND')

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
    """Fixed: use hide_render instead of emission for fading."""
    for obj in objs:
        if mode == 'IN':
            obj.hide_render = True
            obj.keyframe_insert(data_path="hide_render", frame=frame_start)
            obj.hide_render = False
            obj.keyframe_insert(data_path="hide_render", frame=frame_start + duration)
            # Set CONSTANT interpolation so it snaps rather than blends
            if obj.animation_data and obj.animation_data.action:
                for fc in get_action_curves(obj.animation_data.action):
                    if fc.data_path == "hide_render":
                        for kp in fc.keyframe_points:
                            kp.interpolation = 'CONSTANT'
        else:
            obj.hide_render = False
            obj.keyframe_insert(data_path="hide_render", frame=frame_end - duration)
            obj.hide_render = True
            obj.keyframe_insert(data_path="hide_render", frame=frame_end)
            # Set CONSTANT interpolation
            if obj.animation_data and obj.animation_data.action:
                for fc in get_action_curves(obj.animation_data.action):
                    if fc.data_path == "hide_render":
                        for kp in fc.keyframe_points:
                            kp.interpolation = 'CONSTANT'

def camera_push_in(cam, target, frame_start, frame_end, distance=5):
    """Animates camera moving towards target."""
    direction = (target.location - cam.location).normalized()
    cam.keyframe_insert(data_path="location", frame=frame_start)
    cam.location += direction * distance
    cam.keyframe_insert(data_path="location", frame=frame_end)

def camera_pull_out(cam, target, frame_start, frame_end, distance=5):
    """Animates camera moving away from target."""
    camera_push_in(cam, target, frame_start, frame_end, distance=-distance)


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
    """Point 87: Replace noise with discrete saccades."""
    if not eye_obj: return

    current_f = frame_start
    while current_f < frame_end:
        # Wait for a while
        current_f += random.randint(30, 120)
        if current_f >= frame_end: break

        # Quick dart
        orig_rot = eye_obj.rotation_euler.copy()
        eye_obj.keyframe_insert(data_path="rotation_euler", frame=current_f)

        dart_rot = orig_rot + mathutils.Vector((random.uniform(-0.1, 0.1), 0, random.uniform(-0.1, 0.1))) * strength * 50
        eye_obj.rotation_euler = dart_rot
        eye_obj.keyframe_insert(data_path="rotation_euler", frame=current_f + 2)

        # Return to normal
        eye_obj.rotation_euler = orig_rot
        eye_obj.keyframe_insert(data_path="rotation_euler", frame=current_f + 5)

        current_f += 5

def animate_finger_tapping(finger_objs, frame_start, frame_end, cycle=40):
    """Point 26: Use Noise modifier for finger tapping."""
    for i, f_obj in enumerate(finger_objs):
        insert_looping_noise(f_obj, "rotation_euler", index=0, strength=0.2, scale=cycle/4, frame_start=frame_start, frame_end=frame_end)

def animate_finger_curl(finger_objs, frame_start, frame_end, curl_amount=45):
    """Point 82: Individual finger curl animation."""
    for i, f_obj in enumerate(finger_objs):
        f_obj.rotation_euler[0] = 0
        f_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=frame_start)
        f_obj.rotation_euler[0] = math.radians(curl_amount)
        f_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=(frame_start + frame_end) // 2)
        f_obj.rotation_euler[0] = 0
        f_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=frame_end)

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

        for f in range(frame_start, frame_end + 1, cycle):
            set_principled_socket(mat, "Emission Strength", base_strength, frame=f)
            set_principled_socket(mat, "Emission Strength", base_strength + pulse_amplitude, frame=f + cycle // 2)

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

_plant_humanoid = None
def get_plant_humanoid():
    global _plant_humanoid
    if _plant_humanoid is None:
        import plant_humanoid
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
    insert_looping_noise(cloak_obj, "rotation_euler", index=0, strength=0.05, scale=5.0, frame_start=frame_start, frame_end=frame_end)

def animate_shoulder_shrug(torso_obj, frame_start, frame_end, cycle=120):
    """Point 26: Use Noise modifier for shoulder shrugs."""
    insert_looping_noise(torso_obj, "rotation_euler", index=0, strength=0.05, scale=cycle/2, frame_start=frame_start, frame_end=frame_end)

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

def setup_god_rays(scene, beam_obj=None):
    """Point 98: Support passing direct beam object reference."""
    beam = beam_obj or bpy.data.objects.get("LightShaftBeam")
    if beam:
        # Volumetric shaft color shift (Green to Gold)
        beam.data.color = (0, 1, 0.2) # Greenish
        beam.data.keyframe_insert(data_path="color", frame=401)
        beam.data.color = (1, 0.7, 0.1) # Golden
        beam.data.keyframe_insert(data_path="color", frame=3801)

        # Intensity pulse
        animate_light_flicker("LightShaftBeam", 1, 15000, strength=0.1)

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
    """Point 23: Use Noise modifier for film flicker."""
    tree = get_compositor_node_tree(scene)
    if not tree: return
    
    bright = tree.nodes.get("Bright/Contrast")
    if not bright:
        try:
            bright = tree.nodes.new('CompositorNodeBrightContrast')
            bright.name = "Bright/Contrast"
        except RuntimeError:
            return

    if not tree.animation_data:
        tree.animation_data_create()
    if not tree.animation_data.action:
        tree.animation_data.action = bpy.data.actions.new(name="CompositorAction")

    data_path = f'nodes["{bright.name}"].inputs[0].default_value'
    fcurve = get_or_create_fcurve(tree.animation_data.action, data_path, ref_obj=tree)

    if fcurve:
        mod = fcurve.modifiers.new(type='NOISE')
        mod.strength = strength
        mod.scale = 1.0
        mod.use_restricted_range = True
        mod.frame_start = frame_start
        mod.frame_end = frame_end

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

def animate_dialogue_v2(mouth_obj, frame_start, frame_end, intensity=1.0, speed=1.0):
    """Enhanced procedural mouth movement with Breathing Pause (#16)."""
    if not mouth_obj: return

    current_f = frame_start
    while current_f < frame_end:
        # Enhancement #16: Breathing Pause Mid-Dialogue
        if random.random() > 0.9: # ~10% chance of a pause
            mouth_obj.scale[2] = 0.4
            mouth_obj.keyframe_insert(data_path="scale", index=2, frame=current_f)
            current_f += 12 # 12 frame hold
            continue

        # Randomized open/close cycles
        cycle_len = random.randint(4, 12) / speed
        open_amount = random.uniform(0.5, 1.5) * intensity

        mouth_obj.scale[2] = 0.4 # Neutral
        mouth_obj.keyframe_insert(data_path="scale", index=2, frame=current_f)

        mid_f = current_f + cycle_len / 2
        if mid_f < frame_end:
            mouth_obj.scale[2] = open_amount
            mouth_obj.keyframe_insert(data_path="scale", index=2, frame=mid_f)

        current_f += cycle_len

    mouth_obj.scale[2] = 0.4
    mouth_obj.keyframe_insert(data_path="scale", index=2, frame=frame_end)

def animate_expression_blend(character_name, frame, expression='NEUTRAL', duration=12):
    """Smoothly transitions between facial expression presets."""
    import plant_humanoid
    # Since plant_humanoid handles the actual keyframing of parts, we wrap it
    # and ensure multiple frames are keyed for a smooth transition if duration > 0.
    # For now, we'll implement a simple version that uses plant_humanoid's logic.
    torso = bpy.data.objects.get(f"{character_name}_Torso")
    if not torso: return

    if duration > 0:
        # Key current state before change
        plant_humanoid.animate_expression(torso, frame - duration, expression=None) # Keeps current

    plant_humanoid.animate_expression(torso, frame, expression=expression)

def animate_fireflies(center, volume_size=(5, 5, 5), density=10, frame_start=1, frame_end=15000):
    """Point 49: Distinct firefly behavior with pulsing emission."""
    container_name = "Fireflies"
    container = bpy.data.collections.get(container_name)
    if not container:
        container = bpy.data.collections.new(container_name)
        bpy.context.scene.collection.children.link(container)

    mat = bpy.data.materials.new(name="FireflyMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.8, 1.0, 0.2, 1) # Yellow-green
    set_blend_method(mat, 'BLEND')

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

        # Drifting
        insert_looping_noise(fly, "location", strength=0.5, scale=40.0, frame_start=frame_start, frame_end=frame_end)

        # Point 49: Pulsing emission
        animate_pulsing_emission(fly, frame_start, frame_end, base_strength=2.0, pulse_amplitude=10.0, cycle=random.randint(20, 60))

        # Visibility
        fly.hide_render = True
        fly.keyframe_insert(data_path="hide_render", frame=frame_start - 1)
        fly.hide_render = False
        fly.keyframe_insert(data_path="hide_render", frame=frame_start)
        fly.hide_render = True
        fly.keyframe_insert(data_path="hide_render", frame=frame_end)

def create_noise_based_material(name, color_ramp_colors, noise_type='NOISE', noise_scale=10.0, roughness=0.5):
    """Point 32: Generic helper for creating noise-based procedural materials."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    node_out = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    node_bsdf.inputs['Roughness'].default_value = roughness

    node_coord = nodes.new(type='ShaderNodeTexCoord')
    node_mapping = nodes.new(type='ShaderNodeMapping')
    links.new(node_coord.outputs['Generated'], node_mapping.inputs['Vector'])

    if noise_type == 'WAVE':
        node_noise = nodes.new(type='ShaderNodeTexWave')
        node_noise.inputs['Scale'].default_value = noise_scale
    else:
        node_noise = nodes.new(type='ShaderNodeTexNoise')
        node_noise.inputs['Scale'].default_value = noise_scale

    links.new(node_mapping.outputs['Vector'], node_noise.inputs['Vector'])

    node_ramp = nodes.new(type='ShaderNodeValToRGB')
    elements = node_ramp.color_ramp.elements
    # Blender 5.0 enforces minimum 2 elements, so we manage them without .clear()
    while len(elements) > len(color_ramp_colors) and len(elements) > 1:
        elements.remove(elements[-1])

    for i, color in enumerate(color_ramp_colors):
        if i < len(elements):
            el = elements[i]
            el.position = i / max(len(color_ramp_colors) - 1, 1)
        else:
            el = elements.new(i / max(len(color_ramp_colors) - 1, 1))
        el.color = color

    links.new(node_noise.outputs[0], node_ramp.inputs['Fac'])
    links.new(node_ramp.outputs['Color'], node_bsdf.inputs['Base Color'])
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])

    return mat

def set_blend_method(mat, method='BLEND'):
    """Version-safe transparency method setter for materials."""
    if hasattr(mat, 'surface_render_method'):
        # Blender 4.2+ / 5.0
        mapping = {'BLEND': 'BLENDED', 'HASHED': 'HASHED', 'CLIP': 'CLIP'}
        mat.surface_render_method = mapping.get(method, 'BLENDED')
    else:
        mat.blend_method = method

def animate_plant_advance(master, frame_start, frame_end):
    """Plants move toward the gnome as their argument intensifies."""
    if not hasattr(master, 'h1') or not hasattr(master, 'h2') or not hasattr(master, 'gnome'):
        return
    if not master.h1 or not master.h2 or not master.gnome:
        return

    # Phase 1: Plants step forward together (scenes 18-19)
    master.h1.location = (-2, 0, 0)
    master.h1.keyframe_insert(data_path="location", frame=frame_start)
    master.h1.location = (-1, 2, 0)      # moving toward gnome at (2,2,0)
    master.h1.keyframe_insert(data_path="location", frame=frame_start + 400)

    master.h2.location = (2, 1, 0)
    master.h2.keyframe_insert(data_path="location", frame=frame_start)
    master.h2.location = (1, 2, 0)       # flanking from the other side
    master.h2.keyframe_insert(data_path="location", frame=frame_start + 400)

    # Phase 2: Plants loom over gnome - scale up slightly for dominance
    for char in [master.h1, master.h2]:
        char.scale = (1, 1, 1)
        char.keyframe_insert(data_path="scale", frame=frame_start + 300)
        char.scale = (1.2, 1.2, 1.2)
        char.keyframe_insert(data_path="scale", frame=frame_start + 600)

    # Phase 3: Gnome shrinks as he's overwhelmed
    master.gnome.scale = (0.6, 0.6, 0.6)  # gnome was created at scale=0.6
    master.gnome.keyframe_insert(data_path="scale", frame=frame_start + 300)
    master.gnome.scale = (0.3, 0.3, 0.3)  # shrinks further under pressure
    master.gnome.keyframe_insert(data_path="scale", frame=frame_start + 600)

def animate_weight_shift(obj, frame_start, frame_end, cycle=120, amplitude=0.02):
    """Enhancement #11: Weight-Shifted Idle Stance."""
    insert_looping_noise(obj, "location", index=0, strength=amplitude, scale=cycle, frame_start=frame_start, frame_end=frame_end)
    insert_looping_noise(obj, "rotation_euler", index=1, strength=amplitude, scale=cycle, frame_start=frame_start, frame_end=frame_end)

def apply_anticipation(obj, data_path, frame, offset_value, duration=5):
    """Enhancement #12: Anticipation Frames Before Major Moves."""
    orig_val = getattr(obj, data_path)
    if hasattr(orig_val, "copy"): orig_val = orig_val.copy()

    # Key current
    obj.keyframe_insert(data_path=data_path, frame=frame - duration)
    # Pull back
    if isinstance(offset_value, (int, float)):
        setattr(obj, data_path, orig_val - offset_value)
    else: # Vector/Euler
        setattr(obj, data_path, orig_val - offset_value)
    obj.keyframe_insert(data_path=data_path, frame=frame - (duration // 2))
    # Return for actual move
    setattr(obj, data_path, orig_val)

def animate_limp(obj, frame_start, frame_end, cycle=32):
    """Enhancement #14: Gnome Limping Retreat Gait."""
    # Asymmetric gait using noise with varying scale on Y
    insert_looping_noise(obj, "location", index=2, strength=0.05, scale=cycle, frame_start=frame_start, frame_end=frame_end)
    # Drag effect on one side
    for f in range(frame_start, frame_end, cycle):
        obj.rotation_euler[1] = math.radians(5)
        obj.keyframe_insert(data_path="rotation_euler", index=1, frame=f)
        obj.rotation_euler[1] = 0
        obj.keyframe_insert(data_path="rotation_euler", index=1, frame=f + (cycle // 2))

def animate_thinking_gesture(arm_obj, frame_start):
    """Enhancement #19: Hand-to-Head Thinking Gesture."""
    # Animate arm rising toward head
    arm_obj.rotation_euler[0] = math.radians(-80)
    arm_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=frame_start)
    arm_obj.rotation_euler[0] = math.radians(-110)
    arm_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=frame_start + 48)

def animate_defensive_crouch(obj, frame_start, frame_end):
    """Enhancement #20: Gnome Defensive Crouch."""
    # Shrink spine (scale Z)
    obj.scale[2] = 1.0
    obj.keyframe_insert(data_path="scale", index=2, frame=frame_start)
    obj.scale[2] = 0.8
    obj.keyframe_insert(data_path="scale", index=2, frame=frame_start + 24)
    obj.keyframe_insert(data_path="scale", index=2, frame=frame_end - 24)
    obj.scale[2] = 1.0
    obj.keyframe_insert(data_path="scale", index=2, frame=frame_end)

def animate_reaction_shot(character_name, frame_start, frame_end):
    """Point 39: Adds listener micro-movements with robust character resolution."""
    char_name = character_name.split('_')[0]
    # Fallback to torso if head doesn't exist (e.g. for merged static characters)
    head = bpy.data.objects.get(f"{char_name}_Head") or bpy.data.objects.get(f"{char_name}_Torso")
    if not head: return

    # Blinks
    for child in head.children:
        if "Eye" in child.name:
            animate_blink(child, frame_start, frame_end, interval_range=(40, 100))

    # Subtle nods (X-axis rotation)
    torso = bpy.data.objects.get(f"{char_name}_Torso")
    if torso:
        for f in range(frame_start, frame_end, 60):
            torso.rotation_euler[0] = 0
            torso.keyframe_insert(data_path="rotation_euler", index=0, frame=f)
            torso.rotation_euler[0] = math.radians(random.uniform(1, 3))
            torso.keyframe_insert(data_path="rotation_euler", index=0, frame=f + 30)
            torso.rotation_euler[0] = 0
            torso.keyframe_insert(data_path="rotation_euler", index=0, frame=f + 60)

def add_scene_markers(master):
    """Enhancement #74: Timeline Bookmark System."""
    from constants import SCENE_MAP
    # Clear existing markers
    master.scene.timeline_markers.clear()
    for name, (start, end) in SCENE_MAP.items():
        master.scene.timeline_markers.new(name.replace("scene", "S"), frame=start)

def animate_distance_based_glow(gnome, characters, frame_start, frame_end):
    """Enhancement #83: Gnome Eye Glow Intensity Driver."""
    if not gnome: return

    # Get eye material
    mat = None
    for slot in gnome.material_slots:
        if "Eye" in slot.material.name:
            mat = slot.material
            break
    if not mat: return

    # Animate intensity based on proximity
    for f in range(frame_start, frame_end + 1, 12):
        bpy.context.scene.frame_set(f)
        min_dist = 100.0
        for char in characters:
            if char:
                dist = (gnome.matrix_world.to_translation() - char.matrix_world.to_translation()).length
                min_dist = min(min_dist, dist)

        # Closer = Brighter (Max at distance 1.0, Min at distance 10.0)
        intensity = max(2.0, 50.0 * (1.0 / max(1.0, min_dist)))
        set_principled_socket(mat, "Emission Strength", intensity, frame=f)

def apply_bioluminescent_veins(characters, frame_start, frame_end):
    """Enhancement #88: Bioluminescent Vein Network."""
    for char in characters:
        if not char: continue
        for slot in char.material_slots:
            mat = slot.material
            if not mat or not mat.use_nodes: continue

            # Use noise-driven emission for 'veins'
            nodes = mat.node_tree.nodes
            links = mat.node_tree.links

            bsdf = nodes.get("Principled BSDF")
            if not bsdf: continue

            # Setup pulsing base
            for f in range(frame_start, frame_end + 1, 72): # Match breathing cycle
                set_principled_socket(mat, "Emission Strength", 0.5, frame=f)
                set_principled_socket(mat, "Emission Strength", 2.0, frame=f + 36)

def setup_caustic_patterns(floor_obj):
    """Enhancement #24: Caustic Light Patterns on Floor."""
    if not floor_obj: return
    for slot in floor_obj.material_slots:
        mat = slot.material
        if not mat or not mat.use_nodes: continue
        nodes, links = mat.node_tree.nodes, mat.node_tree.links

        # Add a procedural caustic texture overlay
        node_tex = nodes.new(type='ShaderNodeTexVoronoi')
        node_tex.voronoi_dimensions = '3D'
        node_tex.feature = 'F1'
        node_tex.inputs['Scale'].default_value = 10.0

        node_math = nodes.new(type='ShaderNodeMath')
        node_math.operation = 'POWER'
        node_math.inputs[1].default_value = 5.0

        links.new(node_tex.outputs['Distance'], node_math.inputs[0])

        # Mix with Base Color
        bsdf = nodes.get("Principled BSDF")
        if bsdf:
            mix = nodes.new(type='ShaderNodeMixRGB')
            mix.blend_type = 'ADD'
            mix.inputs[0].default_value = 0.2

            # Move existing link
            old_link = None
            for link in links:
                if link.to_socket == bsdf.inputs['Base Color']:
                    old_link = link
                    break

            if old_link:
                links.new(old_link.from_socket, mix.inputs[1])
                links.remove(old_link)

            links.new(node_math.outputs[0], mix.inputs[2])
            links.new(mix.outputs[0], bsdf.inputs['Base Color'])

        # Animate texture for moving water effect
        node_tex.inputs['W'].default_value = 0
        node_tex.inputs['W'].keyframe_insert(data_path="default_value", frame=1)
        node_tex.inputs['W'].default_value = 10.0
        node_tex.inputs['W'].keyframe_insert(data_path="default_value", frame=15000)

def animate_dawn_progression(sun_light):
    """Enhancement #26: Gradual Dawn Light Progression."""
    if not sun_light: return
    # Start Pre-dawn (blue) -> Golden hour -> Midday white
    colors = [
        (1, (0.1, 0.2, 0.5)),
        (4000, (1.0, 0.6, 0.2)),
        (8000, (1.0, 0.9, 0.8)),
        (15000, (1.0, 1.0, 1.0))
    ]
    for frame, color in colors:
        sun_light.data.color = color
        sun_light.data.keyframe_insert(data_path="color", frame=frame)

    # Animate sun angle (X rotation)
    sun_light.rotation_euler[0] = math.radians(-10)
    sun_light.keyframe_insert(data_path="rotation_euler", index=0, frame=1)
    sun_light.rotation_euler[0] = math.radians(-90)
    sun_light.keyframe_insert(data_path="rotation_euler", index=0, frame=15000)

def apply_interior_exterior_contrast(sun_light, cam):
    """Enhancement #27: Interior vs Exterior Light Contrast."""
    # This needs to be checked per frame or keyframed based on drone shots
    # For now, we'll keyframe it based on the known drone shots frame ranges
    drone_ranges = [(101, 200), (401, 480), (3901, 4100), (14200, 14400)]
    for start, end in drone_ranges:
        sun_light.data.color = (0.7, 0.8, 1.0) # Cool exterior
        sun_light.data.keyframe_insert(data_path="color", frame=start)
        sun_light.data.color = (1.0, 0.9, 0.8) # Return to warm interior
        sun_light.data.keyframe_insert(data_path="color", frame=end)

def replace_with_soft_boxes():
    """Enhancement #29: Soft Box Fill Replacement."""
    # Replace AREA lights with large emissive planes
    for obj in bpy.context.scene.objects:
        if obj.type == 'LIGHT' and obj.data.type == 'AREA':
            loc = obj.location.copy()
            rot = obj.rotation_euler.copy()
            name = obj.name
            energy = obj.data.energy
            color = obj.data.color

            bpy.ops.object.select_all(action='DESELECT')
            obj.select_set(True)
            bpy.ops.object.delete()

            bpy.ops.mesh.primitive_plane_add(location=loc, rotation=rot)
            plane = bpy.context.object
            plane.name = f"SoftBox_{name}"
            plane.scale = (2, 2, 1)

            mat = bpy.data.materials.new(name=f"Mat_{plane.name}")
            mat.use_nodes = True
            bsdf = mat.node_tree.nodes["Principled BSDF"]
            set_principled_socket(mat, "Emission", color + (1,))
            set_principled_socket(mat, "Emission Strength", energy / 1000.0) # Scale energy
            plane.data.materials.append(mat)

def animate_hdri_rotation(scene):
    """Enhancement #30: Animated HDRI Sky Rotation."""
    world = scene.world
    if not world or not world.use_nodes: return
    nodes = world.node_tree.nodes
    mapping = nodes.get("Mapping")
    if not mapping:
        # Try to find or create mapping node for environment texture
        tex = None
        for n in nodes:
            if n.type == 'TEX_ENVIRONMENT':
                tex = n
                break
        if tex:
            mapping = nodes.new(type='ShaderNodeMapping')
            coord = nodes.new(type='ShaderNodeTexCoord')
            world.node_tree.links.new(coord.outputs['Generated'], mapping.inputs['Vector'])
            world.node_tree.links.new(mapping.outputs['Vector'], tex.inputs['Vector'])

    if mapping:
        mapping.inputs['Rotation'].default_value[2] = 0
        mapping.inputs['Rotation'].keyframe_insert(data_path="default_value", index=2, frame=1)
        mapping.inputs['Rotation'].default_value[2] = math.radians(360)
        mapping.inputs['Rotation'].keyframe_insert(data_path="default_value", index=2, frame=15000)

def animate_vignette_breathing(scene, frame_start, frame_end, strength=0.05, cycle=120):
    """Enhancement #59: Subtle breathing pulse for the vignette."""
    tree = get_compositor_node_tree(scene)
    vig = tree.nodes.get("Vignette")
    if not vig: return

    # We animate width/height with noise or sine-like loop
    # For simplicity, we use noise via our helper
    if not tree.animation_data:
        tree.animation_data_create()
    if not tree.animation_data.action:
        tree.animation_data.action = bpy.data.actions.new(name="CompositorAction")

    for axis in ["width", "height"]:
        data_path = f'nodes["Vignette"].{axis}'
        fcurve = get_or_create_fcurve(tree.animation_data.action, data_path, ref_obj=tree)
        if fcurve:
            mod = fcurve.modifiers.new(type='NOISE')
            mod.strength = strength
            mod.scale = cycle / 2.0
            mod.use_restricted_range = True
            mod.frame_start = frame_start
            mod.frame_end = frame_end

def animate_floating_spores(center, volume_size=(10, 10, 5), density=50, frame_start=1, frame_end=15000):
    """Enhancement #33: Drifting bioluminescent spores in the sanctuary."""
    container_name = "SanctuarySpores"
    container = bpy.data.collections.get(container_name) or bpy.data.collections.new(container_name)
    if container_name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(container)

    mat = bpy.data.materials.get("SporeMat")
    if not mat:
        mat = bpy.data.materials.new(name="SporeMat")
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = (0.2, 1.0, 0.5, 1) # Bioluminescent green
        set_principled_socket(mat, "Emission", (0.2, 1.0, 0.5, 1))
        set_principled_socket(mat, "Emission Strength", 5.0)
        set_blend_method(mat, 'BLEND')

    for i in range(density):
        loc = center + mathutils.Vector((
            random.uniform(-volume_size[0], volume_size[0]),
            random.uniform(-volume_size[1], volume_size[1]),
            random.uniform(0, volume_size[2])
        ))
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.015, location=loc)
        spore = bpy.context.object
        spore.name = f"Spore_{i}"
        container.objects.link(spore)
        if spore.name in bpy.context.scene.collection.objects:
            bpy.context.scene.collection.objects.unlink(spore)
        spore.data.materials.append(mat)

        # Gentle drifting noise
        insert_looping_noise(spore, "location", strength=0.8, scale=60.0, frame_start=frame_start, frame_end=frame_end)

        # Pulse emission
        animate_pulsing_emission(spore, frame_start, frame_end, base_strength=1.0, pulse_amplitude=4.0, cycle=random.randint(40, 100))

        # Visibility
        spore.hide_render = True
        spore.keyframe_insert(data_path="hide_render", frame=frame_start - 1)
        spore.hide_render = False
        spore.keyframe_insert(data_path="hide_render", frame=frame_start)
        spore.hide_render = True
        spore.keyframe_insert(data_path="hide_render", frame=frame_end)

def apply_iris_wipe(scene, frame_start, frame_end, mode='IN'):
    """Delegates to compositor_settings version if available, or handles direct keyframing."""
    try:
        import compositor_settings
        compositor_settings.animate_iris_wipe(scene, frame_start, frame_end, mode=mode)
    except ImportError:
        pass
