import unittest
import bpy
import os
import sys

# Standardize path injection for movie/6 assets
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

import config
from assets_v6.plant_humanoid_v6 import create_plant_humanoid_v6

class TestRigIntegrity(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Purge
        for obj in bpy.data.objects:
            bpy.data.objects.remove(obj, do_unlink=True)
        cls.herb = create_plant_humanoid_v6("TestHerb", (0,0,0))
        cls.mesh = next(c for c in cls.herb.children if c.type == 'MESH')

    def test_bone_vertex_group_coverage(self):
        """Verifies every bone has a corresponding vertex group with weights."""
        armature = self.herb.data
        vg_names = [vg.name for vg in self.mesh.vertex_groups]

        # We only care about deformation bones (exclude control bones if any were added)
        for bone in armature.bones:
            if "Ctrl" in bone.name: continue

            self.assertIn(bone.name, vg_names, f"Bone {bone.name} has no corresponding vertex group")

            # Check if any vertices are assigned to this group
            vg = self.mesh.vertex_groups[bone.name]
            has_weights = False
            for v in self.mesh.data.vertices:
                for g in v.groups:
                    if g.group == vg.index and g.weight > 0.001:
                        has_weights = True
                        break
                if has_weights: break

            self.assertTrue(has_weights, f"Vertex group {bone.name} has no weighted vertices")

if __name__ == "__main__":
    unittest.main()
