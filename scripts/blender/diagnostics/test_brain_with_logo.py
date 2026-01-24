
import bpy
import os
import sys
import math
import mathutils
import argparse

def create_brain_logo_animation(output_path, frame_count=20):
    """
    Creates and renders a short test animation with a textured brain
    in the foreground and the Greenhouse logo on a plane in the background.
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

        # --- 3. Load Textured Brain (from simple_render_test.py) ---
        script_dir = os.path.dirname(os.path.abspath(__file__))
        fbx_path = os.path.join(script_dir, "brain.fbx")
        if os.path.exists(fbx_path):
            bpy.ops.import_scene.fbx(filepath=fbx_path)
            brain_obj = bpy.context.selected_objects[0]
            
            # Ensure origin is centered for proper scaling
            bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
            
            mat = bpy.data.materials.new(name="BrainMaterial")
            brain_obj.data.materials.append(mat)
            mat.use_nodes = True
            bsdf = mat.node_tree.nodes.get('Principled BSDF')
            tex_noise = mat.node_tree.nodes.new('ShaderNodeTexNoise')
            tex_noise.inputs['Scale'].default_value = 5.0
            color_ramp = mat.node_tree.nodes.new('ShaderNodeValToRGB')
            color_ramp.color_ramp.elements[0].color = (0.8, 0.1, 0.1, 1)
            mat.node_tree.links.new(tex_noise.outputs['Fac'], color_ramp.inputs['Fac'])
            mat.node_tree.links.new(color_ramp.outputs['Color'], bsdf.inputs['Base Color'])
            bsdf.inputs['Alpha'].default_value = 0.75
        else:
            print(f"Warning: brain.fbx not found at {fbx_path}")
            bpy.ops.mesh.primitive_cube_add(size=2, location=(0,0,0))
            brain_obj = bpy.context.active_object

        # Position the brain centered between camera (Y=-20) and text (Y=10)
        # and vertically aligned with the text center (approx Z=5)
        brain_obj.location = (0, -5, 5)

        # Animate brain scale
        mid_frame = int(frame_count / 2)
        brain_obj.scale = (2.0, 2.0, 2.0)
        brain_obj.keyframe_insert(data_path="scale", frame=1)
        brain_obj.scale = (3.0, 3.0, 3.0)
        brain_obj.keyframe_insert(data_path="scale", frame=mid_frame)
        brain_obj.scale = (2.0, 2.0, 2.0)
        brain_obj.keyframe_insert(data_path="scale", frame=frame_count)

        # --- 4. Add Background Plane with Logo (from test_logo_animation.py) ---
        bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 20, 0), rotation=(math.radians(90), 0, 0))
        plane = bpy.context.active_object
        plane.name = "LogoPlane"
        
        plane_mat = bpy.data.materials.new(name="LogoMaterial")
        plane.data.materials.append(plane_mat)
        plane_mat.use_nodes = True
        nodes = plane_mat.node_tree.nodes
        links = plane_mat.node_tree.links
        nodes.clear()

        output = nodes.new(type='ShaderNodeOutputMaterial')
        emission = nodes.new(type='ShaderNodeEmission')
        tex_image = nodes.new(type='ShaderNodeTexImage')
        
        logo_path = os.path.join(script_dir, "..", "..", "docs", "images", "Greenhouse_Logo.png")
        if os.path.exists(logo_path):
            tex_image.image = bpy.data.images.load(logo_path)

        links.new(tex_image.outputs['Color'], emission.inputs['Color'])
        links.new(emission.outputs['Emission'], output.inputs['Surface'])

        bpy.context.view_layer.objects.active = plane
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.unwrap()
        bpy.ops.object.mode_set(mode='OBJECT')

        # --- 5. Add 3D Text ---
        text_lines = ["Greenhouse", "for", "Mental Health", "Development"]
        text_objects = []
        line_height = -3.5
        total_text_height = (len(text_lines) - 1) * abs(line_height)
        start_z = (total_text_height / 2) + 5.0

        text_mat = bpy.data.materials.new(name="TextMaterial")
        text_mat.use_nodes = True
        text_bsdf = text_mat.node_tree.nodes.get('Principled BSDF')
        text_bsdf.inputs['Base Color'].default_value = (0.2, 0.8, 0.2, 1)
        text_bsdf.inputs['Metallic'].default_value = 1.0
        text_bsdf.inputs['Roughness'].default_value = 0.2

        for i, line in enumerate(text_lines):
            bpy.ops.object.text_add(location=(0, 10, start_z + i * line_height), rotation=(math.radians(90), 0, 0))
            text_obj = bpy.context.active_object
            text_obj.name = f"TextLine_{i}"
            text_obj.data.body = line
            text_obj.data.align_x = 'CENTER'
            text_obj.data.align_y = 'CENTER'
            text_obj.data.size = 3.0
            text_obj.data.extrude = 0.2
            text_obj.data.bevel_depth = 0.05
            
            text_obj.data.materials.append(text_mat)
            text_objects.append(text_obj)
            
        for obj in text_objects:
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.convert(target='MESH')

        # --- 6. Camera Animation ---
        camera_z_pos = start_z + (len(text_lines) - 1) * line_height / 2
        bpy.ops.object.camera_add(location=(-10, -20, camera_z_pos))
        camera = bpy.context.active_object
        camera.data.lens = 24 # Fit size 30 logo at distance 40
        scene.camera = camera
        
        # Animate camera position and rotation
        # Frame 1
        bpy.context.scene.frame_set(1)
        camera.location = (-10, -20, camera_z_pos)
        look_at_point = (0, 10, camera_z_pos)
        direction = mathutils.Vector(look_at_point) - camera.location
        rot_quat = direction.to_track_quat('-Z', 'Y')
        camera.rotation_euler = rot_quat.to_euler()
        camera.keyframe_insert(data_path="location", index=-1)
        camera.keyframe_insert(data_path="rotation_euler", index=-1)

        # Frame Mid
        bpy.context.scene.frame_set(mid_frame)
        camera.location = (10, -20, camera_z_pos)
        look_at_point = (0, 10, camera_z_pos)
        direction = mathutils.Vector(look_at_point) - camera.location
        rot_quat = direction.to_track_quat('-Z', 'Y')
        camera.rotation_euler = rot_quat.to_euler()
        camera.keyframe_insert(data_path="location", index=-1)
        camera.keyframe_insert(data_path="rotation_euler", index=-1)

        # Frame End
        bpy.context.scene.frame_set(frame_count)
        camera.location = (-10, -20, camera_z_pos)
        look_at_point = (0, 10, camera_z_pos)
        direction = mathutils.Vector(look_at_point) - camera.location
        rot_quat = direction.to_track_quat('-Z', 'Y')
        camera.rotation_euler = rot_quat.to_euler()
        camera.keyframe_insert(data_path="location", index=-1)
        camera.keyframe_insert(data_path="rotation_euler", index=-1)
        
        # --- 7. Lighting ---
        bpy.ops.object.light_add(type='SUN', location=(5, -5, 10))
        light = bpy.context.active_object
        light.data.energy = 5.0

        # Add Spotlight
        bpy.ops.object.light_add(type='SPOT', location=(0, -15, 15))
        spot = bpy.context.active_object
        spot.data.energy = 3000.0
        spot.data.spot_size = math.radians(45)
        spot.data.spot_blend = 0.5
        tt = spot.constraints.new(type='TRACK_TO')
        tt.target = brain_obj
        tt.track_axis = 'TRACK_NEGATIVE_Z'
        tt.up_axis = 'UP_Y'

        # --- 8. Render ---
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

    parser = argparse.ArgumentParser(description="Render a short test animation of a brain with a logo background.")
    parser.add_argument("--output-mp4", required=True, help="Path for the output MP4 file.")
    args = parser.parse_args(argv)

    output_dir = os.path.dirname(args.output_mp4)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    success, message = create_brain_logo_animation(args.output_mp4)
    if success:
        print(message)
    else:
        print(message)
        sys.exit(1)
