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

class TestGenericPipeline(unittest.TestCase):
    """Verifies that the pipeline is strictly data-driven and modular."""

    def setUp(self):
        # Reset scene
        bpy.ops.wm.read_factory_settings(use_empty=True)
        self.director = Director()

    def test_generic_scene_loading(self):
        """Verifies Director can load a scene JSON and initialize entities."""
        # Create a mock scene JSON
        mock_scene = {
            "id": "test_scene",
            "entities": [
                {
                    "id": "TestEntity",
                    "type": "Plant",
                    "pos": [5, 5, 0],
                    "animations": [{"tag": "idle", "start": 1, "duration": 100}]
                }
            ],
            "environment": {"type": "exterior"}
        }
        scene_dir = os.path.join(M10_ROOT, "scene_configs")
        os.makedirs(scene_dir, exist_ok=True)
        mock_path = os.path.join(scene_dir, "test_mock.json")
        with open(mock_path, "w") as f: json.dump(mock_scene, f)

        # Load and verify
        self.assertTrue(self.director.load_scene("test_mock"))
        self.assertEqual(self.director.scene_cfg["id"], "test_scene")

        # Cleanup mock
        os.remove(mock_path)

    def test_camera_controls_modular(self):
        """Verifies camera setup uses the new controls package."""
        from camera.controls import CameraControls
        self.assertIsInstance(self.director.camera_controls, CameraControls)
        # Should NOT find hardcoded setup logic in director.py anymore

    def test_animation_modular_dispatch(self):
        """Verifies AnimationHandler dispatches to modular sub-packages."""
        handler = AnimationHandler()
        # Verify it has the apply_animation method but no local _animate methods
        self.assertTrue(hasattr(handler, "apply_animation"))
        self.assertFalse(hasattr(handler, "_animate_talking"))
        self.assertFalse(hasattr(handler, "_animate_walk"))

    def test_zero_hardcoding_registry(self):
        """Verifies that models are loaded via registry, not hardcoded imports."""
