import bpy
import os
import sys
import math
import argparse

def create_logo_test_animation(output_path, frame_count=5):
    """
    Creates and renders a short test animation with the Greenhouse logo
    on a plane and a camera moving on a path.
    """
    try:
        # --- 1. Scene Setup ---
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete(use_global=False)
        scene = bpy.context.scene

        # --- 2. Render Settings ---
        scene.render.engine = 'CYCLES'
        scene.cycles.samples = 128
        scene.render.resolution_x = 1280
        scene.render.resolution_y = 720
        scene.frame_start = 1
        scene.frame_end = frame_count
        scene.render.filepath = output_path
        scene.render.image_settings.file_format = 'FFMPEG'
        scene.render.ffmpeg.format = 'MPEG4'
        scene.render.ffmpeg.codec = 'H264'

        # --- 3. Add Background Plane with Logo ---
        bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, 0), rotation=(math.radians(90), 0, 0))
        plane = bpy.context.active_object
        plane.name = "LogoPlane"

        mat = bpy.data.materials.new(name="LogoMaterial")
        plane.data.materials.append(mat)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links
        nodes.clear()

        output = nodes.new(type='ShaderNodeOutputMaterial')
        emission = nodes.new(type='ShaderNodeEmission')
        tex_image = nodes.new(type='ShaderNodeTexImage')
        
        script_dir = os.path.dirname(os.path.abspath(__file__))
        logo_path = os.path.join(script_dir, "..", "..", "docs", "images", "Greenhouse_Logo.png")
        if os.path.exists(logo_path):
            tex_image.image = bpy.data.images.load(logo_path)

        links.new(tex_image.outputs['Color'], emission.inputs['Color'])
        links.new(emission.outputs['Emission'], output.inputs['Surface'])

        # UV unwrap the plane
        bpy.context.view_layer.objects.active = plane
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.unwrap()
        bpy.ops.object.mode_set(mode='OBJECT')

        # --- 4. Camera on a Path ---
        bpy.ops.curve.primitive_bezier_circle_add(radius=15, location=(0, 0, 5))
        path = bpy.context.active_object

        bpy.ops.object.camera_add(location=(15, 0, 5))
        camera = bpy.context.active_object
        scene.camera = camera
        
        follow_path = camera.constraints.new(type='FOLLOW_PATH')
        follow_path.target = path
        
        track_to = camera.constraints.new(type='TRACK_TO')
        track_to.target = plane
        track_to.track_axis = 'TRACK_NEGATIVE_Z'
        track_to.up_axis = 'UP_Y'

        path.data.path_duration = frame_count
        
        # --- 5. Lighting ---
        bpy.ops.object.light_add(type='SUN', location=(5, 5, 10))
        light = bpy.context.active_object
        light.data.energy = 5.0

        # --- 6. Render ---
        print(f"Starting {frame_count}-frame test animation render...")
        bpy.ops.render.render(animation=True)
        print("Render complete.")
        return (True, f"Successfully rendered to {output_path}")

    except Exception as e:
        return (False, f"An error occurred: {e}")


if __name__ == "__main__":
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []

    parser = argparse.ArgumentParser(description="Render a short test animation of a logo on a plane.")
    parser.add_argument("--output-mp4", required=True, help="Path for the output MP4 file.")
    args = parser.parse_args(argv)

    output_dir = os.path.dirname(args.output_mp4)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    success, message = create_logo_test_animation(args.output_mp4)
    if success:
        print(message)
    else:
        print(message)
        sys.exit(1)