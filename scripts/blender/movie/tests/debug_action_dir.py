import bpy
import os
import sys

# Add movie root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.object.armature_add()
arm = bpy.context.object
if not arm.animation_data: arm.animation_data_create()
action = arm.animation_data.action = bpy.data.actions.new(name="SlottedAction")
if hasattr(action, "layers"): action.layers.new(name="Main")

# Create a slotted f-curve
try:
    fc = action.fcurve_ensure_for_datablock(arm, data_path="location", index=0)
    fc.keyframe_points.insert(frame=1, value=1.0)
    print("Successfully created slotted F-Curve.")
except Exception as e:
    print(f"Failed to create slotted F-Curve: {e}")

print(f"Action: {action.name}")
print(f"Action Attributes: {[a for a in dir(action) if not a.startswith('_')]}")

if hasattr(action, "slots"):
    print(f"Slots count: {len(action.slots)}")
    for i, slot in enumerate(action.slots):
        print(f"  Slot {i}: {slot}")
        print(f"  Slot Attributes: {[a for a in dir(slot) if not a.startswith('_')]}")
        
if hasattr(action, "layers"):
    print(f"Layers count: {len(action.layers)}")
    for i, layer in enumerate(action.layers):
        print(f"  Layer {i}: {layer.name}")
        print(f"  Layer Attributes: {[a for a in dir(layer) if not a.startswith('_')]}")
        if hasattr(layer, "channels") and len(layer.channels) > 0:
            print(f"    Channels count: {len(layer.channels)}")
            chan = layer.channels[0]
            print(f"    Channel 0 Attributes: {[a for a in dir(chan) if not a.startswith('_')]}")

from bpy_extras import anim_utils
try:
    if len(action.slots) > 0:
        cbag = anim_utils.action_get_channelbag_for_slot(action, action.slots[0])
        print(f"Channelbag Fcurves count: {len(cbag.fcurves)}")
        print(f"Channelbag Attributes: {[a for a in dir(cbag) if not a.startswith('_')]}")
except Exception as e:
    print(f"anim_utils error: {e}")
