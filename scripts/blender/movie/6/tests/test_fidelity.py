import unittest
import bpy
import os
import sys

# Standardize path injection for movie/6 assets
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

import config
from assets_v6.plant_humanoid_v6 import create_plant_humanoid_v6

class TestProductionFidelity(unittest.TestCase):

    def setUp(self):
        for obj in bpy.data.objects:
            bpy.data.objects.remove(obj, do_unlink=True)

    def test_facial_prop_visibility(self):
        """Verifies Eyelids and Eyeballs exist and are linked to correct collection."""
        herb = create_plant_humanoid_v6("TestHerb", (0,0,0))

        # Keywords for facial props
        keywords = ["Eye", "Lid", "Lip", "Nose", "Ear"]
        found_props = 0

        coll = bpy.data.collections.get(config.COLL_ASSETS)
        self.assertIsNotNone(coll, f"Collection {config.COLL_ASSETS} missing")

        for obj in coll.objects:
            if any(k in obj.name for k in keywords) and obj.type == 'MESH':
                if "Body" in obj.name: continue
                found_props += 1

                # Check parenting
                self.assertEqual(obj.parent, herb, f"Prop {obj.name} not parented to rig")
                self.assertNotEqual(obj.parent_bone, "", f"Prop {obj.name} has no parent bone")

        self.assertGreater(found_props, 5, "Not enough facial props found")

    def test_foliage_richness(self):
        """Verifies foliage exists with assigned material."""
        herb = create_plant_humanoid_v6("TestRich", (0,0,0))
        mesh = next(c for c in herb.children if c.type == 'MESH' and "Body" in c.name)

        # Check material count
        self.assertGreaterEqual(len(mesh.data.materials), 2, "Body mesh needs at least bark and leaf materials")

        # Check Foliage vertex group
        vg = mesh.vertex_groups.get("Foliage")
        self.assertIsNotNone(vg, "Foliage vertex group missing")

if __name__ == "__main__":
    unittest.main()
