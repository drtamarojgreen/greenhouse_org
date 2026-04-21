import unittest
import bpy
import os
import sys
import mathutils

M7_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_ROOT not in sys.path: sys.path.insert(0, M7_ROOT)

from asset_manager import AssetManager
from character_builder import CharacterBuilder
from director import Director

class TestMovie7Comprehensive(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manager = AssetManager(); cls.manager.clear_scene()
        cls.director = Director()
        cls.director.setup_environment(); cls.director.setup_lighting(); cls.director.setup_cameras()

        # Build standard entities from config
        import config
        for ent_cfg in config.config.get("ensemble.entities", []):
            char = CharacterBuilder.create(ent_cfg["id"], ent_cfg)
            char.build(cls.manager)

    def test_rig_uniqueness(self):
        rigs = [o for o in bpy.data.objects if o.type == 'ARMATURE']
        datas = set(r.data.name for r in rigs)
        self.assertEqual(len(rigs), len(datas))

    def test_modifier_rebind(self):
        for o in bpy.data.objects:
            if o.type == 'MESH' and ".Body" in o.name:
                mod = next((m for m in o.modifiers if m.type == 'ARMATURE'), None)
                if mod: self.assertEqual(mod.object, o.parent)

    def test_rotation_mode_xyz(self):
        for o in bpy.data.objects:
            if o.type == 'ARMATURE':
                for pb in o.pose.bones: self.assertEqual(pb.rotation_mode, 'XYZ')

    def test_bone_parenting_facial(self):
        eye = bpy.data.objects.get("Herbaceous_Eye_L")
        if eye:
            self.assertEqual(eye.parent_type, 'BONE')
            self.assertIn("Eye.L", eye.parent_bone)

    def test_min_z_grounding(self):
        for o in bpy.data.objects:
            if ".Body" in o.name:
                bbox = [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]
                self.assertLess(abs(min(v.z for v in bbox)), 0.1)

    def test_persistent_tracking_constraints(self):
        for cam in [o for o in bpy.data.objects if o.type == 'CAMERA']:
            if cam.name == "Wide": continue
            self.assertTrue(any(c.type == 'TRACK_TO' for c in cam.constraints))

if __name__ == "__main__":
    unittest.main()
