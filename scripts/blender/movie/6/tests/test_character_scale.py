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

    def test_height_normalization(self):
        """Verifies characters are scaled to target heights."""
        # Purge
        for obj in bpy.data.objects:
            bpy.data.objects.remove(obj, do_unlink=True)

        am = asset_manager_v6.SylvanEnsembleManager()
        herb = am.link_protagonists() # This returns the last created, but we'll find by name

        herb_rig = bpy.data.objects.get(config.CHAR_HERBACEOUS)
        arbor_rig = bpy.data.objects.get(config.CHAR_ARBOR)

        for rig, target in [(herb_rig, config.CHAR_HERBACEOUS_HEIGHT),
                            (arbor_rig, config.CHAR_ARBOR_HEIGHT)]:

            meshes = [c for c in rig.children if c.type == 'MESH']
            min_z, max_z = float('inf'), float('-inf')
            for m in meshes:
                for corner in m.bound_box:
                    world_corner = m.matrix_world @ mathutils.Vector(corner)
                    min_z = min(min_z, world_corner.z)
                    max_z = max(max_z, world_corner.z)

            height = max_z - min_z
            self.assertAlmostEqual(height, target, delta=0.1, msg=f"Character {rig.name} height mismatch")

if __name__ == "__main__":
    unittest.main()
