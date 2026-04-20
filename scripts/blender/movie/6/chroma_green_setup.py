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
    # Wide Angle Backdrop
    bpy.ops.mesh.primitive_plane_add(size=200, location=config.BACKDROP_WIDE_POS)
    bw = bpy.context.active_object
    bw.name = "chroma_backdrop_wide"
    # Match tracking reference
    vec_wide = mathutils.Vector(config.CAM_WIDE_TRACK_REF) - mathutils.Vector(config.BACKDROP_WIDE_POS)
    bw.rotation_euler = vec_wide.to_track_quat('Z', 'Y').to_euler()
    planes.append(bw)

    # OTS1 Backdrop
    bpy.ops.mesh.primitive_plane_add(size=200, location=config.BACKDROP_OTS1_POS)
    bo1 = bpy.context.active_object
    bo1.name = "chroma_backdrop_ots1"
    vec_o1 = mathutils.Vector(config.CAM_OTS1_TRACK_REF) - mathutils.Vector(config.BACKDROP_OTS1_POS)
    bo1.rotation_euler = vec_o1.to_track_quat('Z', 'Y').to_euler()
    planes.append(bo1)

    # OTS2 Backdrop
    bpy.ops.mesh.primitive_plane_add(size=200, location=config.BACKDROP_OTS2_POS)
    bo2 = bpy.context.active_object
    bo2.name = "chroma_backdrop_ots2"
    vec_o2 = mathutils.Vector(config.CAM_OTS2_TRACK_REF) - mathutils.Vector(config.BACKDROP_OTS2_POS)
    bo2.rotation_euler = vec_o2.to_track_quat('Z', 'Y').to_euler()
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

        # Emission shader is best for backdrops to avoid lighting artifacts
        emit = nodes.new(type='ShaderNodeEmission')
        # Strength 5.0 for better visibility in renders
        emit.inputs[1].default_value = 5.0

        if bg_images and len(bg_images) > i:
            img_path = bg_images[i]
            if os.path.exists(img_path):
                tex_img = nodes.new(type='ShaderNodeTexImage')
                try:
                    loaded_img = bpy.data.images.load(filepath=img_path)
                    tex_img.image = loaded_img

                    # Window coordinates match v5's perfect display
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

        # Set viewport color for easier debugging
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

    # Is Camera Ray factor selects bg_dark for background, bg_neutral for lighting
    world.node_tree.links.new(lp.outputs['Is Camera Ray'], mix.inputs[0])
    world.node_tree.links.new(bg_neutral.outputs[0], mix.inputs[1])
    world.node_tree.links.new(bg_dark.outputs[0], mix.inputs[2])
    world.node_tree.links.new(mix.outputs[0], w_out.inputs[0])

    print("Background setup complete.")
    return planes[0] if planes else None
