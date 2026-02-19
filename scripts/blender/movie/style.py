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
    'get_socket_by_identifier', 'set_socket_value', 'clear_scene_selective', 'create_noise_based_material',
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
    """Point 91: Exclusive layered action support for Blender 5.0+."""
    if action is None: return []

    # Force creation of layer if missing for new actions
    if len(action.layers) == 0 and create_if_missing:
        action.layers.new(name="Layer")

    curves = []
    for layer in action.layers:
        for strip in layer.strips:
            if hasattr(strip, 'fcurves'):
                curves.extend(strip.fcurves)
    return curves

def get_or_create_fcurve(action, data_path, index=0, ref_obj=None):
    """
    Retrieves or creates an F-Curve using the Blender 5.0+ Layered Action API.
    ref_obj: The object/datablock the action is assigned to.
    """
    if action is None or ref_obj is None: return None
    return action.fcurve_ensure_for_datablock(ref_obj, data_path=data_path, index=index)

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
    """Directly retrieves the compositor node tree for Blender 5.x."""
    tree = getattr(scene, 'compositing_node_group', None)
    if not tree:
        tree = bpy.data.node_groups.new(name="Compositing", type='CompositorNodeTree')
        scene.compositing_node_group = tree
    return tree

def get_socket_by_identifier(collection, identifier):
    """Robustly finds a socket in a collection by its identifier."""
    for s in collection:
        if s.identifier == identifier:
            return s
    return None

def create_compositor_output(tree):
    """Creates the final output node (NodeGroupOutput for 5.x)."""
    node = tree.nodes.new('NodeGroupOutput')
    
    # Ensure it has an "Image" socket
    if hasattr(tree, "interface"):
        exists = any(s.name == "Image" for s in tree.interface.items_tree if s.item_type == 'SOCKET')
        if not exists:
            tree.interface.new_socket(name="Image", in_out='OUTPUT', socket_type='NodeSocketColor')
            
    return node

def set_socket_value(socket, value, frame=None):
    """Point 92: Robustly sets a socket value, handling vector vs scalar mismatches."""
    if socket is None: return False
    try:
        # Handle vector/array sockets if provided value is a scalar
        # Exclude strings (enums) from length check
        has_len = hasattr(socket, "default_value") and hasattr(socket.default_value, "__len__")
        is_str = isinstance(getattr(socket, "default_value", None), (str, bytes))

        if has_len and not is_str and not isinstance(value, (list, tuple, mathutils.Vector)):
            socket.default_value = [value] * len(socket.default_value)
        else:
            socket.default_value = value

        if frame is not None:
            socket.keyframe_insert(data_path="default_value", frame=frame)
        return True
    except (AttributeError, TypeError, ValueError) as e:
        print(f"Warning: Failed to set socket {getattr(socket, 'name', 'unknown')} to {value}: {e}")
        return False

def set_node_input(node, name, value, frame=None):
    """
    Sets a node parameter via input socket (preferred in 5.x).
    """
    # 1. Try to find a matching input socket via identifier
    target = get_socket_by_identifier(node.inputs, name)
    if not target:
        # Try case-insensitive name match
        match_name = name.lower().replace("_", " ")
        for socket in node.inputs:
            curr_name = socket.name.lower().replace("_", " ")
            if curr_name == match_name:
                target = socket
                break

    if target:
        return set_socket_value(target, value, frame=frame)

    # Fallback to property if no socket matches
    if hasattr(node, name):
        try:
            setattr(node, name, value)
            if frame is not None:
                node.keyframe_insert(data_path=name, frame=frame)
            return True
        except: pass

    return False

