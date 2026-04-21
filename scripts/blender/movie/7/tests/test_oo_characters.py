import unittest
import bpy
import os
import sys

M7_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_ROOT not in sys.path: sys.path.insert(0, M7_ROOT)

from asset_manager import AssetManager
from character_builder import CharacterBuilder, MeshCharacter, DynamicCharacter

class TestMovie7OOCharacters(unittest.TestCase):
    def setUp(self):
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_factory_creation(self):
        """Verifies that the factory returns the correct character type."""
        mesh_cfg = {"id": "MeshChar", "type": "MESH", "source_mesh": "Test"}
        char_mesh = CharacterBuilder.create("MeshChar", mesh_cfg)
        self.assertIsInstance(char_mesh, MeshCharacter)

        dyn_cfg = {"id": "DynChar", "type": "DYNAMIC", "components": {"modeling": "PlantModeler"}}
        char_dyn = CharacterBuilder.create("DynChar", dyn_cfg)
        self.assertIsInstance(char_dyn, DynamicCharacter)

if __name__ == "__main__":
    unittest.main()
