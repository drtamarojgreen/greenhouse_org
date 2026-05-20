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

class TestExtendedActs(unittest.TestCase):
    def setUp(self):
        self.manager = AssetManager()
        self.manager.clear_scene()
        self.director = Director()

    def test_scene_09_environment_switch(self):
        """Verifies that Scene 9 correctly switches to the ForestRoad environment."""
        self.director.apply_extended_scene("scene_configs/scene_07_forest_drive.json")

        # Check if ForestRoad object exists
        forest = bpy.data.objects.get("Env") # Modeler returns obj, we named it Env in director
        self.assertIsNotNone(forest, "Forest environment not loaded")

        # Check camera marker
        markers = bpy.context.scene.timeline_markers
        shot_marker = next((m for m in markers if "Shot_Forest_cam" in m.name), None)
        self.assertIsNotNone(shot_marker, "Forest_cam marker missing")
        self.assertEqual(shot_marker.frame, 4401)

    def test_scene_10_environment_switch(self):
        """Verifies that Scene 10 correctly switches to the MountainBase environment and purges old assets."""
        self.director.apply_extended_scene("scene_configs/scene_05_ascent.json")

        # Check if Mountain object exists
        mountain = bpy.data.objects.get("Env")
        self.assertIsNotNone(mountain, "Mountain environment not loaded")

        # Ensure ForestRoad or Greenhouse Interior objects are GONE
        self.assertIsNone(bpy.data.objects.get("forest_road"))
        self.assertIsNone(bpy.data.objects.get("rack_front_left"))

        # Check camera marker
        markers = bpy.context.scene.timeline_markers
        shot_marker = next((m for m in markers if "Shot_Mountain_cam" in m.name), None)
        self.assertIsNotNone(shot_marker, "Mountain_cam marker missing")
        self.assertEqual(shot_marker.frame, 4651)

if __name__ == "__main__":
    unittest.main()