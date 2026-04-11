import bpy
import os
import sys
import mathutils

# Ensure v6 is in path
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.append(V6_DIR)

import config

def test_character_scale():
    print("\n--- TEST: Character Scale ---")
    bpy.context.view_layer.update()

    for artistic_name, target_h in config.HEIGHT_TARGETS.items():
        # Protagonists use .Body suffix in Scene 6 construction
        obj_name = artistic_name + ".Body"
        obj = bpy.data.objects.get(obj_name) or bpy.data.objects.get(artistic_name)

        if not obj:
            print(f"SKIP: {artistic_name} not found in scene.")
            continue

        if obj.type != 'MESH':
            # Might be a rig, find its mesh
            mesh = next((c for c in obj.children if c.type == 'MESH'), None)
            if not mesh:
                print(f"SKIP: No mesh found for {artistic_name}")
                continue
            obj = mesh

        bbox = [obj.matrix_world @ mathutils.Vector(v) for v in obj.bound_box]
        z_vals = [v.z for v in bbox]
        current_h = max(z_vals) - min(z_vals)

        diff = abs(current_h - target_h)
        tolerance = 0.05 * target_h

        if diff < tolerance:
            print(f"PASSED: {artistic_name} height is {current_h:.2f} (Target: {target_h}, Tolerance: {tolerance:.2f})")
        else:
            print(f"FAILED: {artistic_name} height is {current_h:.2f} (Target: {target_h}, Tolerance: {tolerance:.2f}, Diff: {diff:.2f})")

if __name__ == "__main__":
    test_character_scale()
