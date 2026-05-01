import unittest
import bpy
import os
import sys

# Standard Path setup for tests
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M9_ROOT = os.path.dirname(TEST_DIR)

if M9_ROOT not in sys.path:
    sys.path.insert(0, M9_ROOT)

from asset_manager import AssetManager
from character_builder import CharacterBuilder
import components

class TestMovie9V5Parity(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_vertex_group_naming_parity(self):
        """Verifies that vertex groups match bone names (standard for V5/V6 parity)."""
        from config import config
        cfg = config.get_character_config("Herbaceous")
        char = CharacterBuilder.create("Herbaceous", cfg)
        char.build(self.manager)

        vg_names = {vg.name for vg in char.mesh.vertex_groups}
        for bone in char.rig.data.bones:
            if bone.use_deform:
                self.assertIn(bone.name, vg_names)

if __name__ == "__main__":
    unittest.main()
