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
if M10_ROOT not in sys.path: sys.path.insert(0, M10_ROOT)


class TestMovie10CameraAudit(unittest.TestCase):
    def setUp(self):
        self.director = Director()
        self.director.setup_cinematics()

    def test_v10_cameras_exist(self):
        """Verifies that all standard V10 cameras are created."""
        expected = ["Wide", "Ots1", "Ots2", "Antag1", "Antag2", "Antag3", "Antag4", "Exterior"]
        for cam in expected:
            self.assertIn(cam, bpy.data.objects, f"Camera '{cam}' missing from scene.")

    def test_v10_camera_lenses(self):
        """Verifies that the cameras have correct focal lengths."""
        self.assertEqual(bpy.data.cameras["Wide"].lens, 35.0)
        self.assertEqual(bpy.data.cameras["Ots1"].lens, 50.0)
        self.assertEqual(bpy.data.cameras["Antag1"].lens, 135.0)

    def test_v10_camera_tracking(self):
        """Verifies that tracking constraints are assigned."""
        for cam in ["Wide", "Ots1"]:
            obj = bpy.data.objects[cam]
            self.assertTrue(any(c.type == 'TRACK_TO' for c in obj.constraints))

if __name__ == "__main__":
    unittest.main()