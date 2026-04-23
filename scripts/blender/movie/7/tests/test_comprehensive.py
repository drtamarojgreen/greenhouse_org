import unittest
import bpy
import os
import sys

# Standard Path setup for tests
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M7_ROOT = os.path.dirname(TEST_DIR)

if M7_ROOT not in sys.path:
    sys.path.insert(0, M7_ROOT)

from asset_manager import AssetManager
from character_builder import CharacterBuilder
import components

class TestMovie7Comprehensive(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_full_production_cycle(self):
        """Verifies build, pose, and animate sequence."""
        from config import config
        cfg = config.get_character_config("Herbaceous")
        char = CharacterBuilder.create("Herbaceous", cfg)
        char.build(self.manager)
        char.apply_pose()
        char.animate("idle", 1)

        self.assertIsNotNone(char.rig.animation_data)
        self.assertEqual(char.rig.location.x, cfg["default_pos"][0])

    def test_multiple_characters(self):
        """Verifies that building multiple characters doesn't cross-pollinate data."""
        from config import config
        h_cfg = config.get_character_config("Herbaceous")
        a_cfg = config.get_character_config("Arbor")

        h_char = CharacterBuilder.create("Herbaceous", h_cfg)
        a_char = CharacterBuilder.create("Arbor", a_cfg)

        h_char.build(self.manager)
        a_char.build(self.manager)

        self.assertNotEqual(h_char.mesh.name, a_char.mesh.name)
        self.assertNotEqual(h_char.rig.name, a_char.rig.name)

if __name__ == "__main__":
    unittest.main()
