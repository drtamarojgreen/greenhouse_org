import unittest
import bpy
import os
import sys

# Add script directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from director import Director
from asset_manager import AssetManager

class TestExtendedActs(unittest.TestCase):
    def setUp(self):
        self.manager = AssetManager()
        self.manager.clear_scene()
        self.director = Director()

    def test_scene_09_environment_switch(self):
        """Verifies that Scene 9 correctly switches to the ForestRoad environment."""
        self.director.apply_extended_scene("scene_configs/scene_09_forest_drive.json")
        
        # Check if ForestRoad object exists
        forest = bpy.data.objects.get("Env") # Modeler returns obj, we named it Env in director
        self.assertIsNotNone(forest, "Forest environment not loaded")
        
        # Check camera marker
        markers = bpy.context.scene.timeline_markers
        shot_marker = next((m for m in markers if "Shot_ForestCam" in m.name), None)
        self.assertIsNotNone(shot_marker, "ForestCam marker missing")
        self.assertEqual(shot_marker.frame, 4401)

    def test_scene_10_environment_switch(self):
        """Verifies that Scene 10 correctly switches to the MountainBase environment and purges old assets."""
        self.director.apply_extended_scene("scene_configs/scene_10_mountain_ascent.json")
        
        # Check if Mountain object exists
        mountain = bpy.data.objects.get("Env")
        self.assertIsNotNone(mountain, "Mountain environment not loaded")
        
        # Ensure ForestRoad or Greenhouse Interior objects are GONE
        self.assertIsNone(bpy.data.objects.get("forest_road"))
        self.assertIsNone(bpy.data.objects.get("rack_front_left"))
        
        # Check camera marker
        markers = bpy.context.scene.timeline_markers
        shot_marker = next((m for m in markers if "Shot_MountainCam" in m.name), None)
        self.assertIsNotNone(shot_marker, "MountainCam marker missing")
        self.assertEqual(shot_marker.frame, 4651)

if __name__ == "__main__":
    unittest.main()
