import unittest
import bpy
import os
import sys
import mathutils

V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)
ASSETS_V6_DIR = os.path.join(V6_DIR, "assets_v6")
if ASSETS_V6_DIR not in sys.path: sys.path.insert(0, ASSETS_V6_DIR)

import config
import asset_manager_v6
import plant_humanoid_v6

class TestCharacterScale(unittest.TestCase):
    def setUp(self):
        for obj in bpy.data.objects:
            bpy.data.objects.remove(obj, do_unlink=True)

    def test_height_normalization(self):
        """Verify characters meet target height requirements."""
        am = asset_manager_v6.SylvanEnsembleManager()

        # Test procedural character
        name = config.CHAR_HERBACEOUS
        target_h = config.TARGET_HEIGHTS[name]
        arm = plant_humanoid_v6.create_plant_humanoid_v6(name, (0,0,0))
        mesh = bpy.data.objects.get(f"{name}_Body")

        # Intentionally distort scale
        mesh.scale = (2.0, 2.0, 2.0)
        am.normalize_character_scale(mesh, target_h)

        # Calculate resulting height
        bbox = [mesh.matrix_world @ mathutils.Vector(corner) for corner in mesh.bound_box]
        z_coords = [v.z for v in bbox]
        final_height = max(z_coords) - min(z_coords)

        self.assertAlmostEqual(final_height, target_h, places=2)

if __name__ == '__main__':
    unittest.main()
