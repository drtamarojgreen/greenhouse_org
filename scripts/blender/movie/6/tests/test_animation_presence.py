import unittest
import bpy
import os
import sys

# Standardize path injection for movie/6 assets
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

import config
import generate_scene6

class TestAnimationPresence(unittest.TestCase):

    def test_keyframes_assigned(self):
        """Verifies that characters have keyframes on their armatures."""
        # This will run the whole scene generation
        # (Assuming dependencies like assets are mockable or present)
        generate_scene6.generate_full_scene_v6()

        coll = bpy.data.collections.get(config.COLL_ASSETS)
        self.assertIsNotNone(coll)

        found_animated = 0
        for obj in coll.objects:
            if obj.type == 'ARMATURE':
                if obj.animation_data and obj.animation_data.action:
                    found_animated += 1
                    # Verify keyframes exist
                    curves = obj.animation_data.action.fcurves
                    self.assertGreater(len(curves), 0, f"Armature {obj.name} has action but no curves")

        self.assertGreater(found_animated, 2, "Not enough animated characters found")

if __name__ == "__main__":
    unittest.main()
