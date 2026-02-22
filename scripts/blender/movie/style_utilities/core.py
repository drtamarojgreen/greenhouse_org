"""
Core API compatibility and utility helpers for Greenhouse Movie Production.
(Point 91 & 92)
"""
import bpy
import math
import mathutils
import random

class FCurveProxy:
    """Provides compatibility between Blender 5.0 Slotted Actions and legacy path-based tests."""
    def __init__(self, target, path):
        self._target = target
        self.data_path = path
        self.keyframe_points = getattr(target, "keyframe_points", [])
        self.modifiers = getattr(target, "modifiers", [])
        self.array_index = getattr(target, "array_index", 0)
    def __getattr__(self, name):
        return getattr(self._target, name)
    def evaluate(self, frame):
        try: return self._target.evaluate(frame)
        except: return 0.0
    def as_pointer(self):
        try:
            return self._target.as_pointer()
        except:
            return id(self._target)

def get_action_curves(action, create_if_missing=False):
    """(Point 91) Robust recursive F-curve collector for Blender 5.0 Slotted/Layered Actions."""
    if action is None: return []
    if create_if_missing and hasattr(action, "layers") and len(action.layers) == 0:
        action.layers.new(name="Main Layer")

    curves = []
    seen_ids = set()

    def get_bone_prefix(name):
        if not name: return ""
        bone_kws = (".L", ".R", "Torso", "Head", "Neck", "Jaw", "Mouth", "Leg.", "Arm.", "Eye", "Brow")
        if any(kw in name for kw in bone_kws):
            clean_name = str(name).split(":")[-1]
            return f'pose.bones["{clean_name}"].'
        return ""

    def wrap_fc(fc, prefix=""):
        if not fc or not hasattr(fc, "keyframe_points"): return

        # Use as_pointer if available for stable ID
        ptr = id(fc)
        try: ptr = fc.as_pointer()
        except: pass

        fid = f"{ptr}_{prefix}_{getattr(fc, 'array_index', 0)}"
        if fid in seen_ids: return
        seen_ids.add(fid)

        path = getattr(fc, "data_path", "")
        if not path:
             path = getattr(fc, "path_full", getattr(fc, "path", ""))

        # Point 142: Ensure path is valid string
        path = str(path)

        # If path is relative (no pose.bones), prepend prefix
        is_relative = not any(p in path for p in ("pose.bones", "modifiers", "nodes", "["))
        if is_relative and prefix:
            path = prefix + path

        curves.append(FCurveProxy(fc, path))

    # 1. Direct F-curves (Legacy and 5.0 Flat)
    if hasattr(action, "fcurves") and action.fcurves:
        for fc in action.fcurves:
            # Point 142: Try to discover slot-based prefixes if not absolute
            prefix = ""
            if hasattr(fc, "slot"):
                prefix = get_bone_prefix(getattr(fc.slot, "name", ""))
            wrap_fc(fc, prefix)

    # 2. Blender 5.0 Layers & Channels (Recursively)
    def traverse_channels(channels, prefix=""):
        if not channels: return
        for chan in channels:
            # Check for slot name to update prefix
            curr_prefix = prefix
            slot = getattr(chan, "slot", None)
            if slot:
                slot_name = getattr(slot, "name", getattr(slot, "identifier", ""))
                new_p = get_bone_prefix(slot_name)
                if new_p: curr_prefix = new_p

            fc = getattr(chan, "fcurve", None)
            if not fc and hasattr(chan, "keyframe_points"): fc = chan
            if fc: wrap_fc(fc, curr_prefix)

            # Recurse into child channels (Point 142: handle potential Infinite recursion)
            if hasattr(chan, "channels") and chan.channels:
                if chan.channels != channels: # Safety
                    traverse_channels(chan.channels, curr_prefix)

    if hasattr(action, "layers"):
        for layer in action.layers:
            if hasattr(layer, "channels") and layer.channels:
                traverse_channels(layer.channels)
            if hasattr(layer, "strips") and layer.strips:
                for strip in layer.strips:
                    if hasattr(strip, "channels") and strip.channels:
                        traverse_channels(strip.channels)

    # 3. Blender 5.0 Slots & Bindings (Fallback discovery)
    if hasattr(action, "slots"):
        for slot in action.slots:
            slot_name = getattr(slot, "name", getattr(slot, "identifier", ""))
            prefix = get_bone_prefix(slot_name)
            if hasattr(slot, "bindings"):
                for binding in slot.bindings:
                    if hasattr(binding, "fcurves"):
                        for fc in binding.fcurves: wrap_fc(fc, prefix)
                    if hasattr(binding, "channels"):
                        traverse_channels(binding.channels, prefix)

    return curves



