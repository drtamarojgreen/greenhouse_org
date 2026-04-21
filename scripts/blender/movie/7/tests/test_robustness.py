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
        cfg = {"type": "DYNAMIC", "builder": "PlantHumanoid", "target_height": 5.0}
        char = CharacterBuilder.create("TestChar", cfg)
        char.build(self.manager)

        # Check height
        metrics = self.manager._get_metrics(char.rig)
        self.assertAlmostEqual(metrics['height'], 5.0, places=1)
        # Check grounding
        self.assertAlmostEqual(metrics['ground_z'], 0.0, places=2)

    def test_procedural_animation(self):
        """Verifies that procedural animation generates keyframes."""
        cfg = {"type": "DYNAMIC", "builder": "PlantHumanoid"}
        char = CharacterBuilder.create("AnimChar", cfg)
        char.build(self.manager)

        self.animator.apply_animation(char.rig, "talking", 1, duration=10)

        # Verify keyframes
        bone = char.rig.pose.bones.get("Head")
        self.assertIsNotNone(bone.animation_data)
        fcurves = bone.id_data.animation_data.action.fcurves
        # Head rotation X should have keyframes
        found = False
        for fc in fcurves:
            if "Head" in fc.data_path and "rotation_euler" in fc.data_path and fc.array_index == 0:
                self.assertGreater(len(fc.keyframe_points), 0)
                found = True
        self.assertTrue(found)

if __name__ == "__main__":
    unittest.main()
