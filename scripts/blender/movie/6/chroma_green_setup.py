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
    config_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(config_dir, "config.json")

    if not os.path.exists(config_path):
        config_path = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/movie/6/config.json"

    bg_images = []
    try:
        if os.path.exists(config_path):
            with open(config_path, "r") as f:
                bg_images = json.load(f).get("background_images", [])
    except: pass

    # 2. Backdrop Geometry
    existing_wide = bpy.data.objects.get("ChromaBackdrop_Wide")
    if existing_wide:
        return existing_wide

    planes = []
    # Wide Angle Backdrop
    bpy.ops.mesh.primitive_plane_add(size=config.BACKDROP_WIDE_SIZE, location=config.BACKDROP_WIDE_POS)
    bw = bpy.context.active_object
    bw.name = "ChromaBackdrop_Wide"
    cam_wide_loc = mathutils.Vector(config.WIDE_CAM_POS)
    vec_wide = cam_wide_loc - mathutils.Vector(config.BACKDROP_WIDE_POS)
    bw.rotation_euler = vec_wide.to_track_quat('Z', 'Y').to_euler()
    planes.append(bw)

    # OTS1 Backdrop
    bpy.ops.mesh.primitive_plane_add(size=config.BACKDROP_OTS_SIZE, location=config.BACKDROP_OTS1_POS)
    bo1 = bpy.context.active_object
    bo1.name = "ChromaBackdrop_OTS1"
    cam_ots1_loc = mathutils.Vector(config.OTS1_CAM_POS)
    vec_o1 = cam_ots1_loc - mathutils.Vector(config.BACKDROP_OTS1_POS)
    bo1.rotation_euler = vec_o1.to_track_quat('Z', 'Y').to_euler()
    planes.append(bo1)

    # OTS2 Backdrop
    bpy.ops.mesh.primitive_plane_add(size=config.BACKDROP_OTS_SIZE, location=config.BACKDROP_OTS2_POS)
    bo2 = bpy.context.active_object
    bo2.name = "ChromaBackdrop_OTS2"
    cam_ots2_loc = mathutils.Vector(config.OTS2_CAM_POS)
    vec_o2 = cam_ots2_loc - mathutils.Vector(config.BACKDROP_OTS2_POS)
    bo2.rotation_euler = vec_o2.to_track_quat('Z', 'Y').to_euler()
    planes.append(bo2)

    # 3. Materials
    green_rgb = config.CHROMA_GREEN_RGB

    for i, p in enumerate(planes):
        p.data.materials.clear()
        mat = bpy.data.materials.new(name=f"BackdropMaterial_{i}")
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        nodes.clear()

        emit = nodes.new(type='ShaderNodeEmission')
        emit.inputs[1].default_value = 5.0

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
        mat.node_tree.links.new(emit.outputs[0], out.inputs[0])
        p.data.materials.append(mat)
        mat.diffuse_color = green_rgb

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

    world.node_tree.links.new(lp.outputs['Is Camera Ray'], mix.inputs[0])
    world.node_tree.links.new(bg_neutral.outputs[0], mix.inputs[1])
    world.node_tree.links.new(bg_dark.outputs[0], mix.inputs[2])
    world.node_tree.links.new(mix.outputs[0], w_out.inputs[0])

    print("Background setup complete.")
    return planes[0] if planes else None
