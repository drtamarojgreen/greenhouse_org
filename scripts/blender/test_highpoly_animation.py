
import bpy
import os

def render_highpoly_animation():
    print("\n--- High-Poly Animation Test (Raw Brain) ---")
    
    # 1. Clear Scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # 2. Import Full Brain (150k verts)
    fbx_path = '/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/brain.fbx'
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    brain = bpy.context.selected_objects[0]
    
    # 3. Animate Brain Rotation (10 frames)
    brain.rotation_euler = (0, 0, 0)
    brain.keyframe_insert(data_path="rotation_euler", frame=1)
    brain.rotation_euler = (0, 0, 0.5)
    brain.keyframe_insert(data_path="rotation_euler", frame=10)
    
    # 4. Camera & Light
    bpy.ops.object.camera_add(location=(10, -10, 10), rotation=(0.785, 0, 0.785))
    bpy.context.scene.camera = bpy.context.active_object
    bpy.ops.object.light_add(type='POINT', location=(10, 10, 10))
    
    # 5. Render Settings
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 10
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'MKV'
    
    output_path = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/highpoly_test"
    scene.render.filepath = output_path
    
    print(f"Attempting to render 10 frames of 150k-vertex mesh to {output_path}.mkv...")
    bpy.ops.render.render(animation=True)
    
    if os.path.exists(output_path + "0001-0010.mkv") or os.path.exists(output_path + ".mkv"):
        print("SUCCESS: High-poly animation rendered.")
    else:
        print("FAILURE: High-poly MKV file not found.")

if __name__ == "__main__":
    render_highpoly_animation()
