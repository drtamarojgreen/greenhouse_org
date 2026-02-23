import bpy
import os
import sys

# Add movie root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import style_utilities as style

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.object.armature_add()
arm = bpy.context.object
if not arm.animation_data: arm.animation_data_create()
action = arm.animation_data.action = bpy.data.actions.new(name="DebugAction")
if hasattr(action, "layers"): action.layers.new(name="Main")

fc = style.get_or_create_fcurve(action, "location", 0, ref_obj=arm)
print(f"FC type: {type(fc)}")
fc.keyframe_points.insert(frame=1, value=1.2)
print(f"FC keys: {len(fc.keyframe_points)}")

# Try to find who owns this FC
for attr in ["id_data", "parent", "action", "binding", "slot"]:
    if hasattr(fc, attr):
        print(f"FC.{attr}: {getattr(fc, attr)}")

# Scan action manually
print("Scanning action layers...")
if hasattr(action, "layers"):
    for l in action.layers:
        print(f"Layer: {l.name}")
        if hasattr(l, "bindings"):
            for b in l.bindings:
                print(f"  Binding: {b}")
                if hasattr(b, "fcurves"):
                    for f in b.fcurves:
                        print(f"    Fcurve in binding: {f} (Match: {f == fc})")
