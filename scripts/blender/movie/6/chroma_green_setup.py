"""
Chroma Green Setup Module - Movie 6
Localized version matching reliable v5 behavior.
"""
import bpy
import os
import mathutils
import math
import json
import config

def setup_chroma_green_backdrop():
    """
    Creates a green screen backdrop and sets the World background.
    Matches v5 logic for high reliability.
    """
    if not bpy: return None

    # 1. Resolve Config
    # We try to find config.json in the same directory as this file
    config_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(config_dir, "config.json")

    # Fallback to absolute production path if localized fails
    if not os.path.exists(config_path):
        config_path = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/movie/6/config.json"

    bg_images = []
    try:
        if os.path.exists(config_path):
            with open(config_path, "r") as f:
                bg_images = json.load(f).get("background_images", [])
    except: pass

    # 2. Backdrop Geometry
    existing_wide = bpy.data.objects.get("chroma_backdrop_wide")
    if existing_wide:
        return existing_wide

    planes = []

    def _deg_rot(deg_tuple):
        return tuple(math.radians(d) for d in deg_tuple)

    # Back wall — perpendicular to Y axis, sitting on the +Y edge of the interior floor
    bpy.ops.mesh.primitive_plane_add(size=config.BACKDROP_SIZE, location=config.BACKDROP_WIDE_POS)
    bw = bpy.context.active_object
    bw.name = "chroma_backdrop_wide"
    bw.rotation_euler = _deg_rot(config.BACKDROP_WIDE_ROT)
    planes.append(bw)

    # Left wall — perpendicular to X axis, sitting on the -X edge
    bpy.ops.mesh.primitive_plane_add(size=config.BACKDROP_SIZE, location=config.BACKDROP_OTS1_POS)
    bo1 = bpy.context.active_object
    bo1.name = "chroma_backdrop_ots1"
    bo1.rotation_euler = _deg_rot(config.BACKDROP_OTS1_ROT)
    planes.append(bo1)

    # Right wall — perpendicular to X axis, sitting on the +X edge
    bpy.ops.mesh.primitive_plane_add(size=config.BACKDROP_SIZE, location=config.BACKDROP_OTS2_POS)
    bo2 = bpy.context.active_object
    bo2.name = "chroma_backdrop_ots2"
    bo2.rotation_euler = _deg_rot(config.BACKDROP_OTS2_ROT)
    planes.append(bo2)


    # 3. Materials
    # Pure green color from v5
    green_rgb = (0, 1, 0, 1)

    for i, p in enumerate(planes):
        # Clear existing materials
        p.data.materials.clear()

        mat = bpy.data.materials.new(name=f"BackdropMaterial_{i}")
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        nodes.clear()

        # Translucent Shader (v6 extended)
        # Combine Emission with Transparency
        emit = nodes.new(type='ShaderNodeEmission')
        emit.inputs[1].default_value = 5.0
        
        transp = nodes.new(type='ShaderNodeBsdfTransparent')
        mix = nodes.new(type='ShaderNodeMixShader')
        # Factor is from config (0.8 opacity = 0.2 transparency factor if inverted, 
        # but let's treat BACKDROP_ALPHA as opacity)
        alpha = getattr(config, "BACKDROP_ALPHA", 0.8)
        mix.inputs[0].default_value = 1.0 - alpha
        
        if bg_images and len(bg_images) > i:
            img_path = bg_images[i]
            if os.path.exists(img_path):
                tex_img = nodes.new(type='ShaderNodeTexImage')
                try:
                    loaded_img = bpy.data.images.load(filepath=img_path)
                    tex_img.image = loaded_img
                    tex_coord = nodes.new(type='ShaderNodeTexCoord')
                    mat.node_tree.links.new(tex_coord.outputs['Window'], tex_img.inputs['Vector'])
                    mat.node_tree.links.new(tex_img.outputs['Color'], emit.inputs[0])
                except:
                    emit.inputs[0].default_value = green_rgb
            else:
                emit.inputs[0].default_value = green_rgb
        else:
            emit.inputs[0].default_value = green_rgb

        out = nodes.new(type='ShaderNodeOutputMaterial')
        mat.node_tree.links.new(transp.outputs[0], mix.inputs[1])
        mat.node_tree.links.new(emit.outputs[0], mix.inputs[2])
        mat.node_tree.links.new(mix.outputs[0], out.inputs[0])
        
        p.data.materials.append(mat)
        
        # Transparency Settings for EEVEE/Viewport
        mat.blend_method = 'BLEND'
        if hasattr(mat, 'shadow_method'):
            mat.shadow_method = 'NONE'
        mat.diffuse_color = (*green_rgb[:3], alpha)


    # 4. World Setup
    if not bpy.context.scene.world:
        bpy.context.scene.world = bpy.data.worlds.new("ChromaWorld")

    world = bpy.context.scene.world
    world.use_nodes = True
    world.node_tree.nodes.clear()
    w_nodes = world.node_tree.nodes

    lp = w_nodes.new(type='ShaderNodeLightPath')
    mix = w_nodes.new(type='ShaderNodeMixShader')

    bg_dark = w_nodes.new(type='ShaderNodeBackground')
    bg_dark.inputs[0].default_value = (0.01, 0.01, 0.01, 1.0)

    bg_neutral = w_nodes.new(type='ShaderNodeBackground')
    bg_neutral.inputs[0].default_value = (0.05, 0.05, 0.05, 1.0)

    w_out = w_nodes.new(type='ShaderNodeOutputWorld')

    # Is Camera Ray factor selects bg_dark for background, bg_neutral for lighting
    world.node_tree.links.new(lp.outputs['Is Camera Ray'], mix.inputs[0])
    world.node_tree.links.new(bg_neutral.outputs[0], mix.inputs[1])
    world.node_tree.links.new(bg_dark.outputs[0], mix.inputs[2])
    world.node_tree.links.new(mix.outputs[0], w_out.inputs[0])

    print("Background setup complete.")
    return planes[0] if planes else None
