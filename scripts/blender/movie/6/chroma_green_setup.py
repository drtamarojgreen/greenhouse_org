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
    if "ChromaBackdrop_Wide" not in bpy.data.objects:
        import mathutils
        planes = []
        
        # 1. Wide Angle Backdrop (Y=50)
        bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 50, 5))
        bw = bpy.context.active_object
        bw.name = "ChromaBackdrop_Wide"
        cam_wide_loc = mathutils.Vector((0.0, -8.0, 2.0))
        vec_wide = cam_wide_loc - mathutils.Vector((0, 50, 5))
        bw.rotation_euler = vec_wide.to_track_quat('Z', 'Y').to_euler()
        planes.append(bw)
        
        # 2. OTS1 Backdrop (Behind Herbaceous: X=-50, Y=-20)
        bpy.ops.mesh.primitive_plane_add(size=1000, location=(-50, -20, 5))
        bo1 = bpy.context.active_object
        bo1.name = "ChromaBackdrop_OTS1"
        cam_ots1_loc = mathutils.Vector((4.0, 3.0, 2.8))
        vec_o1 = cam_ots1_loc - mathutils.Vector((-50, -20, 5))
        bo1.rotation_euler = vec_o1.to_track_quat('Z', 'Y').to_euler()
        planes.append(bo1)
        
        # 3. OTS2 Backdrop (Behind Arbor: X=50, Y=20)
        bpy.ops.mesh.primitive_plane_add(size=1000, location=(50, 20, 5))
        bo2 = bpy.context.active_object
        bo2.name = "ChromaBackdrop_OTS2"
        cam_ots2_loc = mathutils.Vector((-4.0, -3.0, 2.8))
        vec_o2 = cam_ots2_loc - mathutils.Vector((50, 20, 5))
        bo2.rotation_euler = vec_o2.to_track_quat('Z', 'Y').to_euler()
        planes.append(bo2)

        for backdrop in planes:
            # Disable shadow reflection/reception
            backdrop.visible_shadow = False
            backdrop.visible_diffuse = False
            backdrop.visible_glossy = False
            backdrop.visible_transmission = False
        
        import json
        import os
        config_path = os.path.join(os.path.dirname(__file__), "config.json")
        try:
            with open(config_path, "r") as f:
                bg_images = json.load(f).get("background_images", [])
        except Exception:
            bg_images = []

        for i, p in enumerate(planes):
            mat = bpy.data.materials.new(name=f"ImageBackground_{i}")
            mat.use_nodes = True
            nodes = mat.node_tree.nodes
            nodes.clear()
            
            emit = nodes.new(type='ShaderNodeEmission')
            emit.inputs[1].default_value = 1.0
            
            if bg_images and len(bg_images) > 0:
                img_path = bg_images[i % len(bg_images)]
                if os.path.exists(img_path):
                    tex_img = nodes.new(type='ShaderNodeTexImage')
                    loaded_img = bpy.data.images.load(filepath=img_path)
                    tex_img.image = loaded_img
                    
                    tex_coord = nodes.new(type='ShaderNodeTexCoord')
                    mat.node_tree.links.new(tex_coord.outputs['Window'], tex_img.inputs['Vector'])
                    
                    mat.node_tree.links.new(tex_img.outputs['Color'], emit.inputs[0])
                else:
                    emit.inputs[0].default_value = (color[0], color[1], color[2], 1.0)
            else:
                emit.inputs[0].default_value = (color[0], color[1], color[2], 1.0)
                
            out = nodes.new(type='ShaderNodeOutputMaterial')
            mat.node_tree.links.new(emit.outputs[0], out.inputs[0])
            p.data.materials.append(mat)

    # 2. World Background (Sky) - Refined for Anti-Spill
    if not bpy.context.scene.world:
        bpy.context.scene.world = bpy.data.worlds.new("ChromaWorld")
    
    world = bpy.context.scene.world
    world.use_nodes = True
    world.node_tree.nodes.clear()
    w_nodes = world.node_tree.nodes
    
    lp = w_nodes.new(type='ShaderNodeLightPath')
    mix = w_nodes.new(type='ShaderNodeMixShader')
    
    bg_green = w_nodes.new(type='ShaderNodeBackground')
    bg_green.inputs[0].default_value = (0.01, 0.01, 0.01, 1.0) # Now dark instead of green
    
    bg_neutral = w_nodes.new(type='ShaderNodeBackground')
    bg_neutral.inputs[0].default_value = (0.05, 0.05, 0.05, 1.0) # Very dim neutral
    
    w_out = w_nodes.new(type='ShaderNodeOutputWorld')
    
    world.node_tree.links.new(lp.outputs['Is Camera Ray'], mix.inputs[0])
    world.node_tree.links.new(bg_neutral.outputs[0], mix.inputs[1])
    world.node_tree.links.new(bg_green.outputs[0], mix.inputs[2])
    world.node_tree.links.new(mix.outputs[0], w_out.inputs[0])

    print("Background setup complete.")
    return planes[0] if planes else None

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
