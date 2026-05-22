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

class TestMovie10ExtendedScenes(unittest.TestCase):
    def test_extended_scene_loading(self):
        """Verifies that extended scene JSONs (8, 9, 10) can be parsed and markers added."""
        director = Director()
        extended = mc.get("extended_scenes", [])
        self.assertGreater(len(extended), 0)

        # Test loading one scene
        scene_path = extended[0]
        full_path = os.path.join(M10_ROOT, scene_path)
        self.assertTrue(os.path.exists(full_path))

        # Check markers before and after
        initial_markers = len(bpy.context.scene.timeline_markers)
        director.apply_extended_scene(scene_path)
        self.assertGreater(len(bpy.context.scene.timeline_markers), initial_markers)

if __name__ == "__main__":
    unittest.main()
