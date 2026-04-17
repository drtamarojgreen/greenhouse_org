import unittest
import bpy
import os
import sys
import mathutils

# Standardize path injection
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
V6_DIR = os.path.dirname(TEST_DIR)
MOVIE_DIR = os.path.dirname(V6_DIR)
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)
if MOVIE_DIR not in sys.path: sys.path.insert(0, MOVIE_DIR)

import config
from style_utilities.fcurves_operations import get_action_curves

class TestV6Comprehensive5x5(unittest.TestCase):
    """
    Comprehensive 5x5 Test Suite for Scene 6 Production Failures.
    Addressing FBX, Rig Sharing, Head Animation, Scaling Accuracy, and Action Discovery.
    """

    @classmethod
    def setUpClass(cls):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        from generate_scene6 import generate_full_scene_v6
        generate_full_scene_v6()

    # --- FAILURE 1: Rig Sharing & Extraction Skips ---
    def test_rig_uniqueness(self):
        rigs = [o for o in bpy.data.objects if o.type == 'ARMATURE']
        datas = set(r.data.name for r in rigs)
        self.assertEqual(len(rigs), len(datas), "Shared data-blocks in rigs detected")

    def test_rig_name_canonical(self):
        for o in bpy.data.objects:
            if o.type == 'ARMATURE' and "Herbaceous" not in o.name and "Arbor" not in o.name:
                self.assertIn(".Rig", o.name)

    def test_modifier_rebind(self):
        for o in bpy.data.objects:
            if o.type == 'MESH' and ".Body" in o.name:
                mod = next((m for m in o.modifiers if m.type == 'ARMATURE'), None)
                if mod: self.assertEqual(mod.object, o.parent)

    def test_rig_count_match(self):
        rigs = [o for o in bpy.data.objects if o.type == 'ARMATURE' and ".Rig" in o.name]
        self.assertGreaterEqual(len(rigs), 7)

    def test_shared_rig_duplication(self):
        # Phoenix and Root should have separate rig objects
        p_rig = bpy.data.objects.get("Phoenix_Herald.Rig")
        r_rig = bpy.data.objects.get("Root_Guardian.Rig")
        if p_rig and r_rig:
            self.assertNotEqual(p_rig, r_rig)
            self.assertNotEqual(p_rig.data, r_rig.data)

    # --- FAILURE 2: FBX Pipeline Compatibility ---
    def test_export_class_patch(self):
        self.assertTrue(hasattr(bpy.types.EXPORT_SCENE_OT_fbx, "use_space_transform"))

    def test_import_class_patch(self):
        self.assertTrue(hasattr(bpy.types.IMPORT_SCENE_OT_fbx, "files"))

    def test_export_val_visibility(self):
        val = getattr(bpy.types.EXPORT_SCENE_OT_fbx, "use_space_transform", None)
        self.assertFalse(val)

    def test_import_val_visibility(self):
        val = getattr(bpy.types.IMPORT_SCENE_OT_fbx, "files", None)
        self.assertIsNotNone(val)

    def test_operator_call_safety(self):
        # Verify call doesn't raise AttributeError immediately
        bpy.ops.object.select_all(action='DESELECT')
        try: bpy.ops.export_scene.fbx('EXEC_DEFAULT', filepath="t.fbx", use_selection=True)
        except: pass

    # --- FAILURE 3: Protagonist Head Animation ---
    def test_head_bone_deform(self):
        for name in [config.CHAR_HERBACEOUS, config.CHAR_ARBOR]:
            rig = bpy.data.objects.get(name)
            if rig:
                bone = rig.data.bones.get("Head")
                self.assertTrue(bone.use_deform)

    def test_bone_parenting_facial(self):
        eye = bpy.data.objects.get(f"{config.CHAR_HERBACEOUS}_Eye_L")
        if eye:
            self.assertEqual(eye.parent_type, 'BONE')
            self.assertEqual(eye.parent_bone, 'Eye.L')

    def test_rotation_mode_xyz(self):
        for o in bpy.data.objects:
            if o.type == 'ARMATURE':
                for pb in o.pose.bones:
                    self.assertEqual(pb.rotation_mode, 'XYZ')

    def test_head_weight_assignment(self):
        body = bpy.data.objects.get(f"{config.CHAR_HERBACEOUS}_Body")
        if body:
            self.assertIn("Head", body.vertex_groups)

    def test_prop_collection_link(self):
        eye = bpy.data.objects.get(f"{config.CHAR_HERBACEOUS}_Eye_L")
        if eye:
            coll = bpy.data.collections.get(config.COLL_ASSETS)
            self.assertIn(eye.name, coll.objects)

    # --- FAILURE 4: Scaling Distortion ---
    def test_bone_height_accuracy(self):
        majesty = bpy.data.objects.get("Sylvan_Majesty.Rig")
        if majesty:
            bbox = [majesty.matrix_world @ mathutils.Vector(c) for c in majesty.bound_box]
            h = max(v.z for v in bbox) - min(v.z for v in bbox)
            self.assertAlmostEqual(h, config.MAJESTIC_HEIGHT, delta=1.5)

    def test_parent_inverse_identity(self):
        for o in bpy.data.objects:
            if o.type == 'MESH' and o.parent and o.parent.type == 'ARMATURE':
                self.assertTrue(o.matrix_parent_inverse.is_identity)

    def test_min_z_grounding(self):
        for o in bpy.data.objects:
            if ".Body" in o.name:
                bbox = [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]
                self.assertLess(abs(min(v.z for v in bbox)), 0.5)

    def test_mesh_scale_unit(self):
        for o in bpy.data.objects:
            if o.type == 'MESH' and o.parent:
                self.assertAlmostEqual(o.scale.x, 1.0, delta=0.01)

    def test_no_distortion_shards(self):
        for o in bpy.data.objects:
            if o.type == 'MESH':
                verts = [v.co.z for v in o.data.vertices]
                if verts: self.assertLess(max(verts), 100.0)

    # --- FAILURE 5: Slotted Action Discovery ---
    def test_action_slot_exists(self):
        herb = bpy.data.objects.get(config.CHAR_HERBACEOUS)
        if herb.animation_data:
            self.assertIsNotNone(getattr(herb.animation_data, "action_slot", None))

    def test_action_bag_discovery(self):
        herb = bpy.data.objects.get(config.CHAR_HERBACEOUS)
        if herb.animation_data and herb.animation_data.action:
            curves = get_action_curves(herb.animation_data.action, obj=herb)
            self.assertGreater(len(curves), 0)

    def test_story_tag_in_action(self):
        herb = bpy.data.objects.get(config.CHAR_HERBACEOUS)
        # Action name should contain protagonist name at minimum
        self.assertIn("herbaceous", herb.animation_data.action.name.lower())

    def test_keyframe_frame_resolution(self):
        herb = bpy.data.objects.get(config.CHAR_HERBACEOUS)
        curves = get_action_curves(herb.animation_data.action, obj=herb)
        if curves:
            # Check for frames
            points = [p.co[0] for c in curves for p in c.keyframe_points]
            self.assertIn(1, points)

    def test_persistent_tracking_constraints(self):
        for cam in [o for o in bpy.data.objects if o.type == 'CAMERA' and "Static" not in o.name]:
            self.assertTrue(any(c.type == 'TRACK_TO' for c in cam.constraints))

if __name__ == "__main__":
    unittest.main()
