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
from director import Director
from registry import registry
from character_builder import CharacterBuilder
import components

class TestMovie7Modularity(unittest.TestCase):

    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager()
        self.director = Director()
        self.manager.clear_scene()

    def test_universal_build_data_driven(self):
        """Verifies that a character is built purely from geometry and props data."""
        cfg = config.get_character_config("Herbaceous")
        char = CharacterBuilder.create("Herbaceous", cfg)
        char.build(self.manager)

        # Verify prop objects exist
        prop_names = [o.name for o in char.rig.children if o != char.mesh]
        self.assertTrue(any("Eye_L" in n for n in prop_names))
        self.assertTrue(any("Ear_R" in n for n in prop_names))

    def test_universal_material_application(self):
        """Verifies materials are applied based on generic IDs."""
        cfg = config.get_character_config("Herbaceous")
        char = CharacterBuilder.create("Herbaceous", cfg)
        char.build(self.manager)

        # Check primary material on body
        mat_names = [m.name for m in char.mesh.data.materials if m]
        self.assertTrue(any("primary" in n for n in mat_names))

        # Check accent material on eyes
        eye_l = next(o for o in char.rig.children if "Eye_L" in o.name)
        eye_mat_names = [m.name for m in eye_l.data.materials if m]
        self.assertTrue(any("accent" in n for n in eye_mat_names))

    def test_bone_structure_parity(self):
        """Verifies that the rig has the correct number of bones as defined in config."""
        cfg = config.get_character_config("Herbaceous")
        char = CharacterBuilder.create("Herbaceous", cfg)
        char.build(self.manager)

        expected_bones = len(cfg["structure"]["rig"]["bones"])
        self.assertEqual(len(char.rig.data.bones), expected_bones)

if __name__ == "__main__":
    unittest.main()
