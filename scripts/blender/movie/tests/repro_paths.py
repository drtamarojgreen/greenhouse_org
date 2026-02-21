import bpy
import os
import sys

# Add movie root to path
sys.path.append(os.getcwd() + "/scripts/blender/movie")
import style_utilities as style

def test_slotted_action_paths():
    # Create an armature
    bpy.ops.object.armature_add()
    arm = bpy.context.object
    arm.name = "TestArm"

    # Add a bone
    bpy.ops.object.mode_set(mode='EDIT')
    bone = arm.data.edit_bones.new("Bone.L")
    bone.head = (0,0,0)
    bone.tail = (0,0,1)
    bpy.ops.object.mode_set(mode='OBJECT')

    # Keyframe it
    arm.pose.bones["Bone.L"].location[0] = 1.0
    arm.keyframe_insert(data_path='pose.bones["Bone.L"].location', index=0, frame=10)
    arm.pose.bones["Bone.L"].location[0] = 2.0
    arm.keyframe_insert(data_path='pose.bones["Bone.L"].location', index=0, frame=20)

    action = arm.animation_data.action
    print(f"Action: {action.name}, type: {type(action)}")

    curves = style.get_action_curves(action)
    print(f"Found {len(curves)} curves via style.get_action_curves")
    for fc in curves:
        print(f"  Path: {fc.data_path}, Index: {fc.array_index}")

if __name__ == "__main__":
    test_slotted_action_paths()