def create_mix_node(tree, blend_type='MIX', data_type='RGBA'):
    """Point 92: Robust Mix node creation for Blender 5.0+."""
    node = None
    is_compositor = tree.bl_idname == 'CompositorNodeTree'

    # 1. Try common type identifiers
    candidates = []
    if is_compositor:
        candidates = ['CompositorNodeMix', 'CompositorNodeMixColor', 'CompositorNodeMixRGB', 'MixRGB', 'Mix']
    else:
        candidates = ['ShaderNodeMix', 'ShaderNodeMixRGB', 'MixRGB', 'Mix']

    for c in candidates:
        try:
            node = tree.nodes.new(c)
            if node: break
        except: continue

    if not node:
        # 2. Dynamic discovery in bpy.types
        import bpy
        prefix = "CompositorNode" if is_compositor else "ShaderNode"
        types = [t for t in dir(bpy.types) if t.startswith(prefix) and "Mix" in t]
        for nt in types:
            try:
                node = tree.nodes.new(nt)
                if node: break
            except: continue

    if not node and is_compositor:
        # 3. Emergency fallback to AlphaOver if Mix is missing in Compositor
        try:
            node = tree.nodes.new('CompositorNodeAlphaOver')
            print("INFO: Using AlphaOver as fallback for Mix in compositor.")
        except: pass

    if not node:
        import bpy
        available = [t for t in dir(bpy.types) if (is_compositor and "Compositor" in t) or (not is_compositor and "Shader" in t)]
        raise RuntimeError(f"Mix node NOT found in {tree.bl_idname}. Tried: {candidates}. Available: {available}")

    # Set properties
    if hasattr(node, 'data_type'): node.data_type = data_type
    if hasattr(node, 'blend_type'): node.blend_type = blend_type
    elif hasattr(node, 'operation'): node.operation = blend_type

    return node

def get_mix_sockets(node):
    """Returns (Factor, Input1, Input2) sockets for a Mix node (5.x) or AlphaOver fallback."""
    if node is None: return None, None, None

    # AlphaOver Fallback handling
    if node.bl_idname == 'CompositorNodeAlphaOver':
        # Input 0: Factor, 1: Background (A), 2: Foreground (B)
        return node.inputs[0], node.inputs[1], node.inputs[2]

    dt = getattr(node, 'data_type', 'RGBA')
    if dt == 'RGBA':
        return get_socket_by_identifier(node.inputs, 'Factor_Float') or node.inputs.get('Factor') or node.inputs[0], \
               get_socket_by_identifier(node.inputs, 'A_Color') or node.inputs.get('A') or node.inputs[1], \
               get_socket_by_identifier(node.inputs, 'B_Color') or node.inputs.get('B') or node.inputs[2]
    elif dt == 'VECTOR':
        return get_socket_by_identifier(node.inputs, 'Factor_Float') or node.inputs.get('Factor') or node.inputs[0], \
               get_socket_by_identifier(node.inputs, 'A_Vector') or node.inputs.get('A') or node.inputs[1], \
               get_socket_by_identifier(node.inputs, 'B_Vector') or node.inputs.get('B') or node.inputs[2]

    return node.inputs[0], node.inputs[1], node.inputs[2]

