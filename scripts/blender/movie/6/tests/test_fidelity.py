import unittest
import bpy
import os
import sys

# Standardize path injection for movie/6 assets
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

import config
from assets_v6.plant_humanoid_v6 import create_plant_humanoid_v6

class TestFidelity(unittest.TestCase):

    def setUp(self):
        for obj in bpy.data.objects:
            bpy.data.objects.remove(obj, do_unlink=True)

    def test_foliage_generation(self):
        """Verifies leaves are generated and assigned to Foliage group."""
        herb = create_plant_humanoid_v6("TestHerb", (0,0,0))
        mesh = next(c for c in herb.children if c.type == 'MESH')

        self.assertIn("Foliage", mesh.vertex_groups, "Foliage vertex group missing")

        vg = mesh.vertex_groups["Foliage"]
        has_foliage_verts = False
        for v in mesh.data.vertices:
            for g in v.groups:
                if g.group == vg.index and g.weight > 0.1:
                    has_foliage_verts = True
                    break
            if has_foliage_verts: break

        self.assertTrue(has_foliage_verts, "No vertices assigned to Foliage group")

    def test_rig_parity_v5(self):
        """Verifies rig contains finger and toe bones for parity with v5."""
        herb = create_plant_humanoid_v6("TestHerb", (0,0,0))
        bone_names = [b.name for b in herb.data.bones]

        self.assertIn("Finger.1.L", bone_names)
        self.assertIn("Toe.1.R", bone_names)
        self.assertGreater(len(bone_names), 30, "Rig is too simple compared to v5")

if __name__ == "__main__":
    unittest.main()
