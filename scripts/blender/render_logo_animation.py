
import bpy
import os
import math

def create_and_render_animation(svg_path, output_path):
    """
    Creates and renders a 3D animation from an SVG file.
    It assumes the SVG file exists and will create the output directory if needed.
    """
    if not os.path.exists(svg_path):
        print(f"Error: Input SVG file not found at {svg_path}")
        print("Please ensure the SVG logo exists before running this script.")
        # Exit with a non-zero status code to indicate failure
        bpy.ops.wm.quit_blender()
        return

    # --- 1. Scene Setup ---
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    # --- 2. SVG Import and Conversion ---
    bpy.ops.import_curve.svg(filepath=svg_path)
    bpy.ops.object.select_all(action='SELECT')
    bpy.context.view_layer.objects.active = bpy.context.selected_objects[0]
    bpy.ops.object.join()
    logo_obj = bpy.context.active_object
    logo_obj.name = "Logo_3D"
    bpy.ops.object.convert(target='MESH')

    # --- 3. 3D Geometry and Material ---
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.extrude_region_move(TRANSFORM_OT_translate={"value": (0, 0, 0.1)})
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    logo_obj.location = (0, 0, 0)
    mat = bpy.data.materials.new(name="Logo_Material_3D")
    mat.diffuse_color = (0.2, 0.8, 1.0, 1.0) # A light blue color
    logo_obj.data.materials.append(mat)

    # --- 4. Animation ---
    frames = 10 # A short animation for quick test rendering
    bpy.context.scene.frame_end = frames
    for f in range(1, frames + 1):
        logo_obj.rotation_euler.z = (f / frames) * 2 * math.pi
        logo_obj.keyframe_insert(data_path="rotation_euler", index=2, frame=f)

    # --- 5. Scene Lighting and Camera ---
    bpy.ops.object.light_add(type='SUN', location=(5, 5, 5))
    bpy.ops.object.camera_add(location=(0, -10, 3))
    camera = bpy.context.active_object
    bpy.context.scene.camera = camera
    look_at = logo_obj.location
    direction = look_at - camera.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    camera.rotation_euler = rot_quat.to_euler()

    # --- 6. Render Settings ---
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.filepath = output_path
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'MKV'
    scene.render.ffmpeg.codec = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.eevee.taa_render_samples = 16 # Lower samples for faster rendering
    scene.render.resolution_x = 480
    scene.render.resolution_y = 360

    # --- 7. Render ---
    print("Starting animation render...")
    bpy.ops.render.render(animation=True)
    print("Render complete.")

import sys
import argparse

if __name__ == "__main__":
    # This script is designed to be executed with Blender's Python interpreter
    # Arguments for this script must be passed after a '--' separator

    # Get arguments after '--'
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []

    # Set up argument parser
    parser = argparse.ArgumentParser(description="Render a 3D logo animation from an SVG file.")
    parser.add_argument("--input-svg", required=True, help="Path to the input SVG file.")
    parser.add_argument("--output-mkv", required=True, help="Path for the output MKV file.")

    args = parser.parse_args(argv)

    # Ensure the output directory exists
    output_dir = os.path.dirname(args.output_mkv)
    os.makedirs(output_dir, exist_ok=True)

    create_and_render_animation(args.input_svg, args.output_mkv)
