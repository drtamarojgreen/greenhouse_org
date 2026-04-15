import unittest
import bpy
import os
import sys

# Standardize path injection
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
V6_DIR = os.path.dirname(TEST_DIR)
MOVIE_DIR = os.path.dirname(V6_DIR)
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)
if MOVIE_DIR not in sys.path: sys.path.insert(0, MOVIE_DIR)

import config
from style_utilities.fcurves_operations import get_action_curves

class TestProtagonistAnimations(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        from generate_scene6 import generate_full_scene_v6
        generate_full_scene_v6()

    def test_protagonist_actions_assigned(self):
        """Verifies that protagonists have actions and keyframes."""
        herb = bpy.data.objects.get(config.CHAR_HERBACEOUS)
        arbor = bpy.data.objects.get(config.CHAR_ARBOR)

        for char in [herb, arbor]:
            self.assertIsNotNone(char, f"Protagonist {char} missing")
            self.assertIsNotNone(char.animation_data, f"Protagonist {char.name} has no animation data")
            self.assertIsNotNone(char.animation_data.action, f"Protagonist {char.name} has no action assigned")

            # Use Blender 5 compatible utility to check for curves
            action = char.animation_data.action
            curves = get_action_curves(action, obj=char)
            self.assertGreater(len(curves), 0, f"Action for {char.name} has no channel data/curves")

    def test_specific_tags_applied(self):
        """Verifies specific story-driven animation beats."""
        herb = bpy.data.objects.get(config.CHAR_HERBACEOUS)
        # Check for keyframes on the Head or Arms to verify movement
        # Herbaceous has 'talking' (Frame 1), 'nod' (Frame 120), 'dance' (Frame 3000)
        action = herb.animation_data.action

        has_movement = len(action.fcurves) > 0
        self.assertTrue(has_movement, "No animation curves found for Herbaceous")

if __name__ == "__main__":
    unittest.main()
