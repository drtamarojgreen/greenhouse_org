
import bpy
import os
import math
import sys
import argparse

def _create_and_render_animation(svg_path, output_path):
    """
    Private worker function to create and render the animation.
    Returns a tuple (success, message).
    """
    try:
        if not os.path.exists(svg_path):
            return (False, f"Error: Input SVG file not found at {svg_path}")

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
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        bsdf.inputs["Base Color"].default_value = (0.2, 0.8, 1.0, 1.0)
        logo_obj.data.materials.append(mat)

        # --- 4. Animation ---
        frames = 10
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
        scene.render.engine = 'CYCLES'
        scene.cycles.samples = 128
        scene.render.filepath = output_path
        scene.render.image_settings.file_format = 'FFMPEG'
        scene.render.ffmpeg.format = 'MPEG4'
        scene.render.ffmpeg.codec = 'H264'
        scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
        scene.render.resolution_x = 480
        scene.render.resolution_y = 360

        # --- 7. Render ---
        print("Starting animation render...")
        bpy.ops.render.render(animation=True)
        print("Render complete.")
        
        return (True, f"Successfully rendered animation to {output_path}")

    except Exception as e:
        return (False, f"An error occurred: {e}")

def render_logo(svg_path, output_path):
    """
    Public function to render the logo animation.
    """
    success, message = _create_and_render_animation(svg_path, output_path)
    if success:
        print(f"Render successful: {message}")
    else:
        print(f"Render failed: {message}")
        # Exit with a non-zero status code to indicate failure
        # This is important for automated scripts to detect failure
        bpy.ops.wm.quit_blender()


if __name__ == "__main__":
    # Get arguments after '--'
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []

    # Set up argument parser
    parser = argparse.ArgumentParser(description="Render a 3D logo animation from an SVG file.")
    parser.add_argument("--input-svg", required=True, help="Path to the input SVG file.")
    parser.add_argument("--output-mp4", required=True, help="Path for the output MP4 file.")

    args = parser.parse_args(argv)

    # Ensure the output directory exists
    output_dir = os.path.dirname(args.output_mp4)
    os.makedirs(output_dir, exist_ok=True)

    render_logo(args.input_svg, args.output_mp4)
