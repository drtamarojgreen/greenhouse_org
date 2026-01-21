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
    scene.frame_end = 24
    scene.render.fps = 2
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

def create_moving_spotlights(scene, target_obj):
    # Create paths for spotlights
    bpy.ops.curve.primitive_bezier_circle_add(radius=8, location=(5, -5, 5), rotation=(math.radians(60), 0, 0))
    path1 = bpy.context.object
    
    bpy.ops.curve.primitive_bezier_circle_add(radius=8, location=(-5, -5, 5), rotation=(math.radians(60), 0, 0))
    path2 = bpy.context.object
    
    for path in [path1, path2]:
        bpy.ops.object.light_add(type='SPOT', location=(0, 0, 0))
        spot = bpy.context.object
        spot.data.energy = 2000
        spot.data.spot_size = math.radians(35)
        spot.data.spot_blend = 0.5
        
        follow = spot.constraints.new(type='FOLLOW_PATH')
        follow.target = path
        follow.offset_factor = 0.0
        follow.keyframe_insert(data_path="offset_factor", frame=scene.frame_start)
        follow.offset_factor = 1.0
        follow.keyframe_insert(data_path="offset_factor", frame=scene.frame_end)
        
        track = spot.constraints.new(type='TRACK_TO')
        track.target = target_obj
        track.track_axis = 'TRACK_NEGATIVE_Z'
        track.up_axis = 'UP_Y'

def main():
    parser = argparse.ArgumentParser(description="Render GreenhouseMD text on logo background")
    parser.add_argument("--output", default="//greenhouse_md.png", help="Output path")
    parser.add_argument("--output-video", help="Output video path")
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

    # Create axis at midpoint for spotlights to focus on
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0.5))
    midpoint_axis = bpy.context.object
    create_moving_spotlights(scene, midpoint_axis)

    # Camera
    bpy.ops.object.camera_add(location=(0, -16, 0), rotation=(math.radians(90), 0, 0))
    scene.camera = bpy.context.object

    # Lighting
    bpy.ops.object.light_add(type='SUN', location=(0, -5, 5), rotation=(math.radians(45), 0, 0))
    bpy.ops.object.light_add(type='AREA', location=(0, -2, 2))

    if args.output_video:
        output_dir = os.path.dirname(args.output_video)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
        scene.render.filepath = args.output_video
        scene.render.image_settings.file_format = 'FFMPEG'
        scene.render.ffmpeg.format = 'MPEG4'
        scene.render.ffmpeg.codec = 'H264'
        print(f"Rendering video to {args.output_video}...")
        bpy.ops.render.render(animation=True)
    else:
        scene.render.filepath = args.output
        print(f"Rendering to {args.output}...")
        bpy.ops.render.render(write_still=True)

if __name__ == "__main__":
    main()
