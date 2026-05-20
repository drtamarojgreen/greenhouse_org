try:
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None

    import bpy
    import bmesh
    import mathutils
    bpy = None
    bmesh = None
    mathutils = None
import unittest
import bpy
import os
import sys

# Standard Path setup for tests
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M10_ROOT = os.path.abspath(os.path.join(TEST_DIR, "..", ".."))

if M10_ROOT not in sys.path:
    sys.path.insert(0, M10_ROOT)
import movie_configuration as mc
    from asset_manager import AssetManager
    from director import Director
    from render import build_scene
    from animation_handler import AnimationHandler
    from character_builder import CharacterBuilder
    import components
except ImportError:
    from ..asset_manager import AssetManager
    from ..director import Director
    from ..render import build_scene
    from ..animation_handler import AnimationHandler
    from ..character_builder import CharacterBuilder
    from .. import components
        AssetManager = None
        Director = None
        build_scene = None
        AnimationHandler = None
        CharacterBuilder = None



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

        if char.rig and char.rig.animation_data:
            self.assertIsNotNone(char.rig.animation_data.action)

if __name__ == "__main__":
    unittest.main()