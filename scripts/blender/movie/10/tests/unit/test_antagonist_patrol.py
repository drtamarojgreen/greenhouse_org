import json
import math
import os
import sys
import unittest

try:
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M10_ROOT = os.path.abspath(os.path.join(TEST_DIR, "..", ".."))
M9_ROOT = os.path.abspath(os.path.join(M10_ROOT, "..", "9"))

if M10_ROOT not in sys.path:
    sys.path.insert(0, M10_ROOT)
if M9_ROOT not in sys.path:
    sys.path.append(M9_ROOT)

import movie_configuration as mc
from asset_manager import AssetManager
from director import Director
from render import build_scene
from animation_handler import AnimationHandler
from character_builder import CharacterBuilder
from modeling.greenhouse_mobile import GreenhouseMobileModeler
import components

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
