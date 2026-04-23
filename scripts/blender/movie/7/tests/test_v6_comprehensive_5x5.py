import unittest
import bpy
import os
import sys

M7_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_ROOT not in sys.path:
    sys.path.insert(0, M7_ROOT)

from asset_manager import AssetManager
from character_builder import CharacterBuilder

class TestV6Comprehensive5x5(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        cls.manager = AssetManager()
        import config
        for ent_cfg in config.config.get("ensemble.entities", []):
            CharacterBuilder.create(ent_cfg["id"], ent_cfg).build(cls.manager)

    def test_rig_01(self): self.assertTrue(all(".Rig" in o.name for o in bpy.data.objects if o.type == 'ARMATURE'))
    def test_rig_02(self): self.assertIn("Herbaceous.Rig", bpy.data.objects)
    def test_rig_03(self): self.assertIn("Arbor.Rig", bpy.data.objects)
    def test_rig_04(self): self.assertGreater(len(bpy.data.armatures), 1)
    def test_rig_05(self): self.assertTrue(all(pb.rotation_mode == 'XYZ' for o in bpy.data.objects if o.type == 'ARMATURE' for pb in o.pose.bones))

    def test_mesh_01(self): self.assertTrue(all(".Body" in o.name for o in bpy.data.objects if o.type == 'MESH' and o.parent))
    def test_mesh_02(self): self.assertIn("Herbaceous.Body", bpy.data.objects)
    def test_mesh_03(self): self.assertIn("Arbor.Body", bpy.data.objects)
    def test_mesh_04(self): self.assertGreater(len(bpy.data.meshes), 2)
    def test_mesh_05(self): self.assertTrue(all(abs(o.scale.x - 1.0) < 0.01 for o in bpy.data.objects if o.type == 'MESH' and o.parent))

    def test_mat_01(self): self.assertGreaterEqual(len(bpy.data.materials), 4)
    def test_mat_02(self): self.assertTrue(any("Bark" in m.name for m in bpy.data.materials))
    def test_mat_03(self): self.assertTrue(any("Leaf" in m.name for m in bpy.data.materials))
    def test_mat_04(self): self.assertTrue(any("Iris" in m.name for m in bpy.data.materials))
    def test_mat_05(self): self.assertTrue(all(m.use_nodes for m in bpy.data.materials))

    def test_scene_01(self): self.assertIsNotNone(bpy.context.scene.world)
    def test_scene_02(self): self.assertGreater(len(bpy.data.collections), 0)
    def test_scene_03(self): self.assertEqual(bpy.context.scene.frame_start, 1)
    def test_scene_04(self): self.assertIn("7a.ASSETS", bpy.data.collections)
    def test_scene_05(self): self.assertTrue(len(bpy.data.collections["7a.ASSETS"].objects) > 0)

    def test_fidelity_01(self): self.assertGreater(len(bpy.data.objects["Herbaceous.Body"].vertex_groups), 10)
    def test_fidelity_02(self): self.assertGreater(len(bpy.data.objects["Arbor.Body"].vertex_groups), 10)
    def test_fidelity_03(self): self.assertIn("Herbaceous_Eye_L", bpy.data.objects)
    def test_fidelity_04(self): self.assertIn("Arbor_Nose", bpy.data.objects)
    def test_fidelity_05(self): self.assertEqual(bpy.data.objects["Herbaceous_Eye_L"].parent.name, "Herbaceous.Rig")

if __name__ == "__main__":
    unittest.main()
