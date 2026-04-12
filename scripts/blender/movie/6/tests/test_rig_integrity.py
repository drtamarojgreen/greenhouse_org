import bpy
import os
import sys

# Ensure v6 is in path
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.append(V6_DIR)

import config

def test_rig_integrity():
    print("\n--- TEST: Rig Integrity ---")

    # Identify protagonist bodies
    herb_body = bpy.data.objects.get(config.CHAR_HERBACEOUS + ".Body")
    arbor_body = bpy.data.objects.get(config.CHAR_ARBOR + ".Body")

    for body in [herb_body, arbor_body]:
        if not body:
            print(f"FAILED: Body not found for character.")
            continue

        armature = body.parent if body.parent and body.parent.type == 'ARMATURE' else None
        if not armature:
            print(f"FAILED: No armature found for {body.name}")
            continue

        print(f"Checking {body.name} (Rig: {armature.name})...")

        mandatory_bones = [
            "Torso", "Neck", "Head",
            "Arm.L", "Elbow.L",
            "Arm.R", "Elbow.R",
            "Thigh.L", "Knee.L",
            "Thigh.R", "Knee.R",
            "Eyelid.L", "Eyelid.R"
        ]

        missing_vgs = []
        for bname in mandatory_bones:
            if bname not in body.vertex_groups:
                missing_vgs.append(bname)

        if missing_vgs:
            print(f"FAILED: Missing Vertex Groups: {missing_vgs}")
        else:
            print(f"PASSED: All mandatory vertex groups present on {body.name}")

        # Foliage check
        if "Foliage" in body.vertex_groups:
            print(f"PASSED: Foliage vertex group present on {body.name}")
        else:
            print(f"FAILED: Missing Foliage vertex group on {body.name}")

if __name__ == "__main__":
    test_rig_integrity()
