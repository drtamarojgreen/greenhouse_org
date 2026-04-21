import unittest
import bpy
import os
import sys

M7_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_DIR not in sys.path:
    sys.path.append(M7_DIR)

from config import config
from asset_manager import AssetManager
from character_builder import CharacterBuilder, MeshCharacter, DynamicCharacter

class TestMovie7OOCharacters(unittest.TestCase):
    def setUp(self):
        self.manager = AssetManager()
        self.manager.clear_scene()

    def test_factory_creation(self):
        mesh_cfg = {"type": "MESH", "source_mesh": "Test"}
        char_mesh = CharacterBuilder.create("MeshChar", mesh_cfg)
        self.assertIsInstance(char_mesh, MeshCharacter)

        dyn_cfg = {"type": "DYNAMIC", "components": {"modeling": "PlantModeler"}}
        char_dyn = CharacterBuilder.create("DynChar", dyn_cfg)
        self.assertIsInstance(char_dyn, DynamicCharacter)

if __name__ == "__main__":
    unittest.main()
