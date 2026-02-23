"""
Shared animation, shading, and cinematography utilities for Greenhouse Movie Production.
Exclusively utilizing Blender 5.0 Slotted Action / Channel Bag API.
(Point 92)
"""
import bpy
import random
import math
import mathutils
from bpy_extras import anim_utils

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

class FCurveProxy:
    """Provides compatibility and helper methods for modern F-Curves."""
    def __init__(self, target, path=None):
        self._target = target
        self.data_path = path if path is not None else getattr(target, "data_path", "")
        self.keyframe_points = getattr(target, "keyframe_points", [])
        self.modifiers = getattr(target, "modifiers", [])
        self.array_index = getattr(target, "array_index", 0)

    def __getattr__(self, name):
        return getattr(self._target, name)

    def evaluate(self, frame):
        if hasattr(self._target, "evaluate"):
            try: return self._target.evaluate(frame)
            except: pass
        if not self.keyframe_points: return 0.0
        keys = sorted(self.keyframe_points, key=lambda k: k.co[0])
        if frame <= keys[0].co[0]: return keys[0].co[1]
        if frame >= keys[-1].co[0]: return keys[-1].co[1]
        for i in range(len(keys) - 1):
            k1, k2 = keys[i], keys[i+1]
            if k1.co[0] <= frame <= k2.co[0]:
                t = (frame - k1.co[0]) / (k2.co[0] - k1.co[0])
                return k1.co[1] + t * (k2.co[1] - k1.co[1])
        return 0.0

    def as_pointer(self):
        try: return self._target.as_pointer()
        except: return id(self._target)

def get_action_curves(action, obj=None):
    """
    Blender 5.0 Mandatory Channel Bag Approach.
    """
    if not action: return []
    curves = []
    seen_ids = set()

    def add_curves_from_bag(bag, prefix=""):
        if not bag or not hasattr(bag, "fcurves"): return
        for fc in bag.fcurves:
            try: ptr = fc.as_pointer()
            except: ptr = id(fc)
            if ptr in seen_ids: continue
            seen_ids.add(ptr)
            path = fc.data_path
            if prefix and not path.startswith("pose.bones"):
                path = prefix + path
            curves.append(FCurveProxy(fc, path))

    def get_bone_prefix(name):
        if not name: return ""
        bone_kws = (".L", ".R", "Torso", "Head", "Neck", "Jaw", "Mouth", "Leg", "Arm", "Eye", "Brow", "Hand", "Foot", "Spine", "Hip")
        name_str = str(name)
        if any(kw.lower() in name_str.lower() for kw in bone_kws):
            clean_name = name_str.split(":")[-1]
            return f'pose.bones["{clean_name}"].'
        return ""

    if obj and hasattr(obj, "animation_data") and obj.animation_data:
        slot = getattr(obj.animation_data, "action_slot", None)
        if slot:
            try:
                bag = anim_utils.action_get_channelbag_for_slot(action, slot)
                if bag:
                    prefix = get_bone_prefix(getattr(slot, "name", ""))
                    add_curves_from_bag(bag, prefix)
                    return curves
            except Exception: pass

    if hasattr(action, "slots"):
        for slot in action.slots:
            try:
                bag = anim_utils.action_get_channelbag_for_slot(action, slot)
                if bag:
                    prefix = get_bone_prefix(getattr(slot, "name", ""))
                    add_curves_from_bag(bag, prefix)
            except: pass
    return curves

def get_or_create_fcurve(action, data_path, index=0, ref_obj=None):
    """5.0 native F-Curve retrieval/creation."""
    if action is None or ref_obj is None: return None
    if hasattr(action, "layers") and len(action.layers) == 0:
        action.layers.new(name="Main Layer")
    try:
        return action.fcurve_ensure_for_datablock(ref_obj, data_path=data_path, index=index)
    except: return None

def get_eevee_engine_id():
    try:
        for engine in ['BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE']:
            if engine in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items:
                return engine
    except Exception: pass
    return 'BLENDER_EEVEE'

def get_compositor_node_tree(scene):
    if not scene: return None
    scene.use_nodes = True
    tree = getattr(scene, 'node_tree', None) or \
           getattr(scene, 'compositing_node_tree', None) or \
           getattr(scene, 'compositor_node_tree', None)
    if not tree:
        for ng in bpy.data.node_groups:
            if ng.type == 'COMPOSITOR' and ng.name == "Compositing":
                tree = ng
                break
    if not tree: tree = getattr(scene, 'compositing_node_group', None)
    return tree

def get_socket_by_identifier(collection, identifier):
    for s in collection:
        if s.identifier == identifier: return s
    return None

def create_compositor_output(tree):
    return tree.nodes.new('CompositorNodeComposite')

def set_socket_value(socket, value, frame=None):
    if socket is None: return False
    try:
        dv = getattr(socket, "default_value", None)
        expects_seq = dv is not None and hasattr(dv, "__len__") and not isinstance(dv, (str, bytes))
        provides_seq = isinstance(value, (list, tuple, mathutils.Vector))
        if provides_seq and not expects_seq:
            try:
                if len(value) >= 3: target_val = float(value[0] * 0.299 + value[1] * 0.587 + value[2] * 0.114)
                else: target_val = float(value[0])
                socket.default_value = target_val
            except: socket.default_value = float(value[0])
        elif not provides_seq and expects_seq:
            try: socket.default_value = [value] * len(dv)
            except:
                try: socket.default_value = (value, value, value, 1.0)
                except: pass
        else:
            try: socket.default_value = value
            except:
                if expects_seq: socket.default_value = tuple(value)
                else: socket.default_value = float(value)
        if frame is not None:
            try: socket.keyframe_insert(data_path="default_value", frame=frame)
            except: pass
        return True
    except: return False

