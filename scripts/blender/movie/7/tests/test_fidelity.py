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

class TestMovie7Fidelity(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_mesh_smoothness(self):
        """Verifies that all generated faces are set to smooth."""
        from config import config
        cfg = config.get_character_config("Herbaceous")
        char = CharacterBuilder.create("Herbaceous", cfg)
        char.build(self.manager)

        for poly in char.mesh.data.polygons:
            self.assertTrue(poly.use_smooth)

    def test_prop_attachment_fidelity(self):
        """Verifies that props are correctly parented to bones."""
        from config import config
        cfg = config.get_character_config("Herbaceous")
        char = CharacterBuilder.create("Herbaceous", cfg)
        char.build(self.manager)

        eyes = [o for o in char.rig.children if "Eye" in o.name]
        for eye in eyes:
            self.assertEqual(eye.parent_type, 'BONE')
            self.assertEqual("Head", eye.parent_bone)

if __name__ == "__main__":
    unittest.main()
