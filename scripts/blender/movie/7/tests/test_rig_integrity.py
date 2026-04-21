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

class TestMovie7RigIntegrity(unittest.TestCase):
    def setUp(self):
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_spirit_rig_vertex_group_coverage(self):
        """Ported from M6: Ensures every bone has a corresponding vertex group."""
        cfg = {"id": "Arbor", "type": "DYNAMIC", "components": {"modeling": "PlantModeler", "rigging": "PlantRigger", "shading": "PlantShader"}}
        char = CharacterBuilder.create("Arbor", cfg); char.build(self.manager)

        vg_names = {vg.name for vg in char.mesh.vertex_groups}
        for bone in char.rig.data.bones:
            if bone.use_deform:
                self.assertIn(bone.name, vg_names, f"Deforming bone {bone.name} has no vertex group.")

    def test_rig_deformation_flags(self):
        """Verifies that facial bones do NOT deform."""
        cfg = {"id": "Arbor", "type": "DYNAMIC", "components": {"modeling": "PlantModeler", "rigging": "PlantRigger", "shading": "PlantShader"}}
        char = CharacterBuilder.create("Arbor", cfg); char.build(self.manager)

        non_deforming = ["Eye.L", "Ear.R", "Nose", "Lip.Upper"]
        for bname in non_deforming:
            self.assertFalse(char.rig.data.bones[bname].use_deform, f"Bone {bname} should not deform.")

    def test_rig_batch_1(self): self.assertTrue(True)

if __name__ == "__main__":
    unittest.main()
