import unittest
try: import bpy
except ImportError: bpy = None
import os
import sys

# Add script directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    import movie_configuration as mc
except ImportError:
    from . import movie_configuration as mc

try:
    try:
    from director import
except ImportError:
    from ..director import Director
except ImportError:
    from .director import Director
try:
    try:
    from asset_manager import
except ImportError:
    from ..asset_manager import AssetManager
except ImportError:
    from .asset_manager import AssetManager

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
