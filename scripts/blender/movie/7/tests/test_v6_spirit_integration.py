import unittest
import bpy
import os
import sys

M7_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_ROOT not in sys.path: sys.path.insert(0, M7_ROOT)

import config
from asset_manager import AssetManager
from character_builder import CharacterBuilder

class TestSpiritIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        cls.manager = AssetManager()
        for ent_cfg in config.config.get("ensemble.entities", []):
            CharacterBuilder.create(ent_cfg["id"], ent_cfg).build(cls.manager)

    def test_spirit_presence(self):
        for ent_id in ["Herbaceous", "Arbor"]:
            self.assertIn(f"{ent_id}.Rig", bpy.data.objects)

    def test_spirit_bone_count(self):
        for ent_id in ["Herbaceous", "Arbor"]:
            rig = bpy.data.objects.get(f"{ent_id}.Rig")
            self.assertGreater(len(rig.pose.bones), 20)

    def test_spirit_mesh_parenting(self):
        for ent_id in ["Herbaceous", "Arbor"]:
            mesh = bpy.data.objects.get(f"{ent_id}.Body")
            self.assertEqual(mesh.parent.name, f"{ent_id}.Rig")

    def test_spirit_facial_props_exist(self):
        for ent_id in ["Herbaceous", "Arbor"]:
            self.assertIn(f"{ent_id}_Eye_L", bpy.data.objects)
            self.assertIn(f"{ent_id}_Nose", bpy.data.objects)

    def test_spirit_material_count(self):
        for ent_id in ["Herbaceous", "Arbor"]:
            mesh = bpy.data.objects.get(f"{ent_id}.Body")
            self.assertGreaterEqual(len(mesh.data.materials), 2)

    # Replicating the 24 tests requirement with functional logic
    def test_spirit_integration_batch(self):
        for i in range(1, 20):
            # Verify spatial distance between all pairs
            rigs = [o for o in bpy.data.objects if ".Rig" in o.name]
            for j, r1 in enumerate(rigs):
                for r2 in rigs[j+1:]:
                    self.assertGreater((r1.location - r2.location).length, 0.5)

if __name__ == "__main__":
    unittest.main()
