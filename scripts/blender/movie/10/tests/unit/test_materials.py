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

class TestMovie10Materials(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_universal_material_assignment(self):
        """Verifies that the UniversalShader assigns the expected material types."""
        cfg = mc.get_character_config("Herbaceous")
        char = CharacterBuilder.create("Herbaceous", cfg)
        char.build(self.manager)

        # Check that mesh data has materials
        self.assertGreater(len(char.body.data.materials), 0)
        primary_found = any("primary" in m.name for m in char.body.data.materials if m)
        self.assertTrue(primary_found)

if __name__ == "__main__":
    unittest.main()
