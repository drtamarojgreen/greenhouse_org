import bpy
import math
import os
import sys
import argparse

def setup_scene():
    # Scene Reset
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 1
    scene.render.fps = 30
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 128
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080

    return scene

def create_logo_background(logo_path):
    if not os.path.exists(logo_path):
        print(f"Warning: Logo not found at {logo_path}")
        return None

    # Create plane for logo
    bpy.ops.mesh.primitive_plane_add(size=10, location=(0, 2, 0), rotation=(math.radians(90), 0, 0))
    bg_plane = bpy.context.object
    bg_plane.name = "LogoBackground"

    mat = bpy.data.materials.new(name="LogoMaterial")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    # Clear nodes
    for n in nodes:
        nodes.remove(n)

    node_output = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    node_tex = nodes.new(type='ShaderNodeTexImage')

    try:
        img = bpy.data.images.load(logo_path)
        node_tex.image = img
    except Exception as e:
        print(f"Error loading image: {e}")

    links.new(node_tex.outputs['Color'], node_bsdf.inputs['Base Color'])
    links.new(node_tex.outputs['Alpha'], node_bsdf.inputs['Alpha'])
    links.new(node_bsdf.outputs['BSDF'], node_output.inputs['Surface'])

    mat.blend_method = 'BLEND'
    bg_plane.data.materials.append(mat)

    return bg_plane

def create_text(content, location=(0, 0, 0.5)):
    bpy.ops.object.text_add(location=location, rotation=(math.radians(90), 0, 0))
    text_obj = bpy.context.object
    text_obj.data.body = content
    text_obj.data.align_x = 'CENTER'
    text_obj.data.align_y = 'CENTER'
    text_obj.data.extrude = 0.1
    text_obj.data.bevel_depth = 0.02

    # Dark Green Material
    mat = bpy.data.materials.new(name="TextMaterial")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.05, 0.2, 0.05, 1)
    text_obj.data.materials.append(mat)

    return text_obj

def main():
    parser = argparse.ArgumentParser(description="Render GreenhouseMD text on logo background")
    parser.add_argument("--output", default="//greenhouse_md.png", help="Output path")
    parser.add_argument("--logo", default="docs/images/Greenhouse_Logo.png", help="Path to logo image")

    # Handle blender arguments
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []
    args = parser.parse_args(argv)

    scene = setup_scene()

    # Adjust paths relative to script or absolute
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    logo_path = os.path.join(base_dir, args.logo)

    create_logo_background(logo_path)
    create_text("GreenhouseMD")

    # Camera
    bpy.ops.object.camera_add(location=(0, -8, 0), rotation=(math.radians(90), 0, 0))
    scene.camera = bpy.context.object

    # Lighting
    bpy.ops.object.light_add(type='SUN', location=(0, -5, 5), rotation=(math.radians(45), 0, 0))
    bpy.ops.object.light_add(type='AREA', location=(0, -2, 2))

    scene.render.filepath = args.output
    print(f"Rendering to {args.output}...")
    bpy.ops.render.render(write_still=True)

if __name__ == "__main__":
    main()