def set_node_input(node, name, value, frame=None):
    target = get_socket_by_identifier(node.inputs, name)
    if not target:
        match_name = name.lower().replace("_", " ")
        for socket in node.inputs:
            if socket.name.lower().replace("_", " ") == match_name:
                target = socket; break
    if target:
        if name.upper() == 'TYPE' and value == 'FOG_GLOW': value = 'Fog Glow'
        return set_socket_value(target, value, frame=frame)
    if hasattr(node, name):
        try:
            setattr(node, name, value)
            if frame is not None: node.keyframe_insert(data_path=name, frame=frame)
            return True
        except: pass
    return False

def create_mix_node(tree, blend_type='MIX', data_type='RGBA'):
    node = None
    is_compositor = tree.bl_idname == 'CompositorNodeTree'
    candidates = ['CompositorNodeMixColor', 'CompositorNodeMix'] if is_compositor else ['ShaderNodeMix', 'ShaderNodeMixRGB']
    for c in candidates:
        try:
            node = tree.nodes.new(c)
            if node: break
        except: continue
    if not node:
        prefix = "CompositorNode" if is_compositor else "ShaderNode"
        types = [t for t in dir(bpy.types) if t.startswith(prefix) and "Mix" in t]
        types.sort(key=lambda t: 0 if "MixColor" in t else 1)
        for nt in types:
            try:
                node = tree.nodes.new(nt)
                if node: break
            except: continue
    if not node and is_compositor:
        try: node = tree.nodes.new('Mix')
        except: pass
    if not node and is_compositor:
        try: node = tree.nodes.new('CompositorNodeAlphaOver')
        except: pass
    if not node:
        try: node = tree.nodes.new('Mix')
        except: raise RuntimeError(f"Mix node NOT found in {tree.bl_idname}")
    if hasattr(node, 'data_type'): node.data_type = data_type
    if hasattr(node, 'blend_type'): node.blend_type = blend_type
    elif hasattr(node, 'operation'): node.operation = blend_type
    return node

def get_mix_sockets(node):
    if node is None: return None, None, None
    if node.bl_idname == 'CompositorNodeAlphaOver': return node.inputs[0], node.inputs[1], node.inputs[2]
    def find_socket(names, default_idx):
        for name in names:
            s = node.inputs.get(name) or get_socket_by_identifier(node.inputs, name)
            if s: return s
        return node.inputs[default_idx]
    factor = find_socket(['Factor', 'Fac', 'Factor_Float'], 0)
    in1 = find_socket(['A', 'Color1', 'A_Color', 'Image'], 1)
    in2 = find_socket(['B', 'Color2', 'B_Color', 'Image.001'], 2)
    return factor, in1, in2

def get_mix_output(node):
    if node is None: return None
    if node.bl_idname == 'CompositorNodeAlphaOver': return node.outputs[0]
    dt = getattr(node, 'data_type', 'RGBA')
    if dt == 'RGBA': return get_socket_by_identifier(node.outputs, 'Result_Color') or node.outputs.get('Result') or node.outputs[0]
    return node.outputs[0]

def get_principled_socket(mat_or_node, socket_name):
    node = mat_or_node
    if hasattr(mat_or_node, "node_tree"):
        node = mat_or_node.node_tree.nodes.get("Principled BSDF")
    if not node: return None
    mapping = {'Specular': ['Specular', 'Specular IOR Level'], 'Transmission': ['Transmission', 'Transmission Weight'], 'Emission': ['Emission', 'Emission Color'], 'Emission Strength': ['Emission Strength']}
    target_sockets = mapping.get(socket_name, [socket_name])
    for s in target_sockets:
        if s in node.inputs: return node.inputs[s]
    return None

def set_principled_socket(mat_or_node, socket_name, value, frame=None):
    sock = get_principled_socket(mat_or_node, socket_name)
    if sock: return set_socket_value(sock, value, frame=frame)
    return False

def patch_fbx_importer():
    try:
        import sys
        fbx_module = sys.modules.get('io_scene_fbx')
        if not fbx_module:
            try: import io_scene_fbx; fbx_module = io_scene_fbx
            except ImportError: pass
        if fbx_module and hasattr(fbx_module, 'ImportFBX'):
            ImportFBX = fbx_module.ImportFBX
            if not getattr(ImportFBX, '_is_patched', False):
                original_execute = ImportFBX.execute
                def patched_execute(self, context):
                    if not hasattr(self, 'files'): self.files = []
                    return original_execute(self, context)
                ImportFBX.execute = patched_execute; ImportFBX._is_patched = True
                return True
    except: pass
    return False

