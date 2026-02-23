"""
Compositor, node, and material socket settings for Greenhouse Movie Production.
"""
import bpy
import mathutils
from .fcurves_operations import get_action_curves

def get_compositor_node_tree(scene):
    """Directly retrieves the compositor node tree for Blender 5.x."""
    if not scene: return None
    scene.use_nodes = True
    
    # In some versions it's scene.node_tree, in others it's compositing_node_tree
    tree = getattr(scene, 'node_tree', None) or getattr(scene, 'compositing_node_tree', None)
    
    if not tree:
        # Check if we can find it in bpy.data.node_groups as a fallback
        for ng in bpy.data.node_groups:
            if ng.type == 'COMPOSITOR' and ng.name == "Compositing":
                tree = ng
                break
                
    if not tree:
        # Final fallback: return what we have even if None, 
        # but try to access standard attributes
        tree = getattr(scene, 'compositing_node_group', None)
        
    return tree

def get_socket_by_identifier(collection, identifier):
    """Robustly finds a socket in a collection by its identifier."""
    for s in collection:
        if s.identifier == identifier: return s
    return None

def create_compositor_output(tree):
    """Creates the final output node (Composite node for the main pipeline)."""
    node = tree.nodes.new('CompositorNodeComposite')
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
