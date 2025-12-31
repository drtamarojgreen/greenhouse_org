
import bpy
import os
import math

def create_and_render_animation(svg_path, output_path):
    """
    Creates and renders a 3D animation from an SVG file.
    """
    if not os.path.exists(svg_path):
        print(f"Error: Input SVG file not found at {svg_path}")
        return

    # --- Scene Setup ---
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    # --- SVG Import and Conversion ---
    bpy.ops.import_curve.svg(filepath=svg_path)
    bpy.ops.object.select_all(action='SELECT')
    bpy.context.view_layer.objects.active = bpy.context.selected_objects[0]
    bpy.ops.object.join()
    logo_obj = bpy.context.active_object
    logo_obj.name = "Logo_3D"
    bpy.ops.object.convert(target='MESH')

    # --- 3D Geometry and Material ---
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.extrude_region_move(TRANSFORM_OT_translate={"value": (0, 0, 0.1)})
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    logo_obj.location = (0, 0, 0)
    mat = bpy.data.materials.new(name="Logo_Material_3D")
    mat.diffuse_color = (0.2, 0.8, 1.0, 1.0)
    logo_obj.data.materials.append(mat)

    # --- Animation ---
    frames = 10 # Short animation for quick rendering
    bpy.context.scene.frame_end = frames
    for f in range(1, frames + 1):
        logo_obj.rotation_euler.z = (f / frames) * 2 * math.pi
        logo_obj.keyframe_insert(data_path="rotation_euler", index=2, frame=f)

    # --- Scene Lighting and Camera ---
    bpy.ops.object.light_add(type='SUN', location=(5, 5, 5))
    bpy.ops.object.camera_add(location=(0, -10, 3))
    camera = bpy.context.active_object
    bpy.context.scene.camera = camera
    look_at = logo_obj.location
    direction = look_at - camera.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    camera.rotation_euler = rot_quat.to_euler()

    # --- Render Settings ---
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

    # --- Render ---
    print("Starting animation render...")
    bpy.ops.render.render(animation=True)
    print("Render complete.")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.join(script_dir, "..", "..")
    svg_file = os.path.join(base_dir, "docs", "images", "Greenhouse_Logo.svg")
    output_video = os.path.join(base_dir, "renders", "logo_animation.mkv")

    # Ensure the output directory exists
    os.makedirs(os.path.dirname(output_video), exist_ok=True)

    create_and_render_animation(svg_file, output_video)