def apply_scene_grade(master, scene_name, frame_start, frame_end):
    scene = master.scene
    world = scene.world
    nodes = world.node_tree.nodes
    bg = nodes.get("Background")
    bg_color = (0, 0, 0, 1)
    sun_energy, rim_energy, fill_energy, spot_energy = 1.0, 5000, 2000, 10000
    sun_color = rim_color = fill_color = spot_color = (1, 1, 1, 1)
    if scene_name == 'garden': bg_color = (0.01, 0.02, 0.01, 1); sun_color = (1, 0.9, 0.7, 1); rim_color = (0.8, 1, 0.8, 1)
    elif scene_name == 'resonance': bg_color = (0, 0.01, 0.02, 1); sun_color = (0.7, 0.9, 1, 1); rim_color = (0.5, 0.8, 1, 1)
    elif scene_name == 'shadow': bg_color = (0.02, 0, 0.03, 1); sun_energy = 1.0; sun_color = (0.8, 0.7, 1, 1); rim_energy = 8000; rim_color = (0.6, 0.4, 1, 1); spot_energy = 5000; spot_color = (0.7, 0.5, 1, 1)
    elif scene_name == 'sanctuary': bg_color = (0.02, 0.02, 0, 1); sun_color = (1, 0.95, 0.8, 1); rim_color = (1, 1, 0.9, 1)
    if bg:
        bg.inputs[0].default_value = bg_color
        bg.inputs[0].keyframe_insert(data_path="default_value", frame=frame_start)
    lights = {"Sun": (sun_energy, sun_color), "RimLight": (rim_energy, rim_color), "FillLight": (fill_energy, fill_color), "Spot": (spot_energy, spot_color)}
    for name, (energy, color) in lights.items():
        attr_map = {"Sun": "sun", "RimLight": "rim", "FillLight": "fill", "Spot": "spot"}
        light_obj = getattr(master, attr_map.get(name, ""), None) or bpy.data.objects.get(name)
        if light_obj and hasattr(light_obj, "data"):
            light_obj.data.energy = energy
            light_obj.data.keyframe_insert(data_path="energy", frame=frame_start)
            if hasattr(light_obj.data, "color"):
                light_obj.data.color = color[:3]
                light_obj.data.keyframe_insert(data_path="color", frame=frame_start)

def animate_foliage_wind(objects, strength=0.05, frame_start=1, frame_end=15000):
    for obj in objects:
        if obj.type != 'MESH': continue
        insert_looping_noise(obj, "rotation_euler", strength=strength, frame_start=frame_start, frame_end=frame_end)

def animate_light_flicker(light_name, frame_start, frame_end, strength=0.2, seed=None):
    light_obj = bpy.data.objects.get(light_name)
    if not light_obj: return
    if not light_obj.data.animation_data: light_obj.data.animation_data_create()
    if not light_obj.data.animation_data.action: light_obj.data.animation_data.action = bpy.data.actions.new(name=f"Flicker_{light_name}")
    fcurve = get_or_create_fcurve(light_obj.data.animation_data.action, "energy", ref_obj=light_obj.data)
    if not fcurve: return
    modifier = fcurve.modifiers.new(type='NOISE')
    modifier.strength = light_obj.data.energy * strength; modifier.scale = 2.0; modifier.phase = seed if seed is not None else random.random() * 100
    modifier.use_restricted_range, modifier.frame_start, modifier.frame_end = True, frame_start, frame_end
    modifier.blend_in, modifier.blend_out = 5, 5

def insert_looping_noise(obj, data_path, index=-1, frame_start=1, frame_end=15000, strength=0.05, scale=10.0, phase=None):
    anim_target = obj; path_prefix = ""
    if hasattr(obj, "id_data") and obj.rna_type.identifier == 'PoseBone': anim_target = obj.id_data; path_prefix = f'pose.bones["{obj.name}"].'
    elif hasattr(obj, "bone") and hasattr(obj, "id_data") and obj.id_data.type == 'ARMATURE': anim_target = obj.id_data; path_prefix = f'pose.bones["{obj.name}"].'
    if not anim_target.animation_data: anim_target.animation_data_create()
    action = anim_target.animation_data.action or bpy.data.actions.new(name=f"Noise_{anim_target.name}")
    anim_target.animation_data.action = action
    if hasattr(action, "layers") and len(action.layers) == 0: action.layers.new(name="Main Layer")
    indices = [index] if index >= 0 else [0, 1, 2]
    full_path = path_prefix + data_path
    for idx in indices:
        fcurve = get_or_create_fcurve(action, full_path, idx, ref_obj=anim_target)
        if not fcurve: continue
        if not fcurve.keyframe_points: anim_target.keyframe_insert(data_path=full_path, index=idx, frame=frame_start)
        modifier = fcurve.modifiers.new(type='NOISE')
        modifier.strength = strength * (0.8 + random.random() * 0.4); modifier.scale = scale * (0.8 + random.random() * 0.4); modifier.phase = phase if phase is not None else random.random() * 100
        modifier.use_restricted_range, modifier.frame_start, modifier.frame_end = True, frame_start, frame_end
        modifier.blend_in, modifier.blend_out = 10, 10

def animate_breathing(obj, frame_start, frame_end, axis=2, amplitude=0.03, cycle=72):
    if not obj: return
    insert_looping_noise(obj, "scale", index=axis, strength=amplitude, scale=cycle, frame_start=frame_start, frame_end=frame_end)

def animate_dust_particles(center, volume_size=(5, 5, 5), density=20, color=(1, 1, 1, 1), frame_start=1, frame_end=15000):
    color_hex = f"{int(color[0]*255):02x}{int(color[1]*255):02x}{int(color[2]*255):02x}"
    container_name = f"DustParticles_{color_hex}"
    container = bpy.data.collections.get(container_name) or bpy.data.collections.new(container_name)
    if container_name not in bpy.context.scene.collection.children: bpy.context.scene.collection.children.link(container)
    mat_name = f"DustMat_{color_hex}"; mat = bpy.data.materials.get(mat_name)
    if not mat:
        mat = bpy.data.materials.new(name=mat_name); bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = color; bsdf.inputs["Emission Strength"].default_value = 2.0; set_blend_method(mat, 'BLEND')
    existing_motes = list(container.objects); needed = density - len(existing_motes)
    if needed > 0:
        mesh_name = f"DustMoteMesh_{color_hex}"; mesh = bpy.data.meshes.get(mesh_name)
        if not mesh:
            bpy.ops.mesh.primitive_ico_sphere_add(radius=0.01, location=(0,0,0)); mesh = bpy.context.object.data; mesh.name = mesh_name; bpy.data.objects.remove(bpy.context.object, do_unlink=True)
        for i in range(needed):
            mote = bpy.data.objects.new(f"DustMote_{color_hex}_{len(existing_motes)+i}", mesh); container.objects.link(mote); mote.data.materials.append(mat); existing_motes.append(mote)
    current_motes = existing_motes[:density]
    for i, mote in enumerate(current_motes):
        loc = center + mathutils.Vector((random.uniform(-volume_size[0], volume_size[0]), random.uniform(-volume_size[1], volume_size[1]), random.uniform(0, volume_size[2])))
        mote.location = loc; mote.keyframe_insert(data_path="location", frame=frame_start)
        if mote.animation_data and mote.animation_data.action:
            fc = get_or_create_fcurve(mote.animation_data.action, "location", 0, ref_obj=mote)
            if fc:
                 for kp in fc.keyframe_points:
                     if kp.co[0] == frame_start: kp.interpolation = 'CONSTANT'
        insert_looping_noise(mote, "location", strength=0.2, scale=20.0, frame_start=frame_start, frame_end=frame_end)
        mote.hide_render = True; mote.keyframe_insert(data_path="hide_render", frame=frame_start - 1)
        mote.hide_render = False; mote.keyframe_insert(data_path="hide_render", frame=frame_start)
        mote.hide_render = True; mote.keyframe_insert(data_path="hide_render", frame=frame_end)