def ensure_action(obj, action_name_prefix="Anim"):
    """Ensure an animatable object has animation_data + action and return the action."""
    if obj is None:
        return None
    if not getattr(obj, "animation_data", None):
        obj.animation_data_create()
    action = obj.animation_data.action
    if not action:
        action = bpy.data.actions.new(name=f"{action_name_prefix}_{obj.name}")
        obj.animation_data.action = action
    if hasattr(action, "layers") and len(action.layers) == 0:
        action.layers.new(name="Main Layer")
    return action

def get_or_create_fcurve(action, data_path, index=0, ref_obj=None):
    """Retrieves or creates an F-Curve using the Blender 5.0+ Layered Action API."""
    if action is None or ref_obj is None: return None
    try:
        return action.fcurve_ensure_for_datablock(ref_obj, data_path=data_path, index=index)
    except:
        if not action.fcurves: return None
        return action.fcurves.find(data_path, index=index)

def get_eevee_engine_id():
    """Probes Blender for the correct Eevee engine identifier."""
    try:
        for engine in ['BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE']:
            if engine in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items:
                return engine
    except Exception: pass
    return 'BLENDER_EEVEE'

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
        if s.identifier == identifier: return s
    return None

def create_compositor_output(tree):
    """Creates the final output node."""
    node = tree.nodes.new('NodeGroupOutput')
    if hasattr(tree, "interface"):
        exists = any(s.name == "Image" for s in tree.interface.items_tree if s.item_type == 'SOCKET')
        if not exists:
            tree.interface.new_socket(name="Image", in_out='OUTPUT', socket_type='NodeSocketColor')
    return node

def set_socket_value(socket, value, frame=None):
    """Point 92: Robustly sets a socket value."""
    if socket is None: return False
    try:
        # Determine if target socket expects a sequence (Point 142)
        dv = getattr(socket, "default_value", None)
        expects_seq = dv is not None and hasattr(dv, "__len__") and not isinstance(dv, (str, bytes))
        provides_seq = isinstance(value, (list, tuple, mathutils.Vector))

        if provides_seq and not expects_seq:
            # Downcast sequence to scalar (e.g., Color tuple to Factor float)
            try:
                if len(value) >= 3:
                    target_val = float(value[0] * 0.299 + value[1] * 0.587 + value[2] * 0.114)
                else:
                    target_val = float(value[0])
                socket.default_value = target_val
            except:
                socket.default_value = float(value[0])
        elif not provides_seq and expects_seq:
            # Upcast scalar to sequence
            try:
                socket.default_value = [value] * len(dv)
            except:
                try: socket.default_value = (value, value, value, 1.0)
                except: pass
        else:
            # Direct assignment or best effort conversion
            try:
                socket.default_value = value
            except:
                if expects_seq: socket.default_value = tuple(value)
                else: socket.default_value = float(value)

        if frame is not None:
            try:
                socket.keyframe_insert(data_path="default_value", frame=frame)
            except: pass
        return True
    except (AttributeError, TypeError, ValueError) as e:
        print(f"Warning: Failed to set socket {getattr(socket, 'name', 'unknown')} to {value}: {e}")
        return False

def set_node_input(node, name, value, frame=None):
    """Sets a node parameter via input socket."""
    target = get_socket_by_identifier(node.inputs, name)
    if not target:
        match_name = name.lower().replace("_", " ")
        for socket in node.inputs:
            curr_name = socket.name.lower().replace("_", " ")
            if curr_name == match_name:
                target = socket
                break
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
    """Robust Mix node creation for Blender 5.0+."""
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
    """Returns (Factor, Input1, Input2) sockets."""
    if node is None: return None, None, None
    if node.bl_idname == 'CompositorNodeAlphaOver': return node.inputs[0], node.inputs[1], node.inputs[2]

    # Identify sockets by common names/identifiers and fallback to order
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
    """Returns the main output socket."""
    if node is None: return None
    if node.bl_idname == 'CompositorNodeAlphaOver': return node.outputs[0]
    dt = getattr(node, 'data_type', 'RGBA')
    if dt == 'RGBA': return get_socket_by_identifier(node.outputs, 'Result_Color') or node.outputs.get('Result') or node.outputs[0]
    return node.outputs[0]

def get_principled_socket(mat_or_node, socket_name):
    """Safely retrieves a socket from Principled BSDF."""
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
    """Guarded setter for Principled BSDF sockets."""
    sock = get_principled_socket(mat_or_node, socket_name)
    if sock: return set_socket_value(sock, value, frame=frame)
    return False

def patch_fbx_importer():
    """Patches the Blender 5.0 FBX importer."""
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