def get_mix_output(node):
    """Returns the main output socket for a Mix node (5.x) or AlphaOver fallback."""
    if node is None: return None

    if node.bl_idname == 'CompositorNodeAlphaOver':
        return node.outputs[0]

    dt = getattr(node, 'data_type', 'RGBA')
    if dt == 'RGBA': return get_socket_by_identifier(node.outputs, 'Result_Color') or node.outputs.get('Result') or node.outputs[0]
    if dt == 'VECTOR': return get_socket_by_identifier(node.outputs, 'Result_Vector') or node.outputs.get('Result') or node.outputs[0]
    return node.outputs[0]

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
        return set_socket_value(sock, value, frame=frame)

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
    """Point 22 & 80: Optimized dust particles. Reuses existing motes if available."""
    # Use a simpler name to encourage reuse across calls unless color differs significantly
    color_hex = f"{int(color[0]*255):02x}{int(color[1]*255):02x}{int(color[2]*255):02x}"
    container_name = f"DustParticles_{color_hex}"
    
    container = bpy.data.collections.get(container_name)
    if not container:
        container = bpy.data.collections.new(container_name)
        bpy.context.scene.collection.children.link(container)

    mat_name = f"DustMat_{color_hex}"
    mat = bpy.data.materials.get(mat_name)
    if not mat:
        mat = bpy.data.materials.new(name=mat_name)
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Emission Strength"].default_value = 2.0
        set_blend_method(mat, 'BLEND')

    # Reuse existing particles if they exist in this container
    existing_motes = list(container.objects)
    
    # If we need more, create them
    needed = density - len(existing_motes)
    
    if needed > 0:
        # Create prototype mesh once
        mesh_name = f"DustMoteMesh_{color_hex}"
        mesh = bpy.data.meshes.get(mesh_name)
        if not mesh:
            bpy.ops.mesh.primitive_ico_sphere_add(radius=0.01, location=(0,0,0))
            mesh = bpy.context.object.data
            mesh.name = mesh_name
            bpy.data.objects.remove(bpy.context.object, do_unlink=True) # Keep mesh, delete temp obj

        for i in range(needed):
            mote = bpy.data.objects.new(f"DustMote_{color_hex}_{len(existing_motes)+i}", mesh)
            container.objects.link(mote)
            mote.data.materials.append(mat)
            existing_motes.append(mote)

    # Now animate a SUBSET of them for this specific call, or all of them?
    # The previous logic created NEW ones every call. 
    # If we reuse them, we need to ensure we don't conflict with their previous animation if ranges overlap.
    # But dust usually runs through the whole scene. 
    # Current usage in scene_logic seems to be per-scene ranges.
    
    # For now, we'll animate 'density' random particles from the pool
    # and reset their location to the new 'center'.
    # This might jump them if they were used in a previous frame range?
    # No, because `insert_looping_noise` ADDS noise to current location.
    
    # Problem: If frame ranges don't overlap, we can reuse.
    # If they do overlap, we need separate particles.
    # Given the scene structure (scenes are sequential), reuse is safe.
    
    # We will grab the first 'density' motes and keyframe them
    current_motes = existing_motes[:density]
    
    for i, mote in enumerate(current_motes):
        # Relocate to new center
        loc = center + mathutils.Vector((
            random.uniform(-volume_size[0], volume_size[0]),
            random.uniform(-volume_size[1], volume_size[1]),
            random.uniform(0, volume_size[2])
        ))
        
        # We need to jump the mote to this location at frame_start
        # But `insert_looping_noise` works on the fcurve.
        # We'll just set the location and keyframe it with CONSTANT interpolation to "teleport" it
        mote.location = loc
        mote.keyframe_insert(data_path="location", frame=frame_start)
        # Ensure constant interpolation for the jump
        if mote.animation_data and mote.animation_data.action:
            fc = get_or_create_fcurve(mote.animation_data.action, "location", 0)
            if fc:
                 for kp in fc.keyframe_points:
                     if kp.co[0] == frame_start:
                         kp.interpolation = 'CONSTANT'

        insert_looping_noise(mote, "location", strength=0.2, scale=20.0, frame_start=frame_start, frame_end=frame_end)

        # Visibility
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

        # Point 92: Safe Euler addition (AttributeError fix)
        dart_rot = orig_rot.copy()
        dart_rot.x += random.uniform(-0.1, 0.1) * strength * 50
        dart_rot.z += random.uniform(-0.1, 0.1) * strength * 50

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
        if not mat: continue

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
        set_socket_value(bg.inputs[0], (*color_start, 1), frame=frame_start)
        set_socket_value(bg.inputs[0], (*color_end, 1), frame=frame_end)

def setup_chromatic_aberration(scene, strength=0.01):
    """Adds a Lens Distortion node for chromatic aberration (5.x)."""
    tree = get_compositor_node_tree(scene)
    distort = tree.nodes.get("ChromaticAberration") or tree.nodes.new(type='CompositorNodeLensdist')
    distort.name = "ChromaticAberration"
    set_node_input(distort, 'Dispersion', strength)
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
    """Decreases vignette radius for high tension (5.x)."""
    tree = get_compositor_node_tree(scene)
    vig = tree.nodes.get("Vignette") or tree.nodes.new(type='CompositorNodeEllipseMask')
    vig.name = "Vignette"
    
    set_node_input(vig, 'Size', start_val, frame=frame_start)
    set_node_input(vig, 'Size', end_val, frame=frame_end)

def apply_neuron_color_coding(neuron_mat, frame, color=(1, 0, 0)):
    """Shifts neuron emission color."""
    if not neuron_mat or not neuron_mat.node_tree: return
    bsdf = neuron_mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Emission Color"].default_value = (*color, 1)
        bsdf.inputs["Emission Color"].keyframe_insert(data_path="default_value", frame=frame)

