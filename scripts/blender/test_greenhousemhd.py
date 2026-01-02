import bpy
import os
import sys
import math
import argparse

def create_greenhousemhd_animation(output_path, frame_count=20):
    """
    Creates and renders a short animation with 'GreenhouseMHD' text,
    three spotlights, and a camera panning left-right-left.
    """
    try:
        # --- 1. Scene Setup ---
        if bpy.context.object and bpy.context.object.mode != 'OBJECT':
            bpy.ops.object.mode_set(mode='OBJECT')
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
        
        # Set background to black
        if not scene.world:
            scene.world = bpy.data.worlds.new("World")
        scene.world.use_nodes = True
        bg_node = scene.world.node_tree.nodes.get('Background')
        if not bg_node:
            bg_node = scene.world.node_tree.nodes.new('ShaderNodeBackground')
        bg_node.inputs['Color'].default_value = (0, 0, 0, 1)
        
        # Ensure background output is linked
        output_node = scene.world.node_tree.nodes.get('World Output')
        if not output_node:
            output_node = scene.world.node_tree.nodes.new('ShaderNodeOutputWorld')
        
        # Link if not linked
        if not output_node.inputs['Surface'].is_linked:
            scene.world.node_tree.links.new(bg_node.outputs['Background'], output_node.inputs['Surface'])

        # --- 3. Add 3D Text ---
        bpy.ops.object.text_add(location=(0, 0, 0), rotation=(math.radians(90), 0, 0))
        text_obj = bpy.context.active_object
        text_obj.name = "GreenhouseMHD_Text"
        text_obj.data.body = "GreenhouseMHD"
        text_obj.data.align_x = 'CENTER'
        text_obj.data.align_y = 'CENTER'
        text_obj.data.size = 2.0
        text_obj.data.extrude = 0.5
        text_obj.data.bevel_depth = 0.05
        
        # Material for text
        text_mat = bpy.data.materials.new(name="TextMaterial")
        text_mat.use_nodes = True
        bsdf = text_mat.node_tree.nodes.get('Principled BSDF')
        bsdf.inputs['Base Color'].default_value = (0.2, 0.8, 0.2, 1) # Greenhouse Green
        bsdf.inputs['Metallic'].default_value = 1.0
        bsdf.inputs['Roughness'].default_value = 0.2
        text_obj.data.materials.append(text_mat)

        # --- 4. Camera Setup & Animation ---
        start_camera_z = 15
        camera_y = -25
        
        bpy.ops.object.camera_add(location=(0, camera_y, start_camera_z))
        camera = bpy.context.active_object
        scene.camera = camera
        
        # Track to text
        tt = camera.constraints.new(type='TRACK_TO')
        tt.target = text_obj
        tt.track_axis = 'TRACK_NEGATIVE_Z'
        tt.up_axis = 'UP_Y'
        
        # Animate Camera Descent
        scene.frame_set(1)
        camera.location.z = start_camera_z
        camera.keyframe_insert(data_path="location", index=2)
        
        scene.frame_set(frame_count)
        camera.location.z = -2
        camera.keyframe_insert(data_path="location", index=2)
        
        # Animation Variables
        mid_frame = int(frame_count / 2)
        pan_width = 10

        # --- 5. Spotlights Setup & Animation ---
        spot_energy = 2500.0
        spot_y = -10
        spot_z = 5
        
        spots = []
        # Create 3 spotlights
        for i in range(3):
            bpy.ops.object.light_add(type='SPOT', location=(0, spot_y, spot_z))
            spot = bpy.context.active_object
            spot.name = f"Spotlight_{i}"
            spot.data.energy = spot_energy
            spot.data.spot_size = math.radians(35)
            spot.data.spot_blend = 0.5
            
            # Point at text
            tt_spot = spot.constraints.new(type='TRACK_TO')
            tt_spot.target = text_obj
            tt_spot.track_axis = 'TRACK_NEGATIVE_Z'
            tt_spot.up_axis = 'UP_Y'
            
            spots.append(spot)

        # Animate spots (Left -> Right -> Left)
        # Offsets to keep them distinct
        offsets = [-4, 0, 4]
        
        for i, spot in enumerate(spots):
            offset = offsets[i]
            
            # Frame 1
            scene.frame_set(1)
            spot.location.x = -pan_width + offset
            spot.keyframe_insert(data_path="location", index=0)
            
            # Frame Mid
            scene.frame_set(mid_frame)
            spot.location.x = pan_width + offset
            spot.keyframe_insert(data_path="location", index=0)
            
            # Frame End
            scene.frame_set(frame_count)
            spot.location.x = -pan_width + offset
            spot.keyframe_insert(data_path="location", index=0)

        # --- 6. Additional Diagonal Lights ---
        diag_lights_data = [
            ((-15, -5, 5), (15, -15, 5)),
            ((15, -5, 5), (-15, -15, 5)),
            ((-5, -20, 5), (5, -5, 5))
        ]
        
        for i, (start_pos, end_pos) in enumerate(diag_lights_data):
            bpy.ops.object.light_add(type='POINT', location=start_pos)
            light = bpy.context.active_object
            light.name = f"DiagLight_{i}"
            light.data.energy = 1500.0
            
            scene.frame_set(1)
            light.location = start_pos
            light.keyframe_insert(data_path="location")
            
            scene.frame_set(frame_count)
            light.location = end_pos
            light.keyframe_insert(data_path="location")

        # --- 7. Render ---
        print(f"Starting {frame_count}-frame animation render...")
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

    parser = argparse.ArgumentParser(description="Render GreenhouseMHD animation.")
    parser.add_argument("--output-mp4", required=True, help="Path for the output MP4 file.")
    args = parser.parse_args(argv)

    output_dir = os.path.dirname(args.output_mp4)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    success, message = create_greenhousemhd_animation(args.output_mp4)
    if success:
        print(message)
    else:
        print(message)
        sys.exit(1)