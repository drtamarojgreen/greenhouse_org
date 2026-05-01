import unittest
import bpy
import os
import sys

# Ensure Movie 9 is in path
M9_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M9_DIR not in sys.path:
    sys.path.append(M9_DIR)

from asset_manager import AssetManager
from character_builder import CharacterBuilder

class TestComponentParity(unittest.TestCase):
    def setUp(self):
        self.manager = AssetManager()
        self.manager.clear_scene()

    def test_component_building(self):
        """Verifies that the character build correctly utilizes components."""
        entity = {
            "id": "CompChar",
            "type": "MESH",
            "is_protagonist": True,
            "components": { "modeling": "PlantModeler" }
        }
        char = CharacterBuilder.create("CompChar", entity)
        char.build(self.manager)

        self.assertIsNotNone(char.rig)
        self.assertIsNotNone(char.mesh)
        # PlantModeler with eyes has multiple materials (Bark, Leaf, Iris, Pupil)
        self.assertGreaterEqual(len(char.mesh.data.materials), 1)

if __name__ == "__main__":
    unittest.main()
