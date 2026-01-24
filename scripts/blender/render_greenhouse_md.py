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
    scene.frame_end = 120
    scene.render.fps = 24
    scene.render.engine = 'CYCLES'
    
    # Cycles Noise Reduction Settings
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 32
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.1
    scene.cycles.use_denoising = False
    
    # Advanced Noise Clamping
    scene.cycles.blur_glossy = 1.0
    scene.cycles.sample_clamp_indirect = 1.0
    scene.cycles.caustics_reflective = False
    scene.cycles.caustics_refractive = False
    scene.cycles.max_bounces = 4
    
    for rl in scene.view_layers:
        if hasattr(rl, "cycles"):
            rl.cycles.use_denoising = False
    
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540

    # Dark environment for better reflections
    scene.world.use_nodes = True
    bg_node = scene.world.node_tree.nodes.get("Background")
    if bg_node:
        bg_node.inputs[0].default_value = (0.002, 0.002, 0.002, 1)

    return scene

def create_logo_background(logo_path):
    if not os.path.exists(logo_path):
        print(f"Warning: Logo not found at {logo_path}")
        return None

    # Create plane for logo at the back (Y=5)
    bpy.ops.mesh.primitive_plane_add(size=25, location=(0, 5, 0), rotation=(math.radians(90), 0, 0))
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

def create_text(content, location=(0, 0, 0)):
    bpy.ops.object.text_add(location=location, rotation=(math.radians(90), 0, 0))
    text_obj = bpy.context.object
    text_obj.data.body = content
    text_obj.data.align_x = 'CENTER'
    text_obj.data.align_y = 'CENTER'
    text_obj.data.extrude = 0.1
    text_obj.data.bevel_depth = 0.02

    # High reflectivity material
    mat = bpy.data.materials.new(name="TextMaterial")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.05, 0.4, 0.1, 1)
    bsdf.inputs["Roughness"].default_value = 0.15
    bsdf.inputs["Metallic"].default_value = 1.0
    text_obj.data.materials.append(mat)

    return text_obj

def create_crossing_spotlights(scene, target_obj):
    # Positioned behind the camera (Camera at Y=-25, Spots at Y=-45)
    for i, start_loc in enumerate([(-15, -45, -8), (15, -45, -8)]):
        end_loc = (15, -45, 8) if i == 0 else (-15, -45, 8)
        bpy.ops.object.light_add(type='SPOT', location=start_loc)
        spot = bpy.context.object
        spot.name = f"CrossingSpot_{i}"
        spot.data.energy = 150000
        spot.data.spot_size = math.radians(25)
        spot.data.shadow_soft_size = 1.5
        
        spot.keyframe_insert(data_path="location", frame=1)
        spot.location = end_loc
        spot.keyframe_insert(data_path="location", frame=120)
        
        track = spot.constraints.new(type='TRACK_TO')
        track.target = target_obj
        track.track_axis = 'TRACK_NEGATIVE_Z'
        track.up_axis = 'UP_Y'

def main():
    parser = argparse.ArgumentParser(description="Render GreenhouseMD text with Crossing Spotlights")
    parser.add_argument("--output", default="//greenhouse_md_final.png", help="Output path")
    parser.add_argument("--output-video", help="Output video path")
    parser.add_argument("--logo", default="docs/images/Greenhouse_Logo.png", help="Path to logo image")

    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []
    args = parser.parse_args(argv)

    scene = setup_scene()

    base_dir = os.getcwd()
    logo_path = os.path.join(base_dir, args.logo)

    create_logo_background(logo_path)
    create_text("GreenhouseMD")

    # Target Axis
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
    target_axis = bpy.context.object
    create_crossing_spotlights(scene, target_axis)

    # Camera - positioned back to frame logo (Y=-25)
    bpy.ops.object.camera_add(location=(0, -25, 0), rotation=(math.radians(90), 0, 0))
    scene.camera = bpy.context.object
    scene.camera.data.lens = 35 # Balance FOV

    # Lighting - minimal base lighting
    bpy.ops.object.light_add(type='SUN', location=(0, -5, 10), rotation=(math.radians(45), 0, 0))
    bpy.context.object.data.energy = 0.05

    if args.output_video:
        output_dir = os.path.dirname(args.output_video)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
        scene.render.filepath = args.output_video
        scene.render.image_settings.file_format = 'FFMPEG'
        scene.render.ffmpeg.format = 'MPEG4'
        scene.render.ffmpeg.codec = 'H264'
        print(f"Rendering framed video to {args.output_video}...")
        bpy.ops.render.render(animation=True)
    else:
        scene.render.filepath = args.output
        print(f"Rendering to {args.output}...")
        bpy.ops.render.render(write_still=True)

if __name__ == "__main__":
    main()
