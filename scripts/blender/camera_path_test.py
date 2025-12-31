
import bpy
import os
import math

def render_camera_path_animation():
    print("\n--- Camera Path Animation Test (Minimal) ---")
    
    # 1. Clear Scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # 2. Add Target (Cube)
    bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
    cube = bpy.context.active_object
    cube.name = "TargetCube"
    
    # 3. Add Path (Bezier Circle)
    bpy.ops.curve.primitive_bezier_circle_add(radius=5, location=(0, 0, 0))
    path = bpy.context.active_object
    path.name = "CameraPath"
    
    # 4. Add Camera
    bpy.ops.object.camera_add()
    camera = bpy.context.active_object
    camera.name = "PathCamera"
    
    # 5. Add Follow Path Constraint
    constraint = camera.constraints.new(type='FOLLOW_PATH')
    constraint.target = path
    constraint.use_fixed_location = True
    constraint.forward_axis = 'TRACK_NEGATIVE_Z'
    constraint.up_axis = 'UP_Y'
    
    # 6. Add Track To Constraint (Optional but helpful for rotation)
    track = camera.constraints.new(type='TRACK_TO')
    track.target = cube
    track.track_axis = 'TRACK_NEGATIVE_Z'
    track.up_axis = 'UP_Y'
    
    # 7. Animate Path Evaluation
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 60
    
    # Set keyframes for the follow path evaluation
    constraint.offset_factor = 0.0
    constraint.keyframe_insert(data_path="offset_factor", frame=1)
    constraint.offset_factor = 1.0
    constraint.keyframe_insert(data_path="offset_factor", frame=60)
    
    # 8. Render Settings
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'MKV'
    scene.render.ffmpeg.codec = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.ffmpeg.ffmpeg_preset = 'GOOD'
    
    output_path = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/camera_path_test"
    scene.render.filepath = output_path
    
    # Set as active camera
    scene.camera = camera
    
    print(f"Attempting to render 60 frames of camera-on-path to {output_path}.mkv...")
    bpy.ops.render.render(animation=True)
    
    # Check for output (Blender appends frame numbers to video files if it's not a single frame render)
    # But usually for animation=True it just outputs the name if specified? 
    # Actually Blender appends ####-#### if there's no frame range in name.
    print("Checking for generated file...")
    found = False
    for f in os.listdir("/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/"):
        if f.startswith("camera_path_test") and f.endswith(".mkv"):
            print(f"Found: {f} (Size: {os.path.getsize(os.path.join('/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/', f))} bytes)")
            found = True
            
    if found:
        print("SUCCESS: Camera path animation rendered.")
    else:
        print("FAILURE: Camera path MKV file not found.")

if __name__ == "__main__":
    render_camera_path_animation()
