import unittest
import bpy
import os
import sys

# Standard Path setup for tests
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M7_ROOT = os.path.dirname(TEST_DIR)

if M7_ROOT not in sys.path:
    sys.path.insert(0, M7_ROOT)

from asset_manager import AssetManager
from character_builder import CharacterBuilder
import components

class TestMovie7RigIntegrity(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_procedural_rig_bone_hierarchy(self):
        """Verifies that the rigger builds the correct parent-child relationships from config."""
        from config import config
        cfg = config.get_character_config("Herbaceous")
        char = CharacterBuilder.create("Herbaceous", cfg)
        char.build(self.manager)

        neck = char.rig.data.bones.get("Neck")
        self.assertIsNotNone(neck)
        self.assertEqual(neck.parent.name, "Torso")

        head = char.rig.data.bones.get("Head")
        self.assertIsNotNone(head)
        self.assertEqual(head.parent.name, "Neck")

    def test_rig_rotation_mode_xyz(self):
        """Ensures all bones are in XYZ mode for procedural animation compatibility."""
        from config import config
        cfg = config.get_character_config("Herbaceous")
        char = CharacterBuilder.create("Herbaceous", cfg)
        char.build(self.manager)

        for pb in char.rig.pose.bones:
            self.assertEqual(pb.rotation_mode, 'XYZ', f"Bone {pb.name} is not in XYZ mode.")

    def test_deform_flags(self):
        """Verifies use_deform flags are correctly set from config."""
        from config import config
        cfg = config.get_character_config("Herbaceous")
        char = CharacterBuilder.create("Herbaceous", cfg)
        char.build(self.manager)

        self.assertTrue(char.rig.data.bones["Torso"].use_deform)
        self.assertTrue(char.rig.data.bones["Neck"].use_deform)

if __name__ == "__main__":
    unittest.main()
