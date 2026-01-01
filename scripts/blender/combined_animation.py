
import bpy
import os
import math
import sys
import argparse

def _create_and_render_animation(logo_image_path, output_path):
    """
    Private worker function to create and render the combined animation.
    Returns a tuple (success, message).
    """
    try:
        # --- 1. Scene Setup ---
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete(use_global=False)

        scene = bpy.context.scene
        scene.frame_start = 1
        scene.frame_end = 180
        scene.render.fps = 30

        # --- 2. Render Settings ---
        scene.render.engine = 'CYCLES'
        scene.cycles.samples = 128
        scene.render.resolution_x = 1920
        scene.render.resolution_y = 1080
        scene.render.filepath = output_path
        scene.render.image_settings.file_format = 'FFMPEG'
        scene.render.ffmpeg.format = 'MPEG4'
        scene.render.ffmpeg.codec = 'H264'
        scene.render.ffmpeg.constant_rate_factor = 'HIGH' # Use high quality for better result
        scene.render.ffmpeg.ffmpeg_preset = 'GOOD'
        scene.render.ffmpeg.gopsize = 18 # Increase GOP size for better compression and quality

        # --- 3. Background Logo Plane ---
        # Create a plane
        bpy.ops.mesh.primitive_plane_add(size=20, enter_editmode=False, align='WORLD', location=(0, 0, -2))
        plane = bpy.context.active_object
        
        # Create material for the plane and load image as texture
        plane_mat = bpy.data.materials.new(name="LogoBackgroundMaterial")
        plane.data.materials.append(plane_mat)
        plane_mat.use_nodes = True
        nodes = plane_mat.node_tree.nodes
        links = plane_mat.node_tree.links

        # Clear existing nodes for a clean setup
        for node in nodes:
            nodes.remove(node)

        # Add Principled BSDF and Output nodes
        bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
        output = nodes.new(type='ShaderNodeOutputMaterial')
        links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
        
        if os.path.exists(logo_image_path):
            try:
                img = bpy.data.images.load(logo_image_path)
                tex_image = nodes.new('ShaderNodeTexImage')
                tex_image.image = img
                # Connect image to Base Color
                links.new(tex_image.outputs['Color'], bsdf.inputs['Base Color'])
                # Connect alpha to alpha
                links.new(tex_image.outputs['Alpha'], bsdf.inputs['Alpha'])
                # Set blend mode for transparency
                plane_mat.blend_method = 'BLEND'
                # Optional: make it slightly emissive
                bsdf.inputs['Emission Strength'].default_value = 0.5
                bsdf.inputs['Emission Color'].default_value = (1.0, 1.0, 1.0, 1)
                print(f"Loaded logo image from: {logo_image_path}")
            except Exception as e:
                print(f"Warning: Could not load logo image from '{logo_image_path}': {e}. Plane will be a default color.")
                bsdf.inputs['Base Color'].default_value = (0.1, 0.1, 0.1, 1) # Default to dark gray
        else:
            print(f"Warning: Logo image file not found at '{logo_image_path}'. Plane will be a default color.")
            bsdf.inputs['Base Color'].default_value = (0.1, 0.1, 0.1, 1) # Default to dark gray
        
        # Adjust plane position and scale for the logo
        plane.location.y = 8 # Move it back along Y axis
        plane.location.z = -2 # Lower it slightly
        # You might need to adjust the plane scale and UV mapping depending on the logo's aspect ratio
        # For a simple square image on a square plane, default UV is fine.

        # --- 4. Foreground Text Animation (from bloom_text_animation.py) ---
        bpy.ops.object.text_add(location=(0, 0, 0))
        text_obj = bpy.context.object
        text_obj.data.body = "Bloom Into\nYour Better Self"
        text_obj.data.align_x = 'CENTER'
        text_obj.data.align_y = 'CENTER'
        text_obj.data.space_line = 1.3
        text_obj.data.extrude = 0.25
        text_obj.data.bevel_depth = 0.03
        text_obj.data.bevel_resolution = 3
        bpy.ops.object.convert(target='MESH')
        
        text_mat = bpy.data.materials.new(name="BloomGreen")
        text_mat.use_nodes = True
        text_nodes = text_mat.node_tree.nodes
        text_bsdf = text_nodes.get("Principled BSDF")
        text_bsdf.inputs["Base Color"].default_value = (0.25, 0.55, 0.35, 1)
        text_obj.data.materials.append(text_mat)
        
        # Text Bloom Effect Animation
        text_obj.scale = (0.01, 0.01, 0.01)
        text_obj.keyframe_insert(data_path="scale", frame=1)
        text_obj.scale = (1.0, 1.0, 1.0)
        text_obj.keyframe_insert(data_path="scale", frame=60)

        # Subtle Float Animation
        text_obj.location = (0, 0, 0)
        text_obj.keyframe_insert(data_path="location", frame=60)
        text_obj.location = (0, 0, 0.2)
        text_obj.keyframe_insert(data_path="location", frame=180)


        # --- 5. Camera and Lighting ---
        bpy.ops.object.camera_add(location=(0, -15, 5)) # Adjusted camera position
        camera = bpy.context.object
        camera.data.clip_start = 0.1
        camera.data.clip_end = 1000
        bpy.context.scene.camera = camera
        
        # Point camera to look at the center, or the text object
        # Look at location for text is (0,0,0), adjust if text position changes
        # Simple track to constraint to keep text centered
        track_to_constraint = camera.constraints.new(type='TRACK_TO')
        track_to_constraint.target = text_obj
        track_to_constraint.track_axis = 'TRACK_NEGATIVE_Z'
        track_to_constraint.up_axis = 'UP_Y'
        
        # Lighting (from bloom_text_animation.py)
        # Key Light
        bpy.ops.object.light_add(type='AREA', location=(3, -3, 4))
        key_light = bpy.context.object
        key_light.data.energy = 800
        key_light.data.size = 4

        # Fill Light
        bpy.ops.object.light_add(type='AREA', location=(-3, -4, 2))
        fill_light = bpy.context.object
        fill_light.data.energy = 300
        fill_light.data.size = 3

        # Back Light
        bpy.ops.object.light_add(type='POINT', location=(0, 3, 3))
        back_light = bpy.context.object
        back_light.data.energy = 200

        # --- 6. Render ---
        print("Starting animation render...")
        bpy.ops.render.render(animation=True)
        print("Render complete.")
        
        return (True, f"Successfully rendered animation to {output_path}")

    except Exception as e:
        return (False, f"An error occurred: {e}")

def render_combined_animation(logo_image_path, output_path):
    """
    Public function to render the combined animation.
    """
    success, message = _create_and_render_animation(logo_image_path, output_path)
    if success:
        print(f"Render successful: {message}")
    else:
        print(f"Render failed: {message}")
        if not bpy.context.window_manager.windows:
            bpy.ops.wm.quit_blender()

if __name__ == "__main__":
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []

    parser = argparse.ArgumentParser(description="Render a combined logo and text animation.")
    parser.add_argument("--logo-image", default="", help="Path to the image file for the background logo (e.g., SVG, PNG).")
    parser.add_argument("--output-mp4", required=True, help="Path for the output MP4 file.")
    args = parser.parse_args(argv)

    output_dir = os.path.dirname(args.output_mp4)
    os.makedirs(output_dir, exist_ok=True)

    render_combined_animation(args.logo_image, args.output_mp4)
