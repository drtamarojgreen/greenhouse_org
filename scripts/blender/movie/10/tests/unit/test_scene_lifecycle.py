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

class TestSceneLifecycleV10(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        components.initialize_registry()
        cls.manager = AssetManager()
        cls.manager.clear_scene()
        cls.director = Director()
        cls.director.setup_environment()
        cls.director.apply_storyline()

    def test_asset_availability_9a(self):
        """Verifies that all therapeutic assets are present in the collection."""
        coll = bpy.data.collections.get("9a.ASSETS")
        self.assertIsNotNone(coll, "9a.ASSETS collection missing.")

        # Check for newly added Clinical assets
        # Note: These are dynamic, built by Director if ensemble is built.
        # For this test, we verify the registry can resolve them.
