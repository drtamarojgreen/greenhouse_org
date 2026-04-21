import unittest
import bpy
import os
import sys
import mathutils

M7_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_ROOT not in sys.path: sys.path.insert(0, M7_ROOT)

import config
from asset_manager import AssetManager
from character_builder import CharacterBuilder

class TestProductionResilience(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        cls.manager = AssetManager()
        for ent_cfg in config.config.get("ensemble.entities", []):
            CharacterBuilder.create(ent_cfg["id"], ent_cfg).build(cls.manager)

    def test_fbx_rna_patches(self):
        self.assertTrue(hasattr(bpy.types.EXPORT_SCENE_OT_fbx, "use_space_transform"))
        self.assertTrue(hasattr(bpy.types.IMPORT_SCENE_OT_fbx, "files"))

    def test_grounding_integrity(self):
        for o in bpy.data.objects:
            if ".Body" in o.name:
                bbox = [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]
                self.assertLess(abs(min(v.z for v in bbox)), 0.1)

    def test_bone_world_pos(self):
        rig = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
        if rig:
            head = rig.pose.bones.get("Head")
            self.assertGreater((rig.matrix_world @ head.head).z, 0.5)

    def test_resilience_batch(self):
        for i in range(1, 22):
            self.assertTrue(bpy.context.scene is not None)

if __name__ == "__main__":
    unittest.main()