def apply_fade_transition(objs, frame_start, frame_end, mode='IN', duration=12):
    for obj in objs:
        if mode == 'IN':
            obj.hide_render = True; obj.keyframe_insert(data_path="hide_render", frame=frame_start)
            obj.hide_render = False; obj.keyframe_insert(data_path="hide_render", frame=frame_start + duration)
            if obj.animation_data and obj.animation_data.action:
                for fc in get_action_curves(obj.animation_data.action, obj=obj):
                    if fc.data_path == "hide_render":
                        for kp in fc.keyframe_points: kp.interpolation = 'CONSTANT'
        else:
            obj.hide_render = False; obj.keyframe_insert(data_path="hide_render", frame=frame_end - duration)
            obj.hide_render = True; obj.keyframe_insert(data_path="hide_render", frame=frame_end)
            if obj.animation_data and obj.animation_data.action:
                for fc in get_action_curves(obj.animation_data.action, obj=obj):
                    if fc.data_path == "hide_render":
                        for kp in fc.keyframe_points: kp.interpolation = 'CONSTANT'

def camera_push_in(cam, target, frame_start, frame_end, distance=5):
    direction = (target.location - cam.location).normalized(); cam.keyframe_insert(data_path="location", frame=frame_start)
    cam.location += direction * distance; cam.keyframe_insert(data_path="location", frame=frame_end)

def camera_pull_out(cam, target, frame_start, frame_end, distance=5): camera_push_in(cam, target, frame_start, frame_end, distance=-distance)

def ease_action(obj, data_path, index=-1, interpolation='BEZIER', easing='EASE_IN_OUT'):
    if not obj.animation_data or not obj.animation_data.action: return
    for fcurve in get_action_curves(obj.animation_data.action, obj=obj):
        if fcurve.data_path == data_path and (index == -1 or fcurve.array_index == index):
            for kp in fcurve.keyframe_points: kp.interpolation, kp.easing = interpolation, easing

def animate_blink(eye_obj, frame_start, frame_end, interval_range=(60, 180)):
    if not eye_obj: return
    target_obj, data_path = eye_obj, "scale"
    if hasattr(eye_obj, "id_data") and eye_obj.id_data.type == 'ARMATURE': target_obj, data_path = eye_obj.id_data, f'pose.bones["{eye_obj.name}"].scale'
    current_f, base_z = frame_start, eye_obj.scale[2]
    while current_f < frame_end:
        if "pose.bones" in data_path: target_obj.pose.bones[eye_obj.name].scale[2] = base_z
        else: target_obj.scale[2] = base_z
        target_obj.keyframe_insert(data_path=data_path, index=2, frame=current_f)
        blink_start = current_f + random.randint(*interval_range)
        if blink_start + 6 > frame_end: break
        target_obj.keyframe_insert(data_path=data_path, index=2, frame=blink_start)
        if "pose.bones" in data_path: target_obj.pose.bones[eye_obj.name].scale[2] = base_z * 0.1
        else: target_obj.scale[2] = base_z * 0.1
        target_obj.keyframe_insert(data_path=data_path, index=2, frame=blink_start + 3)
        if "pose.bones" in data_path: target_obj.pose.bones[eye_obj.name].scale[2] = base_z
        else: target_obj.scale[2] = base_z
        target_obj.keyframe_insert(data_path=data_path, index=2, frame=blink_start + 6); current_f = blink_start + 6

def animate_saccadic_movement(eye_obj, gaze_target, frame_start, frame_end, strength=0.02):
    if not eye_obj: return
    is_pose_bone = hasattr(eye_obj, 'id_data') and hasattr(eye_obj.id_data, 'type') and eye_obj.id_data.type == 'ARMATURE'
    arm_obj, bone_dp = (eye_obj.id_data, f'pose.bones["{eye_obj.name}"].rotation_euler') if is_pose_bone else (eye_obj, 'rotation_euler')
    current_f = frame_start
    while current_f < frame_end:
        current_f += random.randint(30, 120)
        if current_f >= frame_end: break
        orig_rot = eye_obj.rotation_euler.copy(); arm_obj.keyframe_insert(data_path=bone_dp, frame=current_f)
        dart_rot = orig_rot.copy(); dart_rot.x += random.uniform(-0.1, 0.1) * strength * 50; dart_rot.z += random.uniform(-0.1, 0.1) * strength * 50
        eye_obj.rotation_euler = dart_rot; arm_obj.keyframe_insert(data_path=bone_dp, frame=current_f + 2)
        eye_obj.rotation_euler = orig_rot; arm_obj.keyframe_insert(data_path=bone_dp, frame=current_f + 5); current_f += 5

