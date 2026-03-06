import bpy
import mathutils
import sys
import os

# Add movie root for style utilities
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import style_utilities as style

def is_animated(obj, data_path, index=-1):
    """
    Robustly checks if a property is animated via keyframes or noise modifiers.
    """
    if not obj or not obj.animation_data or not obj.animation_data.action:
        return False
    
    curves = style.get_action_curves(obj.animation_data.action, obj=obj)
    for fc in curves:
        if fc.data_path == data_path and (index == -1 or fc.array_index == index):
            # Check for keyframe movement
            if len(fc.keyframe_points) > 1:
                vals = [kp.co[1] for kp in fc.keyframe_points]
                if max(vals) - min(vals) > 0.0001:
                    return True
            
            # Check for active noise modifiers
            if any(mod.type == 'NOISE' and not mod.mute for mod in fc.modifiers):
                return True
    return False

def get_animation_bounds(obj, data_path, index=0):
    """Returns (min, max) values for an animated property over its entire range."""
    if not obj or not obj.animation_data or not obj.animation_data.action:
        return None, None
    
    curves = style.get_action_curves(obj.animation_data.action, obj=obj)
    for fc in curves:
        if fc.data_path == data_path and fc.array_index == index:
            vals = [kp.co[1] for kp in fc.keyframe_points]
            if not vals: return None, None
            return min(vals), max(vals)
    return None, None

def validate_node_connectivity(node_tree, target_node_name, expected_input_socket=None, from_node_type=None):
    """
    Verifies that a specific node is present and correctly linked.
    """
    target = node_tree.nodes.get(target_node_name)
    if not target:
        return False, f"Node '{target_node_name}' not found"
    
    if expected_input_socket:
        socket = target.inputs.get(expected_input_socket) or style.get_socket_by_identifier(target.inputs, expected_input_socket)
        if not socket:
            return False, f"Socket '{expected_input_socket}' not found on '{target_node_name}'"
        
        if not socket.is_linked:
            return False, f"Socket '{expected_input_socket}' on '{target_node_name}' is not linked"
        
        if from_node_type:
            linked_node = socket.links[0].from_node
            if linked_node.type != from_node_type:
                return False, f"Expected input from {from_node_type}, got {linked_node.type}"
                
    return True, "Valid"

def get_principled_bsdf(mat):
    """Returns the Principled BSDF node for a material if it exists."""
    if not mat or not mat.use_nodes or not mat.node_tree:
        return None
    return next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)

def get_evaluated_value(obj, data_path, frame):
    """Evaluates a property at a specific frame using the animation data."""
    if not obj or not obj.animation_data or not obj.animation_data.action:
        return None
    
    curves = style.get_action_curves(obj.animation_data.action, obj=obj)
    for fc in curves:
        if fc.data_path == data_path:
            return fc.evaluate(frame)
    return None

def check_mesh_visibility_at_frame(obj, frame):
    """Verifies if a mesh is actually intended to be shown at a specific frame."""
    # Note: Evaluates hide_render property
    val = get_evaluated_value(obj, "hide_render", frame)
    if val is None:
        return not obj.hide_render
    return val < 0.5
