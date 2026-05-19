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

class TestMovie10Parity(unittest.TestCase):
    """Ensures Movie 10 output matches qualitative standards using universal logic."""

    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_structural_parity(self):
        """Verifies that the built character has the expected structural complexity."""
        cfg = mc.get_character_config("Herbaceous_HF")
        char = CharacterBuilder.create("Herbaceous_HF", cfg)
        char.build(self.manager)

        # Should have at least mesh + props (Eyes)
        self.assertGreaterEqual(len(char.rig.children), 3)

if __name__ == "__main__":
    unittest.main()
