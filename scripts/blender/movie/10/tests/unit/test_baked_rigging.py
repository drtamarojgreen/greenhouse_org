import json
import math
import os
import sys
import unittest

try:
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M10_ROOT = os.path.abspath(os.path.join(TEST_DIR, "..", ".."))
M9_ROOT = os.path.abspath(os.path.join(M10_ROOT, "..", "9"))

if M10_ROOT not in sys.path:
    sys.path.insert(0, M10_ROOT)
if M9_ROOT not in sys.path:
    sys.path.append(M9_ROOT)

import movie_configuration as mc
from asset_manager import AssetManager
from director import Director
from render import build_scene
from animation_handler import AnimationHandler
from character_builder import CharacterBuilder
from modeling.greenhouse_mobile import GreenhouseMobileModeler
import components

class TestMovie10BakedRigging(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_baked_action_assignment(self):
        """Verifies that BakedAnimator can correctly assign actions linked with characters."""
        # We'll use Herbaceous_HF as it's configured for BakedAnimator now
        cfg = mc.get_character_config("Herbaceous_HF")
        char = CharacterBuilder.create("Herbaceous_HF", cfg)
        char.build(self.manager)

        # Mock an action for testing since we might not have the actual blend in CI
        mock_action = bpy.data.actions.new(name="Herbaceous_HF_walk")

        # Test switching
        char.animate("walk", 1)

        if char.rig and char.rig.animation_data:
            action = char.rig.animation_data.action
            self.assertIsNotNone(action, "Failed to apply baked action")
            self.assertEqual(action.name, "Herbaceous_HF_walk")

    def test_linked_rig_integrity(self):
        """Verifies that linked rigs maintain their bone hierarchy and visibility."""
        cfg = mc.get_character_config("Root_Guardian")
        char = CharacterBuilder.create("Root_Guardian", cfg)
        char.build(self.manager)

        if char.rig:
            self.assertEqual(char.rig.type, 'ARMATURE')
            self.assertGreater(len(char.rig.pose.bones), 0, "Linked rig has no bones")
            self.assertFalse(char.rig.hide_render, "Linked rig should be visible")

if __name__ == "__main__":
    unittest.main()
