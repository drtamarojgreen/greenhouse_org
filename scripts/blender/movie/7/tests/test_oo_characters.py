import unittest
import bpy
import os
import sys

# Ensure Movie 7 is in path
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
        """Verifies that the factory returns the correct character type."""
        mesh_cfg = {"type": "MESH", "source_mesh": "TestMesh"}
        char_mesh = CharacterBuilder.create("MeshChar", mesh_cfg)
        self.assertIsInstance(char_mesh, MeshCharacter)

        dynamic_cfg = {"type": "DYNAMIC", "builder": "PlantHumanoid"}
        char_dyn = CharacterBuilder.create("DynChar", dynamic_cfg)
        self.assertIsInstance(char_dyn, DynamicCharacter)

    def test_dynamic_character_build(self):
        """Verifies that a dynamic character builds its rig and mesh."""
        dynamic_cfg = {"type": "DYNAMIC", "builder": "PlantHumanoid"}
        char = CharacterBuilder.create("DynChar", dynamic_cfg)
        char.build(self.manager)

        self.assertIsNotNone(char.rig)
        self.assertIsNotNone(char.mesh)
        self.assertEqual(char.rig.name, "DynChar.Rig")
        self.assertEqual(char.mesh.name, "DynChar.Body")
        self.assertEqual(char.mesh.parent, char.rig)

if __name__ == "__main__":
    unittest.main()
