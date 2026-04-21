import unittest
import bpy
import os
import sys
import math

# Ensure Movie 7 is in path
M7_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_DIR not in sys.path:
    sys.path.append(M7_DIR)

from asset_manager import AssetManager
from character_builder import CharacterBuilder
from animation_handler import AnimationHandler

class TestMovie7Robustness(unittest.TestCase):

    def setUp(self):
        self.manager = AssetManager()
        self.manager.clear_scene()
        self.animator = AnimationHandler()

    def test_normalization_scaling(self):
        """Verifies that normalization correctly scales a character."""
        cfg = {
            "id": "RobustChar",
            "type": "DYNAMIC",
            "components": {
                "modeling": "PlantModeler",
                "rigging": "PlantRigger",
                "shading": "PlantShader",
                "animation": "PlantAnimator"
            },
            "parameters": {"dimensions": {"torso_h": 1.5, "head_r": 0.4, "neck_h": 0.2}, "foliage": {"density": 10}},
            "target_height": 5.0
        }
        char = CharacterBuilder.create("RobustChar", cfg)
        char.build(self.manager)

        # Check height using AssetManager metrics
        metrics = self.manager._get_metrics(char.rig)
        self.assertAlmostEqual(metrics['height'], 5.0, places=1)
        self.assertAlmostEqual(metrics['ground_z'], 0.0, places=2)

    def test_procedural_animation(self):
        """Verifies that procedural animation generates keyframes."""
        cfg = {
            "id": "AnimChar",
            "type": "DYNAMIC",
            "components": {
                "modeling": "PlantModeler",
                "rigging": "PlantRigger",
                "shading": "PlantShader",
                "animation": "PlantAnimator"
            },
            "parameters": {"dimensions": {"torso_h": 1.5, "head_r": 0.4, "neck_h": 0.2}}
        }
        char = CharacterBuilder.create("AnimChar", cfg)
        char.build(self.manager)

        if char.animator:
            char.animator.apply_action(char.rig, "talking", 1, {"duration": 10})

        # Verify keyframes
        self.assertIsNotNone(char.rig.animation_data)
        self.assertIsNotNone(char.rig.animation_data.action)
        fcurves = char.rig.animation_data.action.fcurves
        found = any("Head" in fc.data_path and "rotation_euler" in fc.data_path for fc in fcurves)
        self.assertTrue(found)

if __name__ == "__main__":
    unittest.main()
