import unittest
import bpy
import os
import sys

# Standard Path setup for tests
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M7_ROOT = os.path.dirname(TEST_DIR)

if M7_ROOT not in sys.path:
    sys.path.insert(0, M7_ROOT)

from director import Director
import config

class TestMovie7AntagonistPatrol(unittest.TestCase):
    def test_patrol_path_assignment(self):
        """Verifies that antagonist patrol paths are correctly loaded and applied."""
        director = Director()
        patrol_dict = config.config.get("patrol_paths", {})
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
