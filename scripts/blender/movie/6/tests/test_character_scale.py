import unittest
import bpy
import os
import sys
import mathutils

# Standardize path injection for movie/6 assets
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

import config
import asset_manager_v6

class TestCharacterScale(unittest.TestCase):

    def test_baseline_scale(self):
        """Verifies characters maintain their baseline procedural scale."""
        # Purge
        for obj in bpy.data.objects:
            bpy.data.objects.remove(obj, do_unlink=True)

        am = asset_manager_v6.SylvanEnsembleManager()
        am.link_protagonists()

        herb_rig = bpy.data.objects.get(config.CHAR_HERBACEOUS)
        arbor_rig = bpy.data.objects.get(config.CHAR_ARBOR)

        for rig in [herb_rig, arbor_rig]:
            self.assertAlmostEqual(rig.scale.x, 1.0, delta=0.01)
            self.assertAlmostEqual(rig.scale.y, 1.0, delta=0.01)
            self.assertAlmostEqual(rig.scale.z, 1.0, delta=0.01)

if __name__ == "__main__":
    unittest.main()
