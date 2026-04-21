import unittest
import bpy
import os
import sys

# Ensure Movie 7 is in path
M7_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_DIR not in sys.path: sys.path.append(M7_DIR)

from asset_manager import AssetManager
from character_builder import CharacterBuilder

class TestMovie7RegistryParity(unittest.TestCase):
    def setUp(self):
        self.manager = AssetManager()
        self.manager.clear_scene()

    def test_registered_component_build(self):
        """Verifies that the registry correctly resolves and builds a Plant character."""
        cfg = {
            "id": "Arbor", "type": "DYNAMIC",
            "components": { "modeling": "PlantModeler", "rigging": "PlantRigger", "shading": "PlantShader" },
            "parameters": { "dimensions": { "torso_h": 1.5, "head_r": 0.4, "neck_h": 0.2 }, "materials": {} }
        }
        char = CharacterBuilder.create("Arbor", cfg)
        char.build(self.manager)

        self.assertIsNotNone(char.rig)
        self.assertIn("Hand.L", char.rig.pose.bones)
        self.assertIn("Eye.L", char.rig.pose.bones)
        self.assertIsNotNone(char.mesh)
        self.assertGreater(len(char.mesh.data.vertices), 100)

if __name__ == "__main__":
    unittest.main()
