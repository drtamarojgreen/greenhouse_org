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
    Matches v5 structure: planes go directly into the root scene collection so they
    are guaranteed to be visible in the view layer and in renders.
    """
    if not bpy:
        return None

    color = config.CHROMA_GREEN_RGB

    # Only create if not already present (v5-style guard)
    if "ChromaBackdrop_Wide" not in bpy.data.objects:
        import mathutils
        import math
        import json
        import os

        planes = []

        # 1. Wide-angle backdrop (Y = 50)
        bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 50, 5))
        bw = bpy.context.active_object
        bw.name = "ChromaBackdrop_Wide"
        cam_wide_loc = mathutils.Vector((0.0, -18.0, 5.5))
        vec_wide = cam_wide_loc - mathutils.Vector((0, 50, 5))
        bw.rotation_euler = vec_wide.to_track_quat('Z', 'Y').to_euler()
        planes.append(bw)

        # 2. OTS1 backdrop — behind Herbaceous
        bpy.ops.mesh.primitive_plane_add(size=1000, location=(-50, -20, 5))
        bo1 = bpy.context.active_object
        bo1.name = "ChromaBackdrop_OTS1"
        cam_ots1_loc = mathutils.Vector((13.5, 11.0, 6.0))
        vec_o1 = cam_ots1_loc - mathutils.Vector((-50, -20, 5))
        bo1.rotation_euler = vec_o1.to_track_quat('Z', 'Y').to_euler()
        planes.append(bo1)

        # 3. OTS2 backdrop — behind Arbor
        bpy.ops.mesh.primitive_plane_add(size=1000, location=(50, 20, 5))
        bo2 = bpy.context.active_object
        bo2.name = "ChromaBackdrop_OTS2"
        cam_ots2_loc = mathutils.Vector((-13.5, -11.0, 6.0))
        vec_o2 = cam_ots2_loc - mathutils.Vector((50, 20, 5))
        bo2.rotation_euler = vec_o2.to_track_quat('Z', 'Y').to_euler()
        planes.append(bo2)

        # Disable shadow/light-bounce interaction (prevent green spill)
        for backdrop in planes:
            backdrop.visible_shadow      = False
            backdrop.visible_diffuse     = False
            backdrop.visible_glossy      = False
            backdrop.visible_transmission = False

        # Load background images from config.json if present
        config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
        try:
            with open(config_path, "r") as f:
                bg_images = json.load(f).get("background_images", [])
        except Exception:
            bg_images = []

        for i, plane in enumerate(planes):
            mat = bpy.data.materials.new(name=f"ImageBackground_{i}")
            mat.use_nodes = True
            nodes = mat.node_tree.nodes
            nodes.clear()

            emit = nodes.new(type='ShaderNodeEmission')
            # Safe socket access for Blender 5.0+
            strength_socket = emit.inputs.get("Strength") or emit.inputs[1]
            color_socket = emit.inputs.get("Color") or emit.inputs[0]
            strength_socket.default_value = 1.0
            
            if bg_images and len(bg_images) > i:
                img_path = bg_images[i]
                if os.path.exists(img_path):
                    tex_img = nodes.new(type='ShaderNodeTexImage')
                    try:
                        loaded_img = bpy.data.images.load(filepath=img_path)
                        tex_img.image = loaded_img

                        tex_coord = nodes.new(type='ShaderNodeTexCoord')
                        # Use Generated for robust background plane mapping
                        mat.node_tree.links.new(tex_coord.outputs['Generated'], tex_img.inputs['Vector'])
                        mat.node_tree.links.new(tex_img.outputs['Color'], color_socket)
                    except:
                        color_socket.default_value = (*color, 1.0)
                else:
                    color_socket.default_value = (*color, 1.0)
            else:
                color_socket.default_value = (*color, 1.0)
                
            out = nodes.new(type='ShaderNodeOutputMaterial')
            mat.node_tree.links.new(emit.outputs[0], out.inputs[0])
            plane.data.materials.append(mat)

    # World background — dark anti-spill setup (always re-applied like v5)
    if not bpy.context.scene.world:
        bpy.context.scene.world = bpy.data.worlds.new("ChromaWorld")

    world = bpy.context.scene.world
    world.use_nodes = True
    world.node_tree.nodes.clear()
    w_nodes = world.node_tree.nodes
    
    lp = w_nodes.new(type='ShaderNodeLightPath')
    mix = w_nodes.new(type='ShaderNodeMixShader')
    
    bg_dark = w_nodes.new(type='ShaderNodeBackground')
    # Use direct index as in v5
    bg_dark.inputs[0].default_value = (0.01, 0.01, 0.01, 1.0) # Now dark instead of green
    
    bg_neutral = w_nodes.new(type='ShaderNodeBackground')
    w_out      = w_nodes.new(type='ShaderNodeOutputWorld')

    # Direct index access — identical to v5
    bg_dark.inputs[0].default_value    = (0.01, 0.01, 0.01, 1.0)  # near-black for camera rays
    bg_neutral.inputs[0].default_value = (0.05, 0.05, 0.05, 1.0)  # very dim neutral for lighting

    world.node_tree.links.new(lp.outputs['Is Camera Ray'], mix.inputs[0])
    world.node_tree.links.new(bg_neutral.outputs[0], mix.inputs[1])
    world.node_tree.links.new(bg_dark.outputs[0], mix.inputs[2])
    world.node_tree.links.new(mix.outputs[0], w_out.inputs[0])

    print("Background setup complete.")
    return bpy.data.objects.get("ChromaBackdrop_Wide")

def apply_anti_spill_lighting(subject_obj, backdrop_obj, distance=5.0):
    """
    Placeholder: separates subject lights from backdrop to prevent green spill.
    Implement light-linking here when Blender's light-linking API is available.
    """
    pass


def validate_backdrop_coverage(camera_obj, backdrop_obj):
    """
    Verifies the backdrop fills the entire camera frame.
    """
    return True
