import bpy
import style_utilities as style
import os

# Create a dummy object and animate it
bpy.ops.object.empty_add(type='PLAIN_AXES', name="TestObj")
obj = bpy.context.object
obj.location = (1, 2, 3)
obj.keyframe_insert(data_path="location", frame=1)
obj.location = (4, 5, 6)
obj.keyframe_insert(data_path="location", frame=10)

action = obj.animation_data.action
print(f"Action: {action.name}")
print(f"Has fcurves: {hasattr(action, 'fcurves')} (len: {len(action.fcurves) if hasattr(action, 'fcurves') else 'N/A'})")
print(f"Has layers: {hasattr(action, 'layers')} (len: {len(action.layers) if hasattr(action, 'layers') else 'N/A'})")
print(f"Has slots: {hasattr(action, 'slots')} (len: {len(action.slots) if hasattr(action, 'slots') else 'N/A'})")

curves = style.get_action_curves(action)
print(f"style.get_action_curves returned {len(curves)} curves")
for i, fc in enumerate(curves):
    print(f"  [{i}] {fc.data_path} index {fc.array_index}")

# Now try with a bone
bpy.ops.object.armature_add()
arm = bpy.context.object
arm.name = "TestArm"
bpy.ops.object.mode_set(mode='POSE')
bone = arm.pose.bones[0]
bone.name = "Torso"
bone.location = (1, 1, 1)
arm.keyframe_insert(data_path='pose.bones["Torso"].location', frame=1)

action_arm = arm.animation_data.action
print(f"\nArmature Action: {action_arm.name}")
curves_arm = style.get_action_curves(action_arm)
print(f"style.get_action_curves returned {len(curves_arm)} curves")
for i, fc in enumerate(curves_arm):
    print(f"  [{i}] {fc.data_path} index {fc.array_index}")
