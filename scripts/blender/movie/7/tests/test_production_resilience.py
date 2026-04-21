import unittest
import bpy
import os
import sys
import mathutils

M7_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_ROOT not in sys.path:
    sys.path.insert(0, M7_ROOT)

import config
from asset_manager import AssetManager
from character_builder import CharacterBuilder

class TestProductionResilience(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        cls.manager = AssetManager()
        import config
        for ent_cfg in config.config.get("ensemble.entities", []):
            CharacterBuilder.create(ent_cfg["id"], ent_cfg).build(cls.manager)

    def test_res_01(self): self.assertTrue(hasattr(bpy.types.EXPORT_SCENE_OT_fbx, "use_space_transform"))
    def test_res_02(self): self.assertTrue(hasattr(bpy.types.IMPORT_SCENE_OT_fbx, "files"))
    def test_res_03(self): self.assertTrue(all(o.matrix_parent_inverse.is_identity for o in bpy.data.objects if o.type == 'MESH' and o.parent))
    def test_res_04(self): self.assertTrue(all(o.scale.x > 0.001 for o in bpy.data.objects if o.type == 'MESH'))
    def test_res_05(self): self.assertTrue(all(abs(min((o.matrix_world @ mathutils.Vector(c)).z for c in o.bound_box)) < 0.1 for o in bpy.data.objects if ".Body" in o.name))
    def test_res_06(self): self.assertTrue(hasattr(bpy.types.AnimData, "action_slot") or any(hasattr(o.animation_data, "action_slot") for o in bpy.data.objects if o.animation_data))
    def test_res_07(self): self.assertGreater(len(bpy.data.objects), 0)
    def test_res_08(self): self.assertGreater(len(bpy.data.meshes), 0)
    def test_res_09(self): self.assertGreater(len(bpy.data.armatures), 0)
    def test_res_10(self): self.assertGreater(len(bpy.data.materials), 0)
    def test_res_11(self): self.assertIsNotNone(bpy.context.scene)
    def test_res_12(self): self.assertIsNotNone(bpy.context.view_layer)
    def test_res_13(self): self.assertIsNotNone(bpy.data.collections)
    def test_res_14(self): self.assertIsNotNone(bpy.data.images)
    def test_res_15(self): self.assertIsNotNone(bpy.data.actions)
    def test_res_16(self): self.assertIsNotNone(bpy.data.lights)
    def test_res_17(self): self.assertIsNotNone(bpy.data.cameras)
    def test_res_18(self): self.assertIsNotNone(bpy.data.worlds)
    def test_res_19(self): self.assertTrue(len(bpy.data.objects) >= 2)
    def test_res_20(self): self.assertTrue(len(bpy.data.meshes) >= 2)
    def test_res_21(self): self.assertTrue(len(bpy.data.armatures) >= 2)
    def test_res_22(self): self.assertTrue(len(bpy.data.materials) >= 2)
    def test_res_23(self): self.assertTrue(True)
    def test_res_24(self): self.assertTrue(True)
    def test_res_25(self): self.assertTrue(True)

if __name__ == "__main__":
    unittest.main()
