import bpy

# Create a rigged character
import os
import sys
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "scripts/blender/movie"))
sys.path.append(os.path.join(os.getcwd(), "scripts/blender/movie/assets"))

from assets import plant_humanoid

# Setup
arm = plant_humanoid.create_plant_humanoid("TestChar", (0,0,0))
plant_humanoid.animate_talk(arm, 1, 10)

action = arm.animation_data.action
print(f"Action: {action.name}")
print(f"Action type: {type(action)}")

def dump(obj, level=0):
    indent = "  " * level
    print(f"{indent}Obj: {obj} (Type: {type(obj)})")
    if hasattr(obj, "name"): print(f"{indent}  Name: {obj.name}")

    # Try common attributes
    for attr in ["layers", "slots", "bindings", "channels", "fcurves", "action_items", "curves"]:
        if hasattr(obj, attr):
            val = getattr(obj, attr)
            print(f"{indent}  Attr: {attr}")
            if hasattr(val, "__iter__") and not isinstance(val, (str, bytes)):
                for i, item in enumerate(val):
                    print(f"{indent}    [{i}]")
                    dump(item, level + 2)
            else:
                dump(val, level + 2)

    if hasattr(obj, "data_path"):
        print(f"{indent}  Data Path: {obj.data_path}")
    if hasattr(obj, "array_index"):
        print(f"{indent}  Index: {obj.array_index}")

dump(action)
