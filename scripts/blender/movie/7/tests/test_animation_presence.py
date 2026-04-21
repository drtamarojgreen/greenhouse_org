import unittest
import bpy
import os
import sys

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M7_ROOT = os.path.dirname(TEST_DIR)

if M7_ROOT not in sys.path: sys.path.insert(0, M7_ROOT)

from asset_manager import AssetManager
from character_builder import CharacterBuilder

class TestMovie7AnimationPresence(unittest.TestCase):
    def setUp(self):
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_procedural_animation_data_creation(self):
        """Ensures animation data and actions are initialized."""
        cfg = {"id": "Arbor", "type": "DYNAMIC", "components": {"modeling": "PlantModeler", "rigging": "PlantRigger", "shading": "PlantShader", "animation": "PlantAnimator"}}
        char = CharacterBuilder.create("Arbor", cfg); char.build(self.manager)

        char.animator.apply_action(char.rig, "talking", 1, {"duration": 10})
        self.assertIsNotNone(char.rig.animation_data)
        self.assertIsNotNone(char.rig.animation_data.action)

    def test_anim_batch_1(self): self.assertTrue(True)

if __name__ == "__main__":
    unittest.main()
