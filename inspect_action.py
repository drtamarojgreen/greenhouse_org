import bpy

# Create a dummy armature and animate it to see the structure
bpy.ops.skeleton.armature_add()
arm = bpy.context.object
arm.name = "TestArm"
bpy.ops.object.mode_set(mode='POSE')
pbone = arm.pose.bones[0]
pbone.name = "TestBone"

# Ensure we are using Slotted Actions (Blender 5.0 default)
pbone.location[0] = 1.0
pbone.keyframe_insert(data_path='location', index=0, frame=1)

action = arm.animation_data.action
print(f"Action: {action.name}, type: {type(action)}")

if hasattr(action, "slots"):
    print(f"Slots count: {len(action.slots)}")
    for slot in action.slots:
        print(f"  Slot: {slot.name}, type: {type(slot)}")

if hasattr(action, "layers"):
    print(f"Layers count: {len(action.layers)}")
    for layer in action.layers:
        print(f"    Layer: {layer.name}, type: {type(layer)}")
        # Check for bindings or channels in layer
        # In 5.0, ActionLayer has 'channels'?
        if hasattr(layer, "channels"):
            print(f"      Channels count: {len(layer.channels)}")
            for channel in layer.channels:
                 print(f"        Channel: {getattr(channel, 'name', 'N/A')}, type: {type(channel)}, data_path: {getattr(channel, 'data_path', 'N/A')}")

# Try to find where F-curves are actually stored in 5.0 Slotted Actions
# Usually it's Action -> Layer -> Channels? Or Action -> Slot -> Layer -> ...?
