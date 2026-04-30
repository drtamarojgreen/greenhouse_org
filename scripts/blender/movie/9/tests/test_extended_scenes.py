import unittest
import bpy
import os
import sys

# Standard Path setup for tests
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M9_ROOT = os.path.dirname(TEST_DIR)

if M9_ROOT not in sys.path:
    sys.path.insert(0, M9_ROOT)

from director import Director
import config

class TestMovie9ExtendedScenes(unittest.TestCase):
    def test_extended_scene_loading(self):
        """Verifies that extended scene JSONs (8, 9, 10) can be parsed and markers added."""
        director = Director()
        extended = config.config.get("extended_scenes", [])
        self.assertGreater(len(extended), 0)

        # Test loading one scene
        scene_path = extended[0]
        full_path = os.path.join(M9_ROOT, scene_path)
        self.assertTrue(os.path.exists(full_path))

        # Check markers before and after
        initial_markers = len(bpy.context.scene.timeline_markers)
        director.apply_extended_scene(scene_path)
        self.assertGreater(len(bpy.context.scene.timeline_markers), initial_markers)

if __name__ == "__main__":
    unittest.main()