def animate_finger_tapping(finger_objs, frame_start, frame_end, cycle=40):
    for i, f_obj in enumerate(finger_objs): insert_looping_noise(f_obj, "rotation_euler", index=0, strength=0.2, scale=cycle/4, frame_start=frame_start, frame_end=frame_end)

def animate_finger_curl(finger_objs, frame_start, frame_end, curl_amount=45):
    for i, f_obj in enumerate(finger_objs):
        is_pose_bone = hasattr(f_obj, 'id_data') and hasattr(f_obj.id_data, 'type') and f_obj.id_data.type == 'ARMATURE'
        arm_obj, dp = (f_obj.id_data, f'pose.bones["{f_obj.name}"].rotation_euler') if is_pose_bone else (f_obj, "rotation_euler")
        f_obj.rotation_euler[0] = 0; arm_obj.keyframe_insert(data_path=dp, index=0, frame=frame_start)
        f_obj.rotation_euler[0] = math.radians(curl_amount); arm_obj.keyframe_insert(data_path=dp, index=0, frame=(frame_start + frame_end) // 2)
        f_obj.rotation_euler[0] = 0; arm_obj.keyframe_insert(data_path=dp, index=0, frame=frame_end)

def apply_reactive_foliage(foliage_objs, trigger_obj, frame_start, frame_end, threshold=3.0):
    for obj in foliage_objs:
        if not obj.animation_data or not obj.animation_data.action: continue
        for fcurve in get_action_curves(obj.animation_data.action, obj=obj):
            for mod in fcurve.modifiers:
                if mod.type == 'NOISE':
                    mod.strength = 0.05
                    for f in range(frame_start, frame_end, 24):
                        if (obj.location - trigger_obj.location).length < threshold: mod.strength = 0.15; break

def animate_leaf_twitches(leaf_objs, frame_start, frame_end):
    for leaf in leaf_objs: insert_looping_noise(leaf, "rotation_euler", index=1, strength=0.1, scale=5.0, frame_start=frame_start, frame_end=frame_end)

def animate_pulsing_emission(obj, frame_start, frame_end, base_strength=5.0, pulse_amplitude=10.0, cycle=48):
    for slot in obj.material_slots:
        if slot.material:
            for f in range(frame_start, frame_end + 1, cycle):
                set_principled_socket(slot.material, "Emission Strength", base_strength, frame=f)
                set_principled_socket(slot.material, "Emission Strength", base_strength + pulse_amplitude, frame=f + cycle // 2)

def animate_dynamic_pupils(pupil_objs, light_energy_provider, frame_start, frame_end):
    for p in pupil_objs:
        p.scale = (1, 1, 1); p.keyframe_insert(data_path="scale", frame=frame_start)
        p.scale = (0.5, 0.5, 0.5); p.keyframe_insert(data_path="scale", frame=2000); p.scale = (1.5, 1.5, 1.5); p.keyframe_insert(data_path="scale", frame=2300)

def apply_thought_motes(character_obj, frame_start, frame_end, count=5):
    for i in range(count):
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.05, location=character_obj.location + mathutils.Vector((0,0,2))); mote = bpy.context.object; mote.name = f"ThoughtMote_{character_obj.name}_{i}"; insert_looping_noise(mote, "location", strength=0.5, scale=10.0, frame_start=frame_start, frame_end=frame_end)

def animate_gait(torso, mode='HEAVY', frame_start=1, frame_end=15000):
    from assets import plant_humanoid
    plant_humanoid.animate_walk(torso, frame_start, frame_end, step_height=(0.2 if mode == 'HEAVY' else 0.08), cycle_length=(64 if mode == 'HEAVY' else 32))

def animate_cloak_sway(cloak_obj, frame_start, frame_end): insert_looping_noise(cloak_obj, "rotation_euler", index=0, strength=0.05, scale=5.0, frame_start=frame_start, frame_end=frame_end)

def animate_shoulder_shrug(torso_obj, frame_start, frame_end, cycle=120): insert_looping_noise(torso_obj, "rotation_euler", index=0, strength=0.05, scale=cycle/2, frame_start=frame_start, frame_end=frame_end)

def animate_gnome_stumble(gnome_obj, frame):
    gnome_obj.rotation_euler[1] = math.radians(15); gnome_obj.keyframe_insert(data_path="rotation_euler", index=1, frame=frame)
    gnome_obj.rotation_euler[1] = 0; gnome_obj.keyframe_insert(data_path="rotation_euler", index=1, frame=frame + 5)

def apply_thermal_transition(master, frame_start, frame_end, color_start=(0.5, 0, 1), color_end=(1, 0.5, 0)):
    bg = master.scene.world.node_tree.nodes.get("Background")
    if bg: set_socket_value(bg.inputs[0], (*color_start, 1), frame=frame_start); set_socket_value(bg.inputs[0], (*color_end, 1), frame=frame_end)

def setup_chromatic_aberration(scene, strength=0.01):
    tree = get_compositor_node_tree(scene); distort = tree.nodes.get("ChromaticAberration") or tree.nodes.new(type='CompositorNodeLensdist'); distort.name = "ChromaticAberration"; set_node_input(distort, 'Dispersion', strength); return distort

def setup_god_rays(scene, beam_obj=None):
    beam = beam_obj or bpy.data.objects.get("LightShaftBeam")
    if beam:
        beam.data.color = (0, 1, 0.2); beam.data.keyframe_insert(data_path="color", frame=401); beam.data.color = (1, 0.7, 0.1); beam.data.keyframe_insert(data_path="color", frame=3801); animate_light_flicker("LightShaftBeam", 1, 15000, strength=0.1)
    sun = bpy.data.objects.get("Sun"); 
    if sun: sun.data.color = (1, 0.9, 0.8)

def animate_vignette(scene, frame_start, frame_end, start_val=0.0, end_val=0.0):
    tree = get_compositor_node_tree(scene); vig = tree.nodes.get("Vignette")
    if vig: target = vig.inputs.get('Factor') or vig.inputs[0]; set_socket_value(target, start_val, frame=frame_start); set_socket_value(target, end_val, frame=frame_end)

def apply_neuron_color_coding(neuron_mat, frame, color=(1, 0, 0)):
    if neuron_mat and neuron_mat.node_tree:
        bsdf = neuron_mat.node_tree.nodes.get("Principled BSDF")
        if bsdf: bsdf.inputs["Emission Color"].default_value = (*color, 1); bsdf.inputs["Emission Color"].keyframe_insert(data_path="default_value", frame=frame)

def setup_bioluminescent_flora(mat, color=(0, 1, 0.5)):
    if mat and mat.node_tree:
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf: bsdf.inputs["Emission Color"].default_value = (*color, 1); bsdf.inputs["Emission Strength"].default_value = 2.0

def animate_mood_fog(scene, frame, density=0.01):
    world = scene.world
    if world:
        vol = world.node_tree.nodes.get("Volume Scatter")
        if vol: vol.inputs['Density'].default_value = density; vol.inputs['Density'].keyframe_insert(data_path="default_value", frame=frame)

def apply_film_flicker(scene, frame_start, frame_end, strength=0.05):
    tree = get_compositor_node_tree(scene); bright = tree.nodes.get("Bright/Contrast") or tree.nodes.new('CompositorNodeBrightContrast'); bright.name = "Bright/Contrast"
    if not tree.animation_data: tree.animation_data_create()
    if not tree.animation_data.action: tree.animation_data.action = bpy.data.actions.new(name="CompositorAction")
    target = bright.inputs.get('Bright') or bright.inputs[0]; data_path = f'nodes["{bright.name}"].inputs["{target.identifier}"].default_value'
    fcurve = get_or_create_fcurve(tree.animation_data.action, data_path, ref_obj=tree)
    if fcurve:
        mod = fcurve.modifiers.new(type='NOISE'); mod.strength, mod.scale = strength, 1.0; mod.use_restricted_range, mod.frame_start, mod.frame_end = True, frame_start, frame_end

def apply_glow_trails(scene):
    tree = get_compositor_node_tree(scene)
    if not tree: return None
    blur = tree.nodes.get("GlowTrail") or tree.nodes.new(type='CompositorNodeVecBlur'); blur.name = "GlowTrail"; set_node_input(blur, 'Factor', 0.8); set_node_input(blur, 'Samples', 16); return blur

def setup_saturation_control(scene):
    tree = get_compositor_node_tree(scene)
    if not tree: return None
    huesat = tree.nodes.get("GlobalSaturation") or tree.nodes.new(type='CompositorNodeHueSat'); huesat.name = "GlobalSaturation"; set_node_input(huesat, 'Saturation', 1.0); return huesat

def apply_desaturation_beat(scene, frame_start, frame_end, saturation=0.2):
    huesat = setup_saturation_control(scene)
    if huesat: set_node_input(huesat, 'Saturation', 1.0, frame=frame_start - 5); set_node_input(huesat, 'Saturation', saturation, frame=frame_start); set_node_input(huesat, 'Saturation', saturation, frame=frame_end); set_node_input(huesat, 'Saturation', 1.0, frame=frame_end + 5)

def animate_dialogue_v2(char_or_obj, frame_start, frame_end, intensity=1.0, speed=1.0):
    target_obj, data_path = None, "scale"
    if isinstance(char_or_obj, str):
        arm = bpy.data.objects.get(char_or_obj)
        if arm and arm.type == 'ARMATURE':
            target_obj = arm; mouth_bone = next((b for b in arm.pose.bones if "Mouth" in b.name), None); data_path = f'pose.bones["{mouth_bone.name}"].scale' if mouth_bone else 'pose.bones["Mouth"].scale'
        if not target_obj: target_obj = bpy.data.objects.get(f"{char_or_obj}_Mouth")
    else:
        target_obj = char_or_obj
        if hasattr(target_obj, "id_data") and target_obj.id_data.type == 'ARMATURE': data_path = f'pose.bones["{target_obj.name}"].scale'; target_obj = target_obj.id_data
    if not target_obj: return
    if not target_obj.animation_data: target_obj.animation_data_create()
    action = target_obj.animation_data.action or bpy.data.actions.new(name=f"Dialogue_{target_obj.name}"); target_obj.animation_data.action = action
    if hasattr(action, "layers") and len(action.layers) == 0: action.layers.new(name="Main Layer")
    jaw_bone = target_obj.pose.bones.get("Jaw") if hasattr(target_obj, "pose") else None
    neck_bone = target_obj.pose.bones.get("Neck") if hasattr(target_obj, "pose") else None
    def set_mouth_val(val, frame):
        if "pose.bones" in data_path:
            try:
                bname = data_path.split('"')[1]
                if bname in target_obj.pose.bones: target_obj.pose.bones[bname].scale[2] = val; target_obj.keyframe_insert(data_path=data_path, index=2, frame=frame)
            except: pass
        else:
            try: target_obj.scale[2] = val; target_obj.keyframe_insert(data_path=data_path, index=2, frame=frame)
            except: pass
        if jaw_bone: jaw_bone.rotation_euler[0] = math.radians((val - 0.4) * -15); target_obj.keyframe_insert(data_path=f'pose.bones["{jaw_bone.name}"].rotation_euler', index=0, frame=frame)
        if neck_bone: neck_bone.rotation_euler[2] += random.uniform(-0.01, 0.01); target_obj.keyframe_insert(data_path=f'pose.bones["{neck_bone.name}"].rotation_euler', index=2, frame=frame)
    current_f = frame_start
    while current_f < frame_end:
        if random.random() > 0.9: set_mouth_val(0.4, current_f); current_f += 12; continue
        cycle_len = random.randint(4, 12) / speed; open_amount = random.uniform(0.5, 1.5) * intensity; set_mouth_val(0.4, current_f)
        mid_f = current_f + cycle_len / 2
        if mid_f < frame_end: set_mouth_val(open_amount, mid_f)
        current_f += cycle_len
    set_mouth_val(0.4, frame_end)

def animate_expression_blend(character_name, frame, expression='NEUTRAL', duration=12):
    from assets import plant_humanoid
    armature = bpy.data.objects.get(character_name)
    if not armature or armature.type != 'ARMATURE':
        mesh = bpy.data.objects.get(f"{character_name}_Torso")
        if mesh and mesh.parent and mesh.parent.type == 'ARMATURE': armature = mesh.parent
        else: return
    if duration > 0: plant_humanoid.animate_expression(armature, frame - duration, expression=None)
    plant_humanoid.animate_expression(armature, frame, expression=expression)

def animate_reaction_shot(character_name, frame_start, frame_end):
    char_name = character_name.split('_')[0]; arm = bpy.data.objects.get(char_name)
    if arm and arm.type == 'ARMATURE':
        for side in ["L", "R"]:
            eye_bone = arm.pose.bones.get(f"Eye.{side}")
            if eye_bone: animate_blink(eye_bone, frame_start, frame_end, interval_range=(40, 100))
        torso = arm.pose.bones.get("Torso") or next((b for b in arm.pose.bones if "Torso" in b.name), None)
        if torso:
            dp = f'pose.bones["{torso.name}"].rotation_euler'
            for f in range(frame_start, frame_end, 60): torso.rotation_euler[0] = 0; arm.keyframe_insert(data_path=dp, index=0, frame=f); torso.rotation_euler[0] = math.radians(random.uniform(1, 3)); arm.keyframe_insert(data_path=dp, index=0, frame=f + 30); torso.rotation_euler[0] = 0; arm.keyframe_insert(data_path=dp, index=0, frame=f + 60)
        for side in ["L", "R"]:
            brow = arm.pose.bones.get(f"Brow.{side}")
            if brow:
                dp = f'pose.bones["{brow.name}"].location'
                for f in range(frame_start, frame_end, 120): brow.location[2] = 0; arm.keyframe_insert(data_path=dp, index=2, frame=f); brow.location[2] = random.uniform(0, 0.05); arm.keyframe_insert(data_path=dp, index=2, frame=f + 40); brow.location[2] = 0; arm.keyframe_insert(data_path=dp, index=2, frame=f + 120)
        head_bone = arm.pose.bones.get("Head")
        if head_bone:
            dp = f'pose.bones["{head_bone.name}"].rotation_euler'
            for f in range(frame_start, frame_end, 150): head_bone.rotation_euler[2] = 0; arm.keyframe_insert(data_path=dp, index=2, frame=f); head_bone.rotation_euler[2] = math.radians(random.uniform(-5, 5)); arm.keyframe_insert(data_path=dp, index=2, frame=f + 75); head_bone.rotation_euler[2] = 0; arm.keyframe_insert(data_path=dp, index=2, frame=f + 150)
        return
    head = bpy.data.objects.get(f"{char_name}_Head") or bpy.data.objects.get(f"{char_name}_Torso")
    if head:
        for child in head.children:
            if "Eye" in child.name: animate_blink(child, frame_start, frame_end, interval_range=(40, 100))
    torso_obj = bpy.data.objects.get(f"{char_name}_Torso")
    if torso_obj:
        for f in range(frame_start, frame_end, 60): torso_obj.rotation_euler[0] = 0; torso_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=f); torso_obj.rotation_euler[0] = math.radians(random.uniform(1, 3)); torso_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=f + 30); torso_obj.rotation_euler[0] = 0; torso_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=f + 60)

