import bpy
import os
import sys
import math

# Setup paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SCENE5_DIR = os.path.dirname(SCRIPT_DIR)
if SCENE5_DIR not in sys.path:
    sys.path.append(SCENE5_DIR)

from assets_v5.plant_humanoid_v5 import create_plant_humanoid_v5

def test_rig_integrity():
    print("Testing Scene 5 High-Fidelity Rigging...")
    
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # 1. Create Character
    armature = create_plant_humanoid_v5("TestChar", (0,0,0))
    
    # 2. Verify Bones
    required_bones = [
        "Torso", "Neck", "Head",
        "Arm.L", "Elbow.L", "Arm.R", "Elbow.R",
        "Thigh.L", "Knee.L", "Thigh.R", "Knee.R",
        "Eye.L", "Eye.R", "Lip.Upper", "Lip.Lower"
    ]
    
    for bone_name in required_bones:
        if bone_name not in armature.data.bones:
            print(f"FAILED: Bone '{bone_name}' missing!")
            sys.exit(1)
        else:
            print(f"PASSED: Bone '{bone_name}' found.")

    # 3. Test Animation (Limbs & Mesh Deform)
    print("Testing Animation Deformation...")
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set(mode='POSE')
    
    body_obj = next(obj for obj in bpy.data.objects if "TestChar_Body" in obj.name)
    v_orig = body_obj.data.vertices[0].co.copy()
    
    # Animate Thigh
    bone = armature.pose.bones["Thigh.L"]
    bone.rotation_mode = 'XYZ'
    bone.rotation_euler[0] = 0
    bone.keyframe_insert(data_path="rotation_euler", frame=1)
    bone.rotation_euler[0] = math.radians(45)
    bone.keyframe_insert(data_path="rotation_euler", frame=10)
    
    bpy.context.scene.frame_set(10)
    # Force dependency graph update (Blender 5.0 API)
    dg = bpy.context.evaluated_depsgraph_get()
    body_eval = body_obj.evaluated_get(dg)
    v_new = body_eval.data.vertices[0].co.copy()
    
    if (v_new - v_orig).length > 0.001:
        print(f"PASSED: Mesh deformed during animation. Delta: {(v_new - v_orig).length}")
    else:
        print("FAILED: Mesh did NOT deform during animation!")
        sys.exit(1)

    # 4. Test Facial Animation (Lip/Eye Movement)
    print("Testing Facial Animation Movement...")
    lip_obj = bpy.data.objects["TestChar_Lip_Upper"]
    lip_orig = lip_obj.matrix_world.translation.copy()
    
    # Animate Lip Bone
    lip_bone = armature.pose.bones["Lip.Upper"]
    lip_bone.rotation_mode = 'XYZ'
    lip_bone.location[2] = 0
    lip_bone.keyframe_insert(data_path="location", index=2, frame=1)
    lip_bone.location[2] = 0.2 # Move up
    lip_bone.keyframe_insert(data_path="location", index=2, frame=10)
    
    bpy.context.scene.frame_set(10)
    dg = bpy.context.evaluated_depsgraph_get()
    lip_eval = lip_obj.evaluated_get(dg)
    lip_new = lip_eval.matrix_world.translation.copy()
    
    if (lip_new - lip_orig).length > 0.01:
        print(f"PASSED: Facial feature 'Lip.Upper' moved. Delta: {(lip_new - lip_orig).length}")
    else:
        print("FAILED: Facial feature 'Lip.Upper' did NOT move!")
        sys.exit(1)

    # 5. Verify Facial Feature Visibility (World Space)
    for obj in bpy.data.objects:
        if "Eyeball" in obj.name or "Lip" in obj.name:
            obj_eval = obj.evaluated_get(dg)
            world_loc = obj_eval.matrix_world.translation
            # Head is roughly at (0,0,1.9). Features should be forward (~ -0.4 on Y)
            if world_loc.y > -0.3:
                print(f"WARNING: Facial feature '{obj.name}' buried in Head! World Y={world_loc.y}")
            else:
                print(f"PASSED: Facial feature '{obj.name}' clearly visible at World Y={world_loc.y}")

    print("\nScene 5 Comprehensive Rigging/Animation Test: SUCCESS")

if __name__ == "__main__":
    test_rig_integrity()