def setup_bioluminescent_flora(mat, color=(0, 1, 0.5)):
    """Adds glowing 'veins' to materials."""
    if not mat or not mat.node_tree: return
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
    if not world: return
    vol = world.node_tree.nodes.get("Volume Scatter")
    if vol:
        vol.inputs['Density'].default_value = density
        vol.inputs['Density'].keyframe_insert(data_path="default_value", frame=frame)

def apply_film_flicker(scene, frame_start, frame_end, strength=0.05):
    """Adds brightness flicker using Noise modifier on input socket (5.x)."""
    tree = get_compositor_node_tree(scene)
    bright = tree.nodes.get("Bright/Contrast") or tree.nodes.new('CompositorNodeBrightContrast')
    bright.name = "Bright/Contrast"

    if not tree.animation_data:
        tree.animation_data_create()
    if not tree.animation_data.action:
        tree.animation_data.action = bpy.data.actions.new(name="CompositorAction")

    # In 5.0, Brightness is input socket 'Bright'
    target = bright.inputs.get('Bright') or bright.inputs[0]
    data_path = f'nodes["{bright.name}"].inputs["{target.identifier}"].default_value'
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
    set_node_input(blur, 'Factor', 0.8)
    set_node_input(blur, 'Samples', 16)
    return blur

def setup_saturation_control(scene):
    """Adds a Hue/Saturation node for global desaturation beats."""
    tree = get_compositor_node_tree(scene)
    if not tree: return None
    huesat = tree.nodes.get("GlobalSaturation") or tree.nodes.new(type='CompositorNodeHueSat')
    huesat.name = "GlobalSaturation"
    set_node_input(huesat, 'Saturation', 1.0)
    return huesat

def apply_desaturation_beat(scene, frame_start, frame_end, saturation=0.2):
    """Drops saturation for a specific range."""
    tree = get_compositor_node_tree(scene)
    if not tree: return
    huesat = tree.nodes.get("GlobalSaturation")
    if huesat:
        set_node_input(huesat, 'Saturation', 1.0, frame=frame_start - 5)
        set_node_input(huesat, 'Saturation', saturation, frame=frame_start)
        set_node_input(huesat, 'Saturation', saturation, frame=frame_end)
        set_node_input(huesat, 'Saturation', 1.0, frame=frame_end + 5)

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
    from assets import plant_humanoid
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
    # mat.use_nodes = True
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

def create_noise_based_material(name, colors, noise_type='NOISE', noise_scale=5.0, roughness=0.5):
    """Exclusive 5.0+ noise-based material helper."""
    mat = bpy.data.materials.new(name=name)
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    node_out = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    node_bsdf.inputs['Roughness'].default_value = roughness

    if noise_type == 'WAVE':
        node_noise = nodes.new(type='ShaderNodeTexWave')
    elif noise_type == 'VORONOI':
        node_noise = nodes.new(type='ShaderNodeTexVoronoi')
    else:
        node_noise = nodes.new(type='ShaderNodeTexNoise')

    node_noise.inputs['Scale'].default_value = noise_scale

    node_ramp = nodes.new(type='ShaderNodeValToRGB')
    elems = node_ramp.color_ramp.elements
    # Safe pattern for 5.0: Reuse 2 existing stops, only append if more needed
    for i, color in enumerate(colors):
        if i < len(elems):
            elems[i].color = color
        else:
            elems.new(i / max(1, len(colors)-1)).color = color

    links.new(node_noise.outputs[0], node_ramp.inputs['Fac'])
    links.new(node_ramp.outputs['Color'], node_bsdf.inputs['Base Color'])
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])

    return mat

