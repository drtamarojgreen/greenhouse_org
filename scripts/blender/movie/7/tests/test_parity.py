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

class TestMovie7Parity(unittest.TestCase):
    """Ensures Movie 7 output matches qualitative standards using universal logic."""

    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_structural_parity(self):
        """Verifies that the built character has the expected structural complexity."""
        from config import config
        cfg = config.get_character_config("Herbaceous")
        char = CharacterBuilder.create("Herbaceous", cfg)
        char.build(self.manager)

        # Should have mesh + props (Eyes)
        self.assertEqual(len(char.rig.children), 3)

if __name__ == "__main__":
    unittest.main()
