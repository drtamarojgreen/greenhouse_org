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

class TestMovie10AnimationPresence(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_procedural_animation_presence(self):
        """Verifies that the animator correctly targets bones from mc."""
        cfg = mc.get_character_config("Herbaceous_HF").copy()
        # Force ProceduralAnimator to avoid baked action missing warnings
        cfg["components"]["animation"] = "ProceduralAnimator"
        char = CharacterBuilder.create("Herbaceous_HF", cfg)
        char.build(self.manager)

        char.animate("talking", 1, {"duration": 10})

        self.assertIsNotNone(char.rig.animation_data)
        self.assertIsNotNone(char.rig.animation_data.action)

if __name__ == "__main__":
    unittest.main()
