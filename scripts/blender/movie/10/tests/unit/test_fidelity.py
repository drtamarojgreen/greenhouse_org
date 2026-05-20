try:
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None

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
    import bpy
    import bmesh
    import mathutils
    bpy = None
    bmesh = None
    mathutils = None
        AssetManager = None
        Director = None
        build_scene = None
        AnimationHandler = None
        CharacterBuilder = None

import unittest

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