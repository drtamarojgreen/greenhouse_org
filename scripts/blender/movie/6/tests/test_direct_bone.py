import bpy
import os
import math

def test_direct_bone():
    assets_dir = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/movie/6/assets"
    output_dir = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/movie/6/renders/test_bones"
    os.makedirs(output_dir, exist_ok=True)
    
    fbx_file = "0001.fbx" 
    
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=os.path.join(assets_dir, fbx_file))
    
    rig = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
    if not rig: return
    
    # Light/Cam Setup
    bpy.ops.object.camera_add(location=(0, -10, 2))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(80), 0, 0)
    bpy.context.scene.camera = cam
    bpy.ops.object.light_add(type='SPOT', location=(0, 0, 5))
    
    # Direct Bone Manipulation
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='POSE')
    
    if rig.pose.bones:
        # Move the spine/torso, which is almost always weighted
        for b_name in ["Spine", "Spine1", "Torso", "Hips"]:
            bone = rig.pose.bones.get(b_name)
            if bone:
                bone.location = (0.5, 0, 0)
                print(f"Moving bone: {bone.name}")
                break
        
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.context.view_layer.update()
    
    bpy.context.scene.render.filepath = os.path.join(output_dir, "bone_move_test.png")
    bpy.ops.render.render(write_still=True)
    print("Rendered bone move test.")

if __name__ == "__main__":
    test_direct_bone()
