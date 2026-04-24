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

class TestMovie7AnimationPresence(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_procedural_animation_presence(self):
        """Verifies that the animator correctly targets bones from config."""
        from config import config
        cfg = config.get_character_config("Herbaceous")
        char = CharacterBuilder.create("Herbaceous", cfg)
        char.build(self.manager)

        char.animate("talking", 1, {"duration": 10})

        self.assertIsNotNone(char.rig.animation_data)
        self.assertIsNotNone(char.rig.animation_data.action)

if __name__ == "__main__":
    unittest.main()
