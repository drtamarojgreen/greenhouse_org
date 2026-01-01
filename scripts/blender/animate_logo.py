
import bpy
import os
import math
import sys
import argparse

def create_and_render_png_animation(image_path, output_path):
    """
    Creates and renders a 3D animation from a PNG file.
    It imports the PNG as a plane and creates a simple spinning animation
    with a transparent background.
    """
    if not os.path.exists(image_path):
        print(f"Error: Input PNG file not found at {image_path}")
        bpy.ops.wm.quit_blender()
        return

    # --- 1. Scene Setup ---
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    # --- 2. PNG Import as Plane ---
    try:
        bpy.ops.preferences.addon_enable(module="io_import_images_as_planes")
    except Exception as e:
        print(f"Could not enable addon: {e}")

    bpy.ops.import_image.to_plane(files=[{"name": os.path.basename(image_path)}], directory=os.path.dirname(image_path))
    logo_obj = bpy.context.active_object
    logo_obj.name = "Animated_Logo"

    # --- 3. Material Setup for Transparency ---
    logo_obj.active_material.blend_method = 'BLEND'
    logo_obj.active_material.shadow_method = 'NONE'

    # --- 4. Animation ---
    frames = 60
    bpy.context.scene.frame_end = frames

    logo_obj.rotation_euler = (0, 0, 0)
    logo_obj.keyframe_insert(data_path="rotation_euler", frame=1)
    logo_obj.rotation_euler.z = 2 * math.pi
    logo_obj.keyframe_insert(data_path="rotation_euler", index=2, frame=frames)

    # --- 5. Scene Lighting and Camera ---
    bpy.ops.object.light_add(type='SUN', location=(5, -5, 5))
    bpy.context.active_object.data.energy = 5
    bpy.ops.object.camera_add(location=(0, -7, 2))
    camera = bpy.context.active_object
    bpy.context.scene.camera = camera

    direction = logo_obj.location - camera.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    camera.rotation_euler = rot_quat.to_euler()

    # --- 6. Render Settings for Transparency ---
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.film_transparent = True
    scene.render.filepath = output_path

    # Use FFmpeg with a codec that supports alpha (transparency)
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'QUICKTIME'
    scene.render.ffmpeg.codec = 'PNG' # PNG codec supports RGBA
    scene.render.image_settings.color_mode = 'RGBA' # Now this will work

    scene.render.resolution_x = 512
    scene.render.resolution_y = 512

    # --- 7. Render ---
    print(f"Starting PNG animation render from '{image_path}' to '{output_path}'")
    bpy.ops.render.render(animation=True)
    print("Render complete.")

if __name__ == "__main__":
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []

    parser = argparse.ArgumentParser(description="Render a 3D logo animation from a PNG.")
    parser.add_argument("--input-png", required=True, help="Path to the input PNG file.")
    parser.add_argument("--output-mov", required=True, help="Path for the output MOV file.")

    args = parser.parse_args(argv)

    output_dir = os.path.dirname(args.output_mov)
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    create_and_render_png_animation(args.input_png, args.output_mov)
