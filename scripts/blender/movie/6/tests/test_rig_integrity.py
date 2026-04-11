import unittest
import bpy
import os
import sys

# Ensure v6 paths are prioritized
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)
ASSETS_V6_DIR = os.path.join(V6_DIR, "assets_v6")
if ASSETS_V6_DIR not in sys.path: sys.path.insert(0, ASSETS_V6_DIR)

import config
import plant_humanoid_v6

class TestRigIntegrity(unittest.TestCase):
    def setUp(self):
        # Clear scene
        for obj in bpy.data.objects:
            bpy.data.objects.remove(obj, do_unlink=True)

    def test_vertex_group_coverage(self):
        """Verify all bones have corresponding vertex groups with weights."""
        name = "TestChar"
        arm_obj = plant_humanoid_v6.create_plant_humanoid_v6(name, (0,0,0))
        mesh_obj = bpy.data.objects.get(f"{name}_Body")

        self.assertIsNotNone(mesh_obj, "Body mesh not found")

        for bone in arm_obj.data.bones:
            # Skip control bones and structural facial bones that might not have weights
            if "Ctrl" in bone.name or any(facial in bone.name for facial in ["Eye.", "Pupil.", "Eyelid.", "Nose.", "Lip.", "Chin", "Ear."]):
                continue

            vg = mesh_obj.vertex_groups.get(bone.name)
            self.assertIsNotNone(vg, f"Vertex group missing for bone: {bone.name}")

            # Check if any vertex has weight > 0 for this group
            has_weight = False
            for v in mesh_obj.data.vertices:
                for g in v.groups:
                    if g.group == vg.index and g.weight > 0:
                        has_weight = True
                        break
                if has_weight: break

            self.assertTrue(has_weight, f"No weights assigned for vertex group: {bone.name}")

if __name__ == '__main__':
    unittest.main()
