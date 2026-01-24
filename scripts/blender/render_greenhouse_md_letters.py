import bpy
import math
import os
import sys
import argparse
import random

def setup_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 96
    scene.render.fps = 24
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 512
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.005
    scene.cycles.use_denoising = False
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.world.use_nodes = True
    bg_node = scene.world.node_tree.nodes.get("Background")
    if bg_node: bg_node.inputs[0].default_value = (0.001, 0.001, 0.001, 1)
    return scene

def create_logo_background(logo_path):
    if not os.path.exists(logo_path): return None
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 20, 0), rotation=(math.pi / 2, 0, math.pi))
    bg_plane = bpy.context.object
    mat = bpy.data.materials.new(name="LogoMaterial")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    node_tex = mat.node_tree.nodes.new(type='ShaderNodeTexImage')
    try:
        node_tex.image = bpy.data.images.load(logo_path)
        mat.node_tree.links.new(node_tex.outputs['Color'], bsdf.inputs['Base Color'])
    except: pass
    bg_plane.data.materials.append(mat)
    return bg_plane

def create_spinning_letters(text_content):
    mat = bpy.data.materials.new(name="LetterMaterial")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.05, 0.4, 0.1, 1)
    bsdf.inputs["Roughness"].default_value = 0.1
    bsdf.inputs["Metallic"].default_value = 1.0
    char_spacing = 0.85
    start_x = -((len(text_content) - 1) * char_spacing) / 2
    for i, char in enumerate(text_content):
        bpy.ops.object.text_add(location=(start_x + i * char_spacing, 0, 0))
        text_obj = bpy.context.object
        text_obj.data.body = char
        text_obj.data.extrude = 0.1
        text_obj.data.bevel_depth = 0.02
        text_obj.data.align_x = 'CENTER'
        text_obj.data.align_y = 'CENTER'
        text_obj.data.materials.append(mat)
        text_obj.rotation_euler[0] = math.radians(90)
        rot_axis = 2
        num_rotations = random.uniform(2, 5)
        total_angle = math.radians(360 * num_rotations)
        text_obj.keyframe_insert(data_path="rotation_euler", index=rot_axis, frame=1)
        text_obj.rotation_euler[rot_axis] += total_angle
        text_obj.keyframe_insert(data_path="rotation_euler", index=rot_axis, frame=80)
        if text_obj.animation_data and text_obj.animation_data.action:
            for fcurve in text_obj.animation_data.action.fcurves:
                if fcurve.data_path == "rotation_euler" and fcurve.array_index == rot_axis:
                    for kp in fcurve.keyframe_points:
                        kp.interpolation = 'ELASTIC'
                        kp.easing = 'EASE_OUT'

def create_crossing_spotlights(target_obj):
    for i, start_x in enumerate([-15, 15]):
        bpy.ops.object.light_add(type='SPOT', location=(start_x, -35, 10))
        spot = bpy.context.object
        spot.data.energy = 300000
        spot.data.spot_size = math.radians(30)
        spot.data.shadow_soft_size = 1.5
        track = spot.constraints.new(type='TRACK_TO')
        track.target = target_obj
        track.track_axis = 'TRACK_NEGATIVE_Z'
        track.up_axis = 'UP_Y'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-video")
    parser.add_argument("--logo", default="docs/images/Greenhouse_Logo.png")
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    args = parser.parse_args(argv)
    scene = setup_scene()
    base_dir = os.getcwd()
    create_logo_background(os.path.join(base_dir, args.logo))
    create_spinning_letters("GreenhouseMD")

    # Target Axis
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
    target = bpy.context.object
    target.name = "CenterTarget"

    create_crossing_spotlights(target)
    bpy.ops.object.camera_add(location=(0, -20, 0), rotation=(math.radians(90), 0, 0))
    scene.camera = bpy.context.object
    scene.camera.data.lens = 20 # Fit size 40 logo at distance 40
    if args.output_video:
        scene.render.filepath = args.output_video
        scene.render.image_settings.file_format = 'FFMPEG'
        scene.render.ffmpeg.format = 'MPEG4'
        scene.render.ffmpeg.codec = 'H264'
        bpy.ops.render.render(animation=True)

if __name__ == "__main__":
    main()