def insert_looping_noise(obj, data_path, index=-1, frame_start=1, frame_end=15000, strength=0.05, scale=10.0, phase=None):
    """Inserts noise modifier to a data path."""
    anim_target = obj
    path_prefix = ""
    if hasattr(obj, "id_data") and obj.rna_type.identifier == 'PoseBone':
        anim_target = obj.id_data; path_prefix = f'pose.bones["{obj.name}"].'
    elif hasattr(obj, "bone") and hasattr(obj, "id_data") and obj.id_data.type == 'ARMATURE':
        anim_target = obj.id_data; path_prefix = f'pose.bones["{obj.name}"].'
    action = ensure_action(anim_target, action_name_prefix="Noise")
    indices = [index] if index >= 0 else [0, 1, 2]
    full_path = path_prefix + data_path
    for idx in indices:
        fcurve = get_or_create_fcurve(action, full_path, idx, ref_obj=anim_target)
        if not fcurve: continue
        if not fcurve.keyframe_points: anim_target.keyframe_insert(data_path=full_path, index=idx, frame=frame_start)
        modifier = fcurve.modifiers.new(type='NOISE')
        modifier.strength = strength * (0.8 + random.random() * 0.4)
        modifier.scale = scale * (0.8 + random.random() * 0.4)
        modifier.phase = phase if phase is not None else random.random() * 100
        modifier.use_restricted_range = True
        modifier.frame_start = frame_start; modifier.frame_end = frame_end
        modifier.blend_in = 10; modifier.blend_out = 10

def camera_push_in(cam, target, frame_start, frame_end, distance=5):
    """Animates camera moving towards target."""
    direction = (target.location - cam.location).normalized()
    cam.keyframe_insert(data_path="location", frame=frame_start)
    cam.location += direction * distance
    cam.keyframe_insert(data_path="location", frame=frame_end)

def camera_pull_out(cam, target, frame_start, frame_end, distance=5):
    """Animates camera moving away from target."""
    camera_push_in(cam, target, frame_start, frame_end, distance=-distance)

def apply_camera_shake(cam, frame_start, frame_end, strength=0.1):
    """Adds noise-based camera shake."""
    insert_looping_noise(cam, "location", strength=strength, scale=1.0, frame_start=frame_start, frame_end=frame_end)

def ease_action(obj, data_path, index=-1, interpolation='BEZIER', easing='EASE_IN_OUT'):
    """Sets easing for all keyframes of a specific data path."""
    if not obj.animation_data or not obj.animation_data.action: return
    for fcurve in get_action_curves(obj.animation_data.action):
        if fcurve.data_path == data_path and (index == -1 or fcurve.array_index == index):
            for kp in fcurve.keyframe_points: kp.interpolation, kp.easing = interpolation, easing

def setup_chromatic_aberration(scene, strength=0.01):
    """Adds a Lens Distortion node for chromatic aberration."""
    tree = get_compositor_node_tree(scene)
    distort = tree.nodes.get("ChromaticAberration") or tree.nodes.new(type='CompositorNodeLensdist')
    distort.name = "ChromaticAberration"
    set_node_input(distort, 'Dispersion', strength)
    return distort

def setup_saturation_control(scene):
    """Adds a Hue/Saturation node."""
    tree = get_compositor_node_tree(scene)
    if not tree: return None
    huesat = tree.nodes.get("GlobalSaturation") or tree.nodes.new(type='CompositorNodeHueSat')
    huesat.name = "GlobalSaturation"
    set_node_input(huesat, 'Saturation', 1.0)
    return huesat

def set_blend_method(mat, method='BLEND'):
    """Version-safe transparency method setter."""
    if hasattr(mat, 'surface_render_method'):
        if bpy.app.version >= (4, 2, 0): mat.surface_render_method = 'BLENDED'
        else: mat.blend_method = method
    else: mat.blend_method = method

def clear_scene_selective():
    """Clear objects/data without a full session reset."""
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete()
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.actions, bpy.data.curves, bpy.data.armatures, bpy.data.node_groups):
        for item in block:
            if item.users == 0: block.remove(item)

def apply_iris_wipe(scene, frame_start, frame_end, mode='IN'):
    """Iris wipe transition."""
    try:
        import compositor_settings
        compositor_settings.animate_iris_wipe(scene, frame_start, frame_end, mode=mode)
    except: pass

def set_obj_visibility(obj, visible, frame):
    """Recursively sets hide_render and hide_viewport for an object and its children (Point 142)."""
    if not obj: return
    obj.hide_render = obj.hide_viewport = not visible
    obj.keyframe_insert(data_path="hide_render", frame=frame)
    if obj.animation_data and obj.animation_data.action:
        for fc in get_action_curves(obj.animation_data.action):
            if fc.data_path == "hide_render":
                for kp in fc.keyframe_points:
                    if int(kp.co[0]) == frame: kp.interpolation = 'CONSTANT'

    for child in obj.children:
        set_obj_visibility(child, visible, frame)
