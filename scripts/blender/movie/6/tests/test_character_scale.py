import bpy
import unittest
import mathutils

import config

class TestCharacterScale(unittest.TestCase):
    def test_world_height(self):
        """Verifies that characters match their target heights in world space."""
        target_heights = config.TARGET_HEIGHTS

        for name, target in target_heights.items():
            obj = bpy.data.objects.get(f"{name}_Body") or bpy.data.objects.get(name)
            if not obj: continue

            bbox = [obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box]
            z_coords = [v.z for v in bbox]
            height = max(z_coords) - min(z_coords)

            self.assertAlmostEqual(height, target, delta=0.2, msg=f"{name} height {height} does not match target {target}")

if __name__ == '__main__':
    unittest.main()
