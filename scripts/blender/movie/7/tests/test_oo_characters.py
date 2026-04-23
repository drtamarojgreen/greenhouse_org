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

class TestMovie7OOCharacters(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_character_oo_composition(self):
        """Verifies composition and component resolution."""
        from config import config
        cfg = config.get_character_config("Herbaceous")
        char = CharacterBuilder.create("Herbaceous", cfg)

        self.assertIsNotNone(char.modeler)
        self.assertIsNotNone(char.rigger)
        self.assertIsNotNone(char.shader)
        self.assertIsNotNone(char.animator)

if __name__ == "__main__":
    unittest.main()