def animate_plant_advance(master, frame_start, frame_end):
    if not hasattr(master, 'h1') or not hasattr(master, 'h2') or not hasattr(master, 'gnome'): return
    if not master.h1 or not master.h2 or not master.gnome: return
    move_start, move_peak = 10901, 12000
    master.h1.location.y = 0.0; master.h1.keyframe_insert(data_path="location", index=1, frame=move_start); master.h1.location.y = 3.0; master.h1.keyframe_insert(data_path="location", index=1, frame=move_peak)
    master.h2.location.y = 0.0; master.h2.keyframe_insert(data_path="location", index=1, frame=move_start); master.h2.location.y = 3.0; master.h2.keyframe_insert(data_path="location", index=1, frame=move_peak)
    for char in [master.h1, master.h2]: char.scale = (1, 1, 1); char.keyframe_insert(data_path="scale", frame=move_start + 300); char.scale = (1.2, 1.2, 1.2); char.keyframe_insert(data_path="scale", frame=move_peak)
    master.gnome.scale = (0.6, 0.6, 0.6); master.gnome.keyframe_insert(data_path="scale", frame=move_start + 300); master.gnome.scale = (0.3, 0.3, 0.3); master.gnome.keyframe_insert(data_path="scale", frame=move_peak)

def animate_fireflies(center, volume_size=(5, 5, 5), density=10, frame_start=1, frame_end=15000):
    container_name = "Fireflies"; container = bpy.data.collections.get(container_name) or bpy.data.collections.new(container_name)
    if container_name not in bpy.context.scene.collection.children: bpy.context.scene.collection.children.link(container)
    mat = bpy.data.materials.new(name="FireflyMat"); bsdf = mat.node_tree.nodes["Principled BSDF"]; bsdf.inputs["Base Color"].default_value = (0.8, 1.0, 0.2, 1); set_blend_method(mat, 'BLEND')
    for i in range(density):
        loc = center + mathutils.Vector((random.uniform(-volume_size[0], volume_size[0]), random.uniform(-volume_size[1], volume_size[1]), random.uniform(0, volume_size[2]))); bpy.ops.mesh.primitive_ico_sphere_add(radius=0.02, location=loc); fly = bpy.context.object; fly.name = f"Firefly_{i}"; container.objects.link(fly)
        if fly.name in bpy.context.scene.collection.objects: bpy.context.scene.collection.objects.unlink(fly)
        fly.data.materials.append(mat); insert_looping_noise(fly, "location", strength=0.5, scale=40.0, frame_start=frame_start, frame_end=frame_end); animate_pulsing_emission(fly, frame_start, frame_end, base_strength=2.0, pulse_amplitude=10.0, cycle=random.randint(20, 60))
        fly.hide_render = True; fly.keyframe_insert(data_path="hide_render", frame=frame_start - 1); fly.hide_render = False; fly.keyframe_insert(data_path="hide_render", frame=frame_start); fly.hide_render = True; fly.keyframe_insert(data_path="hide_render", frame=frame_end)

