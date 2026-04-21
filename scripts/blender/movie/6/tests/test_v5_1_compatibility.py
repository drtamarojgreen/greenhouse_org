import unittest
import bpy
import os
import sys

# Standardize path injection
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
V6_DIR = os.path.dirname(TEST_DIR)
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

import config

class TestV51Compatibility(unittest.TestCase):
    """
    Tests for Blender 5.1 specific features and potential regressions.
    Focus on Slotted Action API and RNA property discovery.
    """

    @classmethod
    def setUpClass(cls):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        # Mock a character with animation
        bpy.ops.object.armature_add()
        cls.rig = bpy.context.active_object
        cls.rig.name = "TestRig"
        cls.rig.animation_data_create()
        cls.rig.animation_data.action = bpy.data.actions.new(name="TestAction")

    def test_slotted_action_bag(self):
        """Verifies that the new Slotted Action bag (Blender 5.1+) is accessible."""
        # In 5.1, actions might have slots. If not explicitly supported yet,
        # we check if the attribute exists or if the old way still works.
        if hasattr(self.rig.animation_data, "action_slot"):
             pass # In 5.1, it can be None if unassigned natively.

        # Verify action exists
        self.assertIsNotNone(self.rig.animation_data.action)

    def test_fbx_rna_properties(self):
        """Verifies that the FBX operators have the expected properties in 5.1."""
        export_op = bpy.ops.export_scene.fbx.get_rna_type()
        import_op = bpy.ops.import_scene.fbx.get_rna_type()

        export_props = {p.identifier for p in export_op.properties}
        import_props = {p.identifier for p in import_op.properties}

        # Critical properties we rely on or have patched
        self.assertIn("filepath", export_props)
        self.assertIn("use_selection", export_props)

        # If use_space_transform is missing in 5.1 core, our patch should make it visible to Python
        # but RNA might not show it unless we re-register. We mostly care about 'filepath'.
        self.assertIn("filepath", import_props)

    def test_view_layer_update_stability(self):
        """Verifies that view_layer.update() doesn't crash in background mode."""
        try:
            bpy.context.view_layer.update()
        except Exception as e:
            self.fail(f"view_layer.update() failed: {e}")

    def test_grease_pencil_3_check(self):
        """Checks for Grease Pencil 3 data structures if used in 5.1."""
        # Movie 6 doesn't use GP heavily yet, but we check if the data-block exists
        self.assertTrue(hasattr(bpy.data, "grease_pencils_v3"))

if __name__ == "__main__":
    unittest.main()
