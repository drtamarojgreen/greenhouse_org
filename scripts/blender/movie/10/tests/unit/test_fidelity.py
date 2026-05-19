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

class TestMovie10Fidelity(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_mesh_smoothness(self):
        """Verifies that all generated faces are set to smooth."""
        cfg = mc.get_character_config("Herbaceous_HF")
        char = CharacterBuilder.create("Herbaceous_HF", cfg)
        char.build(self.manager)

        for poly in char.body.data.polygons:
            self.assertTrue(poly.use_smooth)

    def test_prop_attachment_fidelity(self):
        """Verifies that props are correctly parented to bones."""
        cfg = mc.get_character_config("Herbaceous_HF")
        char = CharacterBuilder.create("Herbaceous_HF", cfg)
        char.build(self.manager)

        eyes = [o for o in char.rig.children if "Eye" in o.name]
        for eye in eyes:
            self.assertEqual(eye.parent_type, 'BONE')
            # Allow sub-bones of Head (Eye.L, Eye.R etc)
            self.assertTrue("Head" in eye.parent_bone or "Eye" in eye.parent_bone)

if __name__ == "__main__":
    unittest.main()
