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

class TestMovie7CharacterScale(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_procedural_scaling(self):
        """Verifies that the AssetManager correctly scales a character based on target_height."""
        from config import config
        cfg = config.get_character_config("Herbaceous").copy()
        cfg["target_height"] = 5.0
        char = CharacterBuilder.create("ScaledChar", cfg)
        char.build(self.manager)

        metrics = self.manager._get_metrics(char.rig)
        self.assertAlmostEqual(metrics['height'], 5.0, places=1)

if __name__ == "__main__":
    unittest.main()