def clear_scene_selective():
    """Point 92: Clear objects/data without a full session reset."""
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete()
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.actions, bpy.data.curves, bpy.data.armatures, bpy.data.node_groups):
        for item in block:
            if item.users == 0: block.remove(item)

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
        # Point 92: Safe subtraction for Euler/Vector types
        if hasattr(orig_val, "x") and hasattr(offset_value, "x"): # Euler or Vector
            new_val = orig_val.copy()
            new_val.x -= offset_value.x
            new_val.y -= offset_value.y
            new_val.z -= offset_value.z
            setattr(obj, data_path, new_val)
        else:
            try:
                setattr(obj, data_path, orig_val - offset_value)
            except:
                pass

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

    # Driver-based approach to avoid frame_set looping
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if not bsdf: return
    
    # We need to find the input socket for Emission Strength
    # Note: get_principled_socket is a helper in this file, but we need the actual socket object to add a driver
    socket = get_principled_socket(bsdf, "Emission Strength")
    if not socket: return

    # Remove any existing animation data on this socket to be clean
    # (Though adding a driver usually overrides)

    # Add Driver
    fcurve = socket.driver_add("default_value")
    driver = fcurve.driver
    driver.type = 'SCRIPTED'
    
    # Create variables for distance to each character
    dist_vars = []
    for i, char in enumerate(characters):
        if not char: continue
        var = driver.variables.new()
        var.name = f"dist_{i}"
        var.type = 'LOC_DIFF'
        var.targets[0].id = gnome
        var.targets[1].id = char
        dist_vars.append(f"dist_{i}")
        
    if not dist_vars:
        # Fallback if no characters found
        driver.expression = "2.0"
        return

    # Expression: max(2.0, 50.0 * (1.0 / max(1.0, min_dist)))
    # min_dist = min(d1, d2, ...)
    min_dist_expr = f"min({', '.join(dist_vars)})"
    driver.expression = f"max(2.0, 50.0 * (1.0 / max(1.0, {min_dist_expr})))"

def apply_bioluminescent_veins(characters, frame_start, frame_end):
    """Enhancement #88: Bioluminescent Vein Network."""
    for char in characters:
        if not char: continue
        for slot in char.material_slots:
            mat = slot.material
            if not mat: continue

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
        if not mat: continue
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
            mix = create_mix_node(mat.node_tree, blend_type='ADD', data_type='RGBA')
            fac, in1, in2 = get_mix_sockets(mix)
            if fac: fac.default_value = 0.2

            # Move existing link
            old_link = None
            for link in links:
                if link.to_socket == bsdf.inputs['Base Color']:
                    old_link = link
                    break

            if old_link:
                links.new(old_link.from_socket, in1)
                links.remove(old_link)

            links.new(node_math.outputs[0], in2)
            links.new(get_mix_output(mix), bsdf.inputs['Base Color'])

        # Animate texture for moving water effect
        node_tex.voronoi_dimensions = '4D'
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
            # mat.use_nodes = True
            bsdf = mat.node_tree.nodes["Principled BSDF"]
            set_principled_socket(mat, "Emission", list(color) + [1])
            set_principled_socket(mat, "Emission Strength", energy / 1000.0) # Scale energy
            plane.data.materials.append(mat)

def animate_hdri_rotation(scene):
    """Enhancement #30: Animated HDRI Sky Rotation."""
    world = scene.world
    if not world or not world.node_tree: return
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

    if not tree.animation_data:
        tree.animation_data_create()
    if not tree.animation_data.action:
        tree.animation_data.action = bpy.data.actions.new(name="CompositorAction")

    # In 5.0, preferred to animate the 'Size' socket if it exists
    size_sock = get_socket_by_identifier(vig.inputs, 'Size') or vig.inputs.get('Size')
    if size_sock:
        # Size is usually a float2 or similar
        for i in range(2):
            data_path = f'nodes["Vignette"].inputs["{size_sock.identifier}"].default_value'
            fcurve = get_or_create_fcurve(tree.animation_data.action, data_path, index=i, ref_obj=tree)
            if fcurve:
                mod = fcurve.modifiers.new(type='NOISE')
                mod.strength, mod.scale = strength, cycle / 2.0
                mod.use_restricted_range = True
                mod.frame_start, mod.frame_end = frame_start, frame_end
    else:
        # Fallback to properties
        for axis in ["width", "height"]:
            data_path = f'nodes["Vignette"].{axis}'
            fcurve = get_or_create_fcurve(tree.animation_data.action, data_path, ref_obj=tree)
            if fcurve:
                mod = fcurve.modifiers.new(type='NOISE')
                mod.strength, mod.scale = strength, cycle / 2.0
                mod.use_restricted_range = True
                mod.frame_start, mod.frame_end = frame_start, frame_end

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
