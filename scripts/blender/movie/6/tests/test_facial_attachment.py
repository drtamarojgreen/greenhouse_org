import unittest
import bpy
import os
import sys

# Standardize path injection for movie/6 assets
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

import config
from assets_v6.plant_humanoid_v6 import create_plant_humanoid_v6

class TestFacialAttachment(unittest.TestCase):

    def test_facial_parenting(self):
        """Verifies facial props are parented to bones, not origin."""
        # Purge
        for obj in bpy.data.objects:
            bpy.data.objects.remove(obj, do_unlink=True)

        herb = create_plant_humanoid_v6("TestHerb", (0,0,0))

        # Facial props are typically children of the rig or mesh,
        # but specifically they should have bone parenting.
        facial_keywords = ["Eye", "Iris", "Sclera", "Nose", "Lip", "Pupil"]

        found_props = 0
        for obj in bpy.data.objects:
            if any(k in obj.name for k in facial_keywords) and obj.type == 'MESH':
                if obj == next(c for c in herb.children if c.type == 'MESH'): continue

                found_props += 1
                self.assertEqual(obj.parent, herb, f"Prop {obj.name} not parented to rig")
                self.assertNotEqual(obj.parent_bone, "", f"Prop {obj.name} has no parent bone")

                # Verify not stuck at origin
                bpy.context.view_layer.update()
                world_loc = obj.matrix_world.translation
                self.assertGreater(world_loc.length, 0.1, f"Prop {obj.name} appears stuck at origin")

        self.assertGreater(found_props, 0, "No facial props found to test")

if __name__ == "__main__":
    unittest.main()
