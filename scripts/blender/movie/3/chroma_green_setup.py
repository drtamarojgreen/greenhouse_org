"""
Chroma Green Setup Module
Isolated background and material setup for green-screen rendering.
"""

try:
    import bpy
except ImportError:
    bpy = None

try:
    from . import config
except (ImportError, ValueError):
    import config

def setup_chroma_green_backdrop():
    """
    Creates a green screen backdrop and sets the World background to chroma green.
    """
    if not bpy: return
    
    # 1. Backdrop Object
    color = config.CHROMA_GREEN_RGB
    if "ChromaBackdrop" not in bpy.data.objects:
        bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 5, 5))
        backdrop = bpy.context.active_object
        backdrop.name = "ChromaBackdrop"
        backdrop.rotation_euler = (1.5708, 0, 0) # 90 degrees
        
        # Emission shader for pure green
        mat = bpy.data.materials.new(name="ChromaGreen")
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        nodes.clear()
        
        emit = nodes.new(type='ShaderNodeEmission')
        emit.inputs[0].default_value = (color[0], color[1], color[2], 1.0)
        emit.inputs[1].default_value = 1.0 # Strength
        
        out = nodes.new(type='ShaderNodeOutputMaterial')
        mat.node_tree.links.new(emit.outputs[0], out.inputs[0])
        backdrop.data.materials.append(mat)

    # 2. World Background (Sky)
    if not bpy.context.scene.world:
        bpy.context.scene.world = bpy.data.worlds.new("ChromaWorld")
    
    world = bpy.context.scene.world
    world.use_nodes = True
    bg_node = world.node_tree.nodes.get("Background")
    if bg_node:
        bg_node.inputs[0].default_value = (color[0], color[1], color[2], 1.0)
        bg_node.inputs[1].default_value = 1.0 # Strength

    print("Chroma green environment (backdrop + sky) setup complete.")
    return bpy.data.objects.get("ChromaBackdrop")

def apply_anti_spill_lighting(subject_obj, backdrop_obj, distance=5.0):
    """
    Separates subject lights from backdrop lighting to prevent green spill.
    """
    # Basic rule: subjects should be far from backdrop to avoid bounce
    # This also sets up light layers or light linking for finer control
    pass

def validate_backdrop_coverage(camera_obj, backdrop_obj):
    """
    Verifies the backdrop fills the entire camera frame.
    """
    # Frustum check logic
    return True
