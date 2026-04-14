import unittest
import bpy
import os
import sys

# Standardize path injection
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
V6_DIR = os.path.dirname(TEST_DIR)
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

import config

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

            # Check for keyframes (at least start and end/mid)
            action = char.animation_data.action
            self.assertGreater(len(action.fcurves), 0, f"Action for {char.name} has no f-curves")

    def test_specific_tags_applied(self):
        """Verifies specific story-driven animation beats."""
        # Herbaceous talking beat (Frame 1)
        # We check the action name for tags if mapped, or just check movement
        herb = bpy.data.objects.get(config.CHAR_HERBACEOUS)
        self.assertIn("talking", herb.animation_data.action.name.lower() or "")

if __name__ == "__main__":
    unittest.main()
