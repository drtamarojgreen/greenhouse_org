
import bpy
import os

def render_minimal_animation():
    print("\n--- Minimal Animation Test ---")
    
    # 1. Clear Scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # 2. Add Primitive Cube
    bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
    cube = bpy.context.active_object
    
    # 3. Animate Cube (10 frames)
    cube.rotation_euler = (0, 0, 0)
    cube.keyframe_insert(data_path="rotation_euler", frame=1)
    cube.rotation_euler = (0, 0, 1.57) # 90 degrees
    cube.keyframe_insert(data_path="rotation_euler", frame=10)
    
    # 4. Camera & Light
    bpy.ops.object.camera_add(location=(5, -5, 5), rotation=(0.785, 0, 0.785))
    bpy.context.scene.camera = bpy.context.active_object
    
    bpy.ops.object.light_add(type='POINT', location=(5, 5, 5))
    
    # 5. Render Settings
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 10
    
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'MKV'
    scene.render.ffmpeg.codec = 'H264'
    
    output_path = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/minimal_test"
    scene.render.filepath = output_path
    
    print(f"Attempting to render 10 frames to {output_path}.mkv...")
    bpy.ops.render.render(animation=True)
    
    if os.path.exists(output_path + ".mkv"):
        print("SUCCESS: Minimal animation rendered.")
    else:
        print("FAILURE: MKV file not found.")

if __name__ == "__main__":
    render_minimal_animation()
