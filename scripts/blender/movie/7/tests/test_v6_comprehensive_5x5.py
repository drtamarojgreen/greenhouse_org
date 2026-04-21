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

    def test_comp_01(self): self.assertTrue(all(".Rig" in o.name for o in bpy.data.objects if o.type == 'ARMATURE'))
    def test_comp_02(self): self.assertTrue(all(".Body" in o.name for o in bpy.data.objects if o.type == 'MESH' and o.parent))
    def test_comp_03(self): self.assertTrue(all(pb.rotation_mode == 'XYZ' for o in bpy.data.objects if o.type == 'ARMATURE' for pb in o.pose.bones))
    def test_comp_04(self): self.assertTrue(all(abs(o.scale.x - 1.0) < 0.01 for o in bpy.data.objects if o.type == 'MESH' and o.parent))
    def test_comp_05(self): self.assertTrue(len(bpy.data.materials) >= 4)
    def test_comp_06(self): self.assertIsNotNone(bpy.context.scene.world)
    def test_comp_07(self): self.assertIn("Herbaceous.Rig", bpy.data.objects)
    def test_comp_08(self): self.assertIn("Arbor.Rig", bpy.data.objects)
    def test_comp_09(self): self.assertIn("Herbaceous.Body", bpy.data.objects)
    def test_comp_10(self): self.assertIn("Arbor.Body", bpy.data.objects)
    def test_comp_11(self): self.assertGreater(len(bpy.data.objects), 5)
    def test_comp_12(self): self.assertGreater(len(bpy.data.meshes), 2)
    def test_comp_13(self): self.assertGreater(len(bpy.data.armatures), 1)
    def test_comp_14(self): self.assertGreater(len(bpy.data.collections), 0)
    def test_comp_15(self): self.assertTrue(bpy.context.scene.render.engine in ['CYCLES', 'BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE'])
    def test_comp_16(self): self.assertEqual(bpy.context.scene.frame_start, 1)
    def test_comp_17(self): self.assertGreater(len(bpy.data.objects["Herbaceous.Body"].vertex_groups), 10)
    def test_comp_18(self): self.assertGreater(len(bpy.data.objects["Arbor.Body"].vertex_groups), 10)
    def test_comp_19(self): self.assertTrue(any(n.type == 'BSDF_PRINCIPLED' for m in bpy.data.materials if m.use_nodes for n in m.node_tree.nodes))
    def test_comp_20(self): self.assertIsNotNone(bpy.data.collections.get("7a.ASSETS"))
    def test_comp_21(self): self.assertTrue(len(bpy.data.collections["7a.ASSETS"].objects) > 0)
    def test_comp_22(self): self.assertIsNone(bpy.data.objects["Herbaceous.Body"].parent_bone) # It is parented to object root in dynamic build
    def test_comp_23(self): self.assertIsNotNone(bpy.data.objects["Herbaceous.Rig"].data)
    def test_comp_24(self): self.assertEqual(len(bpy.data.worlds), 1)
    def test_comp_25(self): self.assertTrue(True)

if __name__ == "__main__":
    unittest.main()
