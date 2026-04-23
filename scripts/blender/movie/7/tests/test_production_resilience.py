import unittest
import bpy
import os
import sys
import mathutils

# Standard path injection
M7_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_ROOT not in sys.path:
    sys.path.insert(0, M7_ROOT)

import config
from asset_manager import AssetManager
from character_builder import CharacterBuilder
from director import Director

class TestProductionResilience(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        cls.manager = AssetManager()
        entities = config.config.get("ensemble.entities", [])
        for ent_cfg in entities:
            CharacterBuilder.create(ent_cfg["id"], ent_cfg).build(cls.manager)
        cls.director = Director()
        cls.director.setup_environment()
        cls.director.setup_lighting()
        cls.director.setup_cinematics()

    def test_res_fbx_rna_export(self):
        self.assertTrue(hasattr(bpy.types.EXPORT_SCENE_OT_fbx, "use_space_transform"))

    def test_res_fbx_rna_import(self):
        self.assertTrue(hasattr(bpy.types.IMPORT_SCENE_OT_fbx, "files"))

    def test_res_mesh_parent_inverse(self):
        for obj in bpy.data.objects:
            if obj.type == 'MESH' and obj.parent and obj.parent.type == 'ARMATURE':
                self.assertTrue(obj.matrix_parent_inverse.is_identity)

    def test_res_bone_height(self):
        for ent_id in ["Herbaceous", "Arbor"]:
            rig = bpy.data.objects.get(f"{ent_id}.Rig")
            if rig:
                head = rig.pose.bones.get("Head")
                self.assertGreater((rig.matrix_world @ head.head).z, 0.5)

    def test_res_no_zero_scale(self):
        for obj in bpy.data.objects:
            if obj.type == 'MESH': self.assertGreater(obj.scale.x, 0.001)

    def test_res_grounding(self):
        for obj in bpy.data.objects:
            if ".Body" in obj.name:
                bbox = [obj.matrix_world @ mathutils.Vector(c) for c in obj.bound_box]
                self.assertLess(abs(min(v.z for v in bbox)), 0.1)

    def test_res_action_slot(self):
        for obj in bpy.data.objects:
            if obj.animation_data and obj.animation_data.action:
                self.assertTrue(hasattr(bpy.types.AnimData, "action_slot") or hasattr(obj.animation_data, "action_slot"))

    def test_res_camera_track(self):
        for cam in [o for o in bpy.data.objects if o.type == 'CAMERA']:
            if cam.name != "Wide":
                self.assertTrue(any(c.type == 'TRACK_TO' for c in cam.constraints))

    def test_res_camera_clipping(self):
        for cam in bpy.data.cameras: self.assertEqual(cam.clip_end, 2000.0)

    def test_res_batch_01(self): self.assertIsNotNone(bpy.context.scene)
    def test_res_batch_02(self): self.assertIsNotNone(bpy.context.view_layer)
    def test_res_batch_03(self): self.assertGreater(len(bpy.data.objects), 0)
    def test_res_batch_04(self): self.assertGreater(len(bpy.data.meshes), 0)
    def test_res_batch_05(self): self.assertGreater(len(bpy.data.armatures), 0)
    def test_res_batch_06(self): self.assertGreater(len(bpy.data.materials), 0)
    def test_res_batch_07(self): self.assertGreater(len(bpy.data.collections), 0)
    def test_res_batch_08(self): self.assertIsNotNone(bpy.data.worlds)
    def test_res_batch_09(self): self.assertTrue(len(bpy.data.cameras) > 0)
    def test_res_batch_10(self): self.assertTrue(len(bpy.data.lights) > 0)
    def test_res_batch_11(self): self.assertIn("7a.ASSETS", bpy.data.collections)
    def test_res_batch_12(self): self.assertIn("7b.ENVIRONMENT", bpy.data.collections)
    def test_res_batch_13(self): self.assertIn("Wide", bpy.data.objects)
    def test_res_batch_14(self): self.assertTrue(bpy.context.scene.camera is not None)
    def test_res_batch_15(self): self.assertEqual(bpy.context.scene.frame_start, 1)
    def test_res_batch_16(self): self.assertGreater(len(bpy.data.objects["Herbaceous.Body"].vertex_groups), 5)
    def test_res_batch_17(self): self.assertGreater(len(bpy.data.objects["Arbor.Body"].vertex_groups), 5)
    def test_res_batch_18(self): self.assertTrue(all(m.use_nodes for m in bpy.data.materials))
    def test_res_batch_19(self): self.assertTrue(any("Bark" in m.name for m in bpy.data.materials))
    def test_res_batch_20(self): self.assertTrue(any("Leaf" in m.name for m in bpy.data.materials))
    def test_res_batch_21(self): self.assertTrue(any("Iris" in m.name for m in bpy.data.materials))

if __name__ == "__main__":
    unittest.main()
