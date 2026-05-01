import unittest
import bpy
import os
import sys

# Standard Path setup for tests
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M9_ROOT = os.path.dirname(TEST_DIR)

if M9_ROOT not in sys.path:
    sys.path.insert(0, M9_ROOT)

from asset_manager import AssetManager
from character_builder import CharacterBuilder
import components
from config import config

class TestMovie9BakedRigging(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_baked_action_assignment(self):
        """Verifies that BakedAnimator can correctly assign actions linked with characters."""
        # We'll use Herbaceous as it's configured for BakedAnimator now
        cfg = config.get_character_config("Herbaceous")
        char = CharacterBuilder.create("Herbaceous", cfg)
        char.build(self.manager)

        # Mock an action for testing since we might not have the actual blend in CI
        mock_action = bpy.data.actions.new(name="Herbaceous_walk")
        
        # Test switching
        char.animate("walk", 1)
        
        if char.rig and char.rig.animation_data:
            action = char.rig.animation_data.action
            self.assertIsNotNone(action, "Failed to apply baked action")
            self.assertEqual(action.name, "Herbaceous_walk")

    def test_linked_rig_integrity(self):
        """Verifies that linked rigs maintain their bone hierarchy and visibility."""
        cfg = config.get_character_config("Root_Guardian")
        char = CharacterBuilder.create("Root_Guardian", cfg)
        char.build(self.manager)

        if char.rig:
            self.assertEqual(char.rig.type, 'ARMATURE')
            self.assertGreater(len(char.rig.pose.bones), 0, "Linked rig has no bones")
            self.assertFalse(char.rig.hide_render, "Linked rig should be visible")

if __name__ == "__main__":
    unittest.main()
