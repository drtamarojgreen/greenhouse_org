import unittest
import bpy
import os
import sys

# Ensure Movie 7 is in path
M7_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_DIR not in sys.path:
    sys.path.append(M7_DIR)

from asset_manager import AssetManager
from character_builder import CharacterBuilder

class TestComponentParity(unittest.TestCase):
    def setUp(self):
        self.manager = AssetManager()
        self.manager.clear_scene()

    def test_component_building(self):
        """Verifies that the character build correctly utilizes components."""
        cfg = {
            "id": "CompChar",
            "type": "DYNAMIC",
            "parameters": {"dimensions": {"torso_h": 2.0}, "foliage": {"density": 10}}
        }
        char = CharacterBuilder.create("CompChar", cfg)
        char.build(self.manager)

        self.assertIsNotNone(char.rig)
        self.assertIsNotNone(char.mesh)
        self.assertEqual(len(char.mesh.data.materials), 2)
        self.assertIn("Torso", char.rig.pose.bones)

if __name__ == "__main__":
    unittest.main()
