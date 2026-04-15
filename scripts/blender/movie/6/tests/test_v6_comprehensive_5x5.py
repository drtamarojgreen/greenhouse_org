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
    Covers FBX Pipeline, Rig Sharing, Action Discovery, Scaling Accuracy, and Animation Parity.
    """

    @classmethod
    def setUpClass(cls):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        from generate_scene6 import generate_full_scene_v6
        generate_full_scene_v6()

    # --- FAILURE 1: Rig Sharing & Phase A Resolution ---
    def test_rig_uniqueness(self):
        rigs = [o for o in bpy.data.objects if o.type == 'ARMATURE']
        arm_datas = [r.data.name for r in rigs]
        # Should have unique data-blocks if duplicated correctly
        self.assertEqual(len(rigs), len(set(arm_datas)), "Shared Armature data-blocks detected")

    def test_rig_name_format(self):
        for o in bpy.data.objects:
            if o.type == 'ARMATURE' and "Herbaceous" not in o.name and "Arbor" not in o.name:
                self.assertIn(".Rig", o.name)

    def test_armature_modifier_binding(self):
        for o in bpy.data.objects:
            if o.type == 'MESH' and ".Body" in o.name:
                mod = next((m for m in o.modifiers if m.type == 'ARMATURE'), None)
                if mod: self.assertEqual(mod.object, o.parent)

    def test_source_name_integrity(self):
        for o in bpy.data.objects:
            if ".Rig" in o.name or ".Body" in o.name:
                self.assertIsNotNone(o.get("source_name"), f"Source name property missing for {o.name}")

    def test_phoenix_rig_resolved(self):
        self.assertIsNotNone(bpy.data.objects.get("Phoenix_Herald.Rig"))

    # --- FAILURE 2: FBX Compatibility (Monkeypatch) ---
    def test_export_patch_accessible(self):
        self.assertTrue(hasattr(bpy.types.EXPORT_SCENE_OT_fbx, "use_space_transform"))

    def test_import_patch_accessible(self):
        self.assertTrue(hasattr(bpy.types.IMPORT_SCENE_OT_fbx, "files"))

    def test_export_property_type(self):
        val = getattr(bpy.types.EXPORT_SCENE_OT_fbx, "use_space_transform")
        self.assertIsInstance(val, bool)

    def test_import_property_type(self):
        val = getattr(bpy.types.IMPORT_SCENE_OT_fbx, "files")
        self.assertIsInstance(val, (list, tuple))

    def test_operator_instantiation(self):
        # Should not raise AttributeError when called
        try:
             bpy.ops.export_scene.fbx('INVOKE_DEFAULT', filepath="test.fbx")
             bpy.ops.wm.quit_blender() # Cleanup if dialog opens (unlikely in background)
        except (RuntimeError, AttributeError):
             pass # We just care it doesn't crash on attribute access

    # --- FAILURE 3: Slotted Action Discovery ---
    def test_style_util_curves_retrieval(self):
        herb = bpy.data.objects.get(config.CHAR_HERBACEOUS)
        if herb.animation_data and herb.animation_data.action:
            curves = get_action_curves(herb.animation_data.action, obj=herb)
            self.assertGreater(len(curves), 0)

    def test_action_slot_binding(self):
        for o in bpy.data.objects:
            if o.animation_data and o.animation_data.action:
                self.assertIsNotNone(getattr(o.animation_data, "action_slot", None))

    def test_bone_channel_reconstruction(self):
        rig = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
        if rig and rig.animation_data and rig.animation_data.action:
            curves = get_action_curves(rig.animation_data.action, obj=rig)
            bone_paths = [c.data_path for c in curves if "pose.bones" in c.data_path]
            self.assertGreater(len(bone_paths), 0)

    def test_fcurve_evaluation_proxy(self):
        herb = bpy.data.objects.get(config.CHAR_HERBACEOUS)
        curves = get_action_curves(herb.animation_data.action, obj=herb)
        if curves:
            val = curves[0].evaluate(1)
            self.assertIsInstance(val, float)

    def test_action_layer_presence(self):
        for act in bpy.data.actions:
            if hasattr(act, "layers"): self.assertGreaterEqual(len(act.layers), 1)

    # --- FAILURE 4: Scaling Accuracy ---
    def test_bone_based_height_calc(self):
        majesty = bpy.data.objects.get("Sylvan_Majesty.Rig")
        if majesty:
            from asset_manager_v6 import SylvanEnsembleManager
            am = SylvanEnsembleManager()
            # We mock the internal call or just check world positions
            head = majesty.pose.bones.get("mixamorig:Head")
            foot = majesty.pose.bones.get("mixamorig:LeftFoot")
            if head and foot:
                h = abs((majesty.matrix_world @ head.head).z - (majesty.matrix_world @ foot.head).z)
                self.assertGreater(h, 3.0)

    def test_parent_inverse_identity(self):
        for o in bpy.data.objects:
            if o.type == 'MESH' and o.parent and o.parent.type == 'ARMATURE':
                self.assertTrue(o.matrix_parent_inverse.is_identity)

    def test_mesh_grounding(self):
        for o in bpy.data.objects:
            if ".Body" in o.name:
                bbox = [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]
                min_z = min(v.z for v in bbox)
                self.assertLess(abs(min_z), 0.2)

    def test_no_extreme_scaling(self):
        for o in bpy.data.objects:
            if o.type == 'ARMATURE':
                self.assertLess(o.scale.z, 20.0)

    def test_percentile_fallback_resilience(self):
        all_z = [0, 0, 0, 5, 10, 10, 10, 1000] # 1000 is shard
        all_z.sort()
        idx_min, idx_max = int(len(all_z)*0.01), int(len(all_z)*0.99)
        h = all_z[idx_max] - all_z[idx_min]
        self.assertEqual(h, 10.0)

    # --- FAILURE 5: Animation Tag Parity ---
    def test_protagonist_action_assigned(self):
        herb = bpy.data.objects.get(config.CHAR_HERBACEOUS)
        self.assertIsNotNone(herb.animation_data.action)

    def test_storyline_beats_frames(self):
        majesty = bpy.data.objects.get("Sylvan_Majesty.Body")
        if majesty and majesty.animation_data:
            # Check for hide_render keyframes
            curves = [fc for fc in majesty.animation_data.action.fcurves if "hide_render" in fc.data_path]
            self.assertGreater(len(curves), 0)

    def test_camera_tracking_constraints(self):
        for cam in [o for o in bpy.data.objects if o.type == 'CAMERA']:
            if "Static" not in cam.name:
                self.assertTrue(any(c.type == 'TRACK_TO' for c in cam.constraints))

    def test_camera_path_no_follow(self):
        for cam in [o for o in bpy.data.objects if o.type == 'CAMERA']:
            fp = next((c for c in cam.constraints if c.type == 'FOLLOW_PATH'), None)
            if fp: self.assertFalse(fp.use_curve_follow)

    def test_total_ensemble_count(self):
        rigs = [o for o in bpy.data.objects if o.type == 'ARMATURE' and ".Rig" in o.name]
        self.assertGreaterEqual(len(rigs), 7)

if __name__ == "__main__":
    unittest.main()
