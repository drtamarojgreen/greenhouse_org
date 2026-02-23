import bpy
import os
import sys

# Add the directory containing style_utilities to sys.path
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

import style_utilities as style

obj = bpy.data.objects.get("Herbaceous")
if not obj:
    print("Herbaceous not found")
else:
    print(f"Object: {obj.name}")
    if obj.animation_data and obj.animation_data.action:
        action = obj.animation_data.action
        print(f"Action: {action.name}")
        print(f"  F-curves count (legacy): {len(action.fcurves) if hasattr(action, 'fcurves') else 'N/A'}")
        if hasattr(action, "layers"):
            print(f"  Layers count: {len(action.layers)}")
            for i, layer in enumerate(action.layers):
                print(f"    Layer {i}: {layer.name}, channels: {len(layer.channels)}")
        
        curves = style.get_action_curves(action)
        print(f"  Total curves found by style.get_action_curves: {len(curves)}")
        for i, c in enumerate(curves[:10]):
            print(f"    {i}: {c.data_path} [{c.array_index}]")
        if len(curves) > 10:
            print("    ...")
    else:
        print("No action found on Herbaceous")
