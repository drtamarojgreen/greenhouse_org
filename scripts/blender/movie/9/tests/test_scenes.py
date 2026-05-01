import unittest
import bpy
import os
import json
import sys

M9_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M9_ROOT not in sys.path: sys.path.insert(0, M9_ROOT)

from director import Director

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
        scene_dir = os.path.join(M9_ROOT, "scene_configs")
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
        from animation_handler import AnimationHandler
        handler = AnimationHandler()
        # Verify it has the apply_animation method but no local _animate methods
        self.assertTrue(hasattr(handler, "apply_animation"))
        self.assertFalse(hasattr(handler, "_animate_talking"))
        self.assertFalse(hasattr(handler, "_animate_walk"))

    def test_zero_hardcoding_registry(self):
        """Verifies that models are loaded via registry, not hardcoded imports."""
        from registry import registry
        self.assertIsNotNone(registry.get_modeling("PlantModeler"))
        self.assertIsNotNone(registry.get_modeling("GreenhouseMobileModeler"))

if __name__ == "__main__":
    unittest.main()
