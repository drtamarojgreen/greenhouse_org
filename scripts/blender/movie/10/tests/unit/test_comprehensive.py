import unittest
try: import bpy
except ImportError: bpy = None
import os
import sys

# Standard Path setup for tests
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M10_ROOT = os.path.dirname(os.path.dirname(TEST_DIR))

if M10_ROOT not in sys.path:
    sys.path.insert(0, M10_ROOT)
try:
    import movie_configuration as mc
except ImportError:
    from . import movie_configuration as mc

try:
    try:
    from asset_manager import
except ImportError:
    from ..asset_manager import AssetManager
except ImportError:
    from .asset_manager import AssetManager
try:
    try:
    from character_builder import
except ImportError:
    from ..character_builder import CharacterBuilder
except ImportError:
    from .character_builder import CharacterBuilder
import components

class TestMovie10Comprehensive(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_full_production_cycle(self):
        """Verifies build, pose, and animate sequence."""
        cfg = mc.get_character_config("Herbaceous_HF")
        char = CharacterBuilder.create("Herbaceous_HF", cfg)
        char.build(self.manager)
        char.apply_pose()
        char.animate("idle", 1)

        self.assertIsNotNone(char.rig.animation_data)
        self.assertAlmostEqual(char.rig.location.x, cfg["default_pos"][0], places=4)

    def test_multiple_characters(self):
        """Verifies that building multiple characters doesn't cross-pollinate data."""
        h_cfg = mc.get_character_config("Herbaceous_HF")
        a_cfg = mc.get_character_config("Arbor_HF")

        h_char = CharacterBuilder.create("Herbaceous_HF", h_cfg)
        a_char = CharacterBuilder.create("Arbor_HF", a_cfg)

        h_char.build(self.manager)
        a_char.build(self.manager)

        self.assertNotEqual(h_char.body.name, a_char.body.name)
        self.assertNotEqual(h_char.rig.name, a_char.rig.name)

if __name__ == "__main__":
    unittest.main()
