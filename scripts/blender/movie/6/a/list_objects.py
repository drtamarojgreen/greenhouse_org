import bpy
import os
import sys

# Standard path injection
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)
import config

def list_objects():
    print("\n" + "=" * 40)
    print("--- ACTUAL OBJECT NAMES IN BLEND ---")
    for obj in bpy.data.objects:
        print(f"Object: {obj.name} | Type: {obj.type}")
    print("=" * 40 + "\n")

if __name__ == "__main__":
    filepath = config.SPIRITS_ASSET_BLEND
    if bpy.ops.wm.open_mainfile(filepath=filepath):
        list_objects()
    else:
        print(f"Failed to open {filepath}")
