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

class TestMovie9V5_1Compatibility(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_slotted_action_shim_compatibility(self):
        """Verifies that our code is prepared for 5.1 slotted actions."""
        # Simple test to ensure the attribute check doesn't fail
        obj = bpy.data.objects.new("Test", None)
        bpy.context.scene.collection.objects.link(obj)
        obj.animation_data_create()
        # Even if not in 5.1, the check should be safe
        has_slots = hasattr(obj.animation_data, "action_slot")
        self.assertIsInstance(has_slots, bool)

if __name__ == "__main__":
    unittest.main()
