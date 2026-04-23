import bpy
import os
import math

def test_googles_idea():
    output_dir = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/movie/6/renders/matrix"
    os.makedirs(output_dir, exist_ok=True)
    
    assets_dir = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/movie/6/assets"
    fbx_files = [f for f in os.listdir(assets_dir) if f.endswith(".fbx")]

    for fbx in fbx_files:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        
        # Import FBX directly
        filepath = os.path.join(assets_dir, fbx)
        bpy.ops.import_scene.fbx(filepath=filepath)
        
        # Link EVERYTHING imported to the scene collection
        for obj in bpy.data.objects:
            if obj.name not in bpy.context.scene.collection.objects:
                try:
                    bpy.context.scene.collection.objects.link(obj)
                except: pass
        
        # Camera & Light
        bpy.ops.object.camera_add(location=(0, -10, 2))
        cam = bpy.context.active_object
        cam.rotation_euler = (math.radians(80), 0, 0)
        bpy.context.scene.camera = cam
        bpy.ops.object.light_add(type='SPOT', location=(0, 0, 5))
        
        # Render Original
        frame_path_orig = os.path.join(output_dir, f"{fbx[:-4]}_original_pose.png")
        bpy.context.scene.render.filepath = frame_path_orig
        bpy.ops.render.render(write_still=True)
        
        # Rotate Torso/Hips
        rig = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
        if rig:
            bpy.context.view_layer.objects.active = rig
            bpy.ops.object.mode_set(mode='POSE')
            bone = next((b for b in rig.pose.bones if b.parent is None), None)
            if bone: bone.rotation_euler = (0, 0, math.radians(45))
            bpy.ops.object.mode_set(mode='OBJECT')
        
        # Render Posed
        frame_path_posed = os.path.join(output_dir, f"{fbx[:-4]}_rig_pose.png")
        bpy.context.scene.render.filepath = frame_path_posed
        bpy.ops.render.render(write_still=True)
        
        print(f"Verified: {fbx}")

if __name__ == "__main__":
    test_googles_idea()
