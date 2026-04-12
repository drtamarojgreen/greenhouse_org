import bpy
import os
import sys

# Ensure v6 is in path
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.append(V6_DIR)

import config

def test_camera_rig():
    print("\n--- TEST: Camera Rig ---")

    required_cams = ["WIDE", "OTS1", "OTS2"]

    for cam_name in required_cams:
        cam = bpy.data.objects.get(cam_name)
        if not cam:
            print(f"FAILED: Camera {cam_name} not found.")
            continue

        fp_constraint = next((c for c in cam.constraints if c.type == 'FOLLOW_PATH'), None)
        if fp_constraint:
            target = fp_constraint.target
            if target:
                print(f"PASSED: Camera {cam_name} has FOLLOW_PATH constraint targeting {target.name}")

                if cam.animation_data and cam.animation_data.action:
                    found_fcurve = False
                    dp = f'constraints["{fp_constraint.name}"].offset_factor'
                    for fcurve in cam.animation_data.action.fcurves:
                        if fcurve.data_path == dp:
                            found_fcurve = True
                            break
                    if found_fcurve:
                        print(f"  > PASSED: {cam_name} offset_factor is animated.")
                    else:
                        print(f"  > FAILED: {cam_name} offset_factor is NOT animated.")
            else:
                print(f"FAILED: Camera {cam_name} FOLLOW_PATH constraint has no target.")
        else:
            print(f"FAILED: Camera {cam_name} missing FOLLOW_PATH constraint.")

if __name__ == "__main__":
    test_camera_rig()
