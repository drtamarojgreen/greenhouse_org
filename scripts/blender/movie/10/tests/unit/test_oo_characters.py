import unittest
import bpy
import os
import sys

# Standard Path setup for tests
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M10_ROOT = os.path.dirname(TEST_DIR)

if M10_ROOT not in sys.path:
    sys.path.insert(0, M10_ROOT)
import movie_configuration as mc

from asset_manager import AssetManager
from character_builder import CharacterBuilder
import components

class TestMovie10OOCharacters(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_character_oo_composition(self):
        """Verifies composition and component resolution."""
        cfg = mc.get_character_config("Herbaceous")
        char = CharacterBuilder.create("Herbaceous", cfg)
        char.build(self.manager)

        self.assertIsNotNone(char.body)
        self.assertIsNotNone(char.rig)

if __name__ == "__main__":
    unittest.main()