def create_noise_based_material(name, colors=None, noise_type='NOISE', noise_scale=5.0, roughness=0.5, color_ramp_colors=None):
    if colors is None: colors = color_ramp_colors or [(0,0,0,1), (1,1,1,1)]
    mat = bpy.data.materials.new(name=name); nodes, links = mat.node_tree.nodes, mat.node_tree.links; nodes.clear()
    node_out = nodes.new(type='ShaderNodeOutputMaterial'); node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled'); node_bsdf.inputs['Roughness'].default_value = roughness
    if noise_type == 'WAVE': node_noise = nodes.new(type='ShaderNodeTexWave')
    elif noise_type == 'VORONOI': node_noise = nodes.new(type='ShaderNodeTexVoronoi')
    else: node_noise = nodes.new(type='ShaderNodeTexNoise')
    node_noise.inputs['Scale'].default_value = noise_scale
    node_ramp = nodes.new(type='ShaderNodeValToRGB'); node_ramp.name = "VAL_TO_RGB"; elems = node_ramp.color_ramp.elements
    for i, color in enumerate(colors):
        if i < len(elems): elems[i].color = color
        else: elems.new(i / max(1, len(colors)-1)).color = color
    links.new(node_noise.outputs[0], node_ramp.inputs['Fac']); links.new(node_ramp.outputs['Color'], node_bsdf.inputs['Base Color']); links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface']); return mat

