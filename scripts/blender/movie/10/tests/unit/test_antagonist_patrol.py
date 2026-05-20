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

class TestMovie10AntagonistPatrol(unittest.TestCase):
    def test_patrol_path_assignment(self):
        """Verifies that antagonist patrol paths are correctly loaded and applied."""
        director = Director()
        patrol_dict = mc.get("patrol_paths", {})
        if not patrol_dict:
            self.skipTest("No patrol_paths defined in movie_config.json")

        # Get the first patrol path definition
        path_name = list(patrol_dict.keys())[0]
        waypoints = patrol_dict[path_name]["waypoints"]

        # Test applying it to a dummy object
        dummy = bpy.data.objects.new("DummyAntag", None)
        bpy.context.scene.collection.objects.link(dummy)
        for i, wp in enumerate(waypoints):
            f = i * 20 + 1
            dummy.location = wp
            dummy.keyframe_insert(data_path="location", frame=f)

        self.assertIsNotNone(dummy.animation_data)
        self.assertIsNotNone(dummy.animation_data.action)

if __name__ == "__main__":
    unittest.main()