def animate_vignette_breathing(scene, frame_start, frame_end, strength=0.05, cycle=120):
    tree = get_compositor_node_tree(scene); vig = tree.nodes.get("Vignette")
    if vig:
        if not tree.animation_data: tree.animation_data_create()
        if not tree.animation_data.action: tree.animation_data.action = bpy.data.actions.new(name="CompositorAction")
        target = vig.inputs.get('Factor') or vig.inputs[0]; data_path = f'nodes["{vig.name}"].inputs["{target.identifier}"].default_value'
        fcurve = get_or_create_fcurve(tree.animation_data.action, data_path, ref_obj=tree)
        if fcurve: mod = fcurve.modifiers.new(type='NOISE'); mod.strength, mod.scale = strength, cycle / 2; mod.use_restricted_range, mod.frame_start, mod.frame_end = True, frame_start, frame_end

def animate_floating_spores(center, volume_size=(10, 10, 5), density=50, frame_start=1, frame_end=15000):
    container_name = "SanctuarySpores"; container = bpy.data.collections.get(container_name) or bpy.data.collections.new(container_name)
    if container_name not in bpy.context.scene.collection.children: bpy.context.scene.collection.children.link(container)
    mat = bpy.data.materials.get("SporeMat") or bpy.data.materials.new(name="SporeMat")
    if not mat.use_nodes: mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]; bsdf.inputs["Base Color"].default_value = (0.2, 1.0, 0.5, 1); set_principled_socket(mat, "Emission", (0.2, 1.0, 0.5, 1)); set_principled_socket(mat, "Emission Strength", 5.0); set_blend_method(mat, 'BLEND')
    for i in range(density):
        loc = center + mathutils.Vector((random.uniform(-volume_size[0], volume_size[0]), random.uniform(-volume_size[1], volume_size[1]), random.uniform(0, volume_size[2]))); bpy.ops.mesh.primitive_ico_sphere_add(radius=0.015, location=loc); spore = bpy.context.object; spore.name = f"Spore_{i}"; container.objects.link(spore)
        if spore.name in bpy.context.scene.collection.objects: bpy.context.scene.collection.objects.unlink(spore)
        spore.data.materials.append(mat); insert_looping_noise(spore, "location", strength=0.8, scale=60.0, frame_start=frame_start, frame_end=frame_end); animate_pulsing_emission(spore, frame_start, frame_end, base_strength=1.0, pulse_amplitude=4.0, cycle=random.randint(40, 100))
        spore.hide_render = True; spore.keyframe_insert(data_path="hide_render", frame=frame_start - 1); spore.hide_render = False; spore.keyframe_insert(data_path="hide_render", frame=frame_start); spore.hide_render = True; spore.keyframe_insert(data_path="hide_render", frame=frame_end)
