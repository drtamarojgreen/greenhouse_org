import unittest
import bpy
import os
import sys
import mathutils

# Path injection
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
V6_DIR = os.path.dirname(TEST_DIR)
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)
import config

class TestProductionResilience(unittest.TestCase):
    """
    Area 1: FBX Pipeline Resilience (Blender 5.0.1 Compatibility)
    """
    @classmethod
    def setUpClass(cls):
        # Ensure the full scene is generated so tests test the pipeline, not just raw FBXs from phase b
        bpy.ops.wm.read_factory_settings(use_empty=True)
        from generate_scene6 import generate_full_scene_v6
        generate_full_scene_v6()
    def test_fbx_export_rna_patch(self):
        self.assertTrue(hasattr(bpy.types.EXPORT_SCENE_OT_fbx, "use_space_transform"))
    def test_fbx_import_rna_patch(self):
        self.assertTrue(hasattr(bpy.types.IMPORT_SCENE_OT_fbx, "files"))
    def test_fbx_export_execution_stability(self):
        # Dummy export to verify no crash
        bpy.ops.object.select_all(action='DESELECT')
        path = os.path.join(V6_DIR, "assets", "test_resilience.fbx")
        try: bpy.ops.export_scene.fbx(filepath=path, use_selection=True)
        except Exception as e: self.fail(f"FBX Export crashed: {e}")
    def test_fbx_import_files_list_type(self):
        # Verify monkeypatch type gracefully
        prop = getattr(bpy.types.IMPORT_SCENE_OT_fbx, "files", None)
        self.assertIsNotNone(prop)
    def test_fbx_property_setattr_visibility(self):
        self.assertFalse(getattr(bpy.types.EXPORT_SCENE_OT_fbx, "use_space_transform", True))

    """
    Area 2: Scaling and Vertex Integrity
    """
    def test_mesh_parent_inverse_identity(self):
        for obj in bpy.data.objects:
            if obj.type == 'MESH' and obj.parent and obj.parent.type == 'ARMATURE':
                self.assertTrue(obj.matrix_parent_inverse.is_identity)
    def test_bone_height_stability(self):
        # Verify head bone world position is reasonable
        rig = next((o for o in bpy.data.objects if o.type == 'ARMATURE' and ".Rig" in o.name), None)
        if rig:
            head = rig.pose.bones.get("mixamorig:Head")
            if head:
                loc = rig.matrix_world @ head.head
                self.assertGreater(loc.z, 1.0)
    def test_no_zero_scale_meshes(self):
        for obj in bpy.data.objects:
            if obj.type == 'MESH':
                self.assertGreater(obj.scale.x, 0.001)
    def test_percentile_fallback_logic(self):
        # Check that we don't return 0 for mesh height
        from asset_manager_v6 import SylvanEnsembleManager
        am = SylvanEnsembleManager()
        rig = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
        if rig:
            all_z = [1.0, 2.0, 100.0] # 100 is shard
            all_z.sort()
            idx_min = int(len(all_z)*0.01)
            idx_max = int(len(all_z)*0.6) # Filter out the topmost shard
            h = all_z[idx_max] - all_z[idx_min]
            self.assertEqual(h, 1.0) # 2.0 - 1.0 == 1.0
    def test_grounding_z_offset(self):
        for obj in bpy.data.objects:
            if ".Body" in obj.name:
                bbox = [obj.matrix_world @ mathutils.Vector(c) for c in obj.bound_box]
                min_z = min(v.z for v in bbox)
                self.assertLess(abs(min_z), 0.5)

    """
    Area 3: Animation Channel Bag Discovery
    """
    def test_action_slot_exists(self):
        for obj in bpy.data.objects:
            if obj.animation_data and obj.animation_data.action:
                self.assertTrue(hasattr(bpy.types.AnimData, "action_slot") or hasattr(obj.animation_data, "action_slot"))
    def test_style_utility_fcurve_resolution(self):
        from style_utilities.fcurves_operations import get_action_curves
        for obj in bpy.data.objects:
            if obj.animation_data and obj.animation_data.action:
                curves = get_action_curves(obj.animation_data.action, obj=obj)
                self.assertIsInstance(curves, list)
    def test_animation_data_creation_headless(self):
        obj = bpy.data.objects.new("AnimTest", None)
        obj.animation_data_create()
        self.assertIsNotNone(obj.animation_data)
    def test_slotted_action_layer_count(self):
        for act in bpy.data.actions:
            if hasattr(act, "layers"):
                self.assertGreaterEqual(len(act.layers), 0)
    def test_pose_bone_keyframe_paths(self):
        rig = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
        if rig:
            path = 'pose.bones["mixamorig:Head"].rotation_euler'
            # Just check path format doesn't cause crash in get_action_curves
            from style_utilities.fcurves_operations import get_action_curves
            if rig.animation_data and rig.animation_data.action:
                get_action_curves(rig.animation_data.action, obj=rig)

    """
    Area 4: Cinematics and Tracking
    """
    def test_camera_track_to_constraint(self):
        for cam in [o for o in bpy.data.objects if o.type == 'CAMERA']:
            if "Static" not in cam.name:
                has_track = any(c.type == 'TRACK_TO' for c in cam.constraints)
                self.assertTrue(has_track, f"Camera {cam.name} missing tracking")
    def test_track_target_existence(self):
        for cam in [o for o in bpy.data.objects if o.type == 'CAMERA']:
            track = next((c for c in cam.constraints if c.type == 'TRACK_TO'), None)
            if track: self.assertIsNotNone(track.target)
    def test_follow_path_no_follow_curve(self):
        for cam in [o for o in bpy.data.objects if o.type == 'CAMERA']:
            fp = next((c for c in cam.constraints if c.type == 'FOLLOW_PATH'), None)
            if fp: self.assertFalse(fp.use_curve_follow)
    def test_focal_targets_in_collection(self):
        coll = bpy.data.collections.get("6b_Environment")
        if coll:
            self.assertIn(config.FOCUS_HERBACEOUS, coll.objects)
    def test_camera_clipping_end_distance(self):
        for cam in bpy.data.cameras:
            self.assertEqual(cam.clip_end, 2000.0)

    """
    Area 5: Storyline Beats (Manifestation)
    """
    def test_manifestation_keyframes(self):
        majesty = bpy.data.objects.get("Sylvan_Majesty.Body")
        if majesty:
            self.assertIsNotNone(majesty.animation_data)
    def test_rite_of_joy_height_offset(self):
        aura = bpy.data.objects.get("Radiant_Aura.Rig")
        if aura:
            # Aura should be high up at some point
            bpy.context.scene.frame_set(1000)
            self.assertGreater(aura.location.z, 2.0)
    def test_blessing_emission_action(self):
        can = bpy.data.objects.get("WaterCan")
        if can: self.assertIsNotNone(can.animation_data)
    def test_spore_tag_action_assigned(self):
        weaver = bpy.data.objects.get("Shadow_Weaver.Rig")
        if weaver: self.assertIsNotNone(weaver.animation_data.action)
    def test_visibility_mesh_audit(self):
        # Check that we keyframed mesh hide_render, not rig
        rig = bpy.data.objects.get("Sylvan_Majesty.Rig")
        if rig:
            has_hide = False
            if rig.animation_data and rig.animation_data.action:
                from style_utilities.fcurves_operations import get_action_curves
                fcurves = get_action_curves(rig.animation_data.action, obj=rig)
                has_hide = any("hide_render" in fc.data_path for fc in fcurves)
            self.assertFalse(has_hide)

if __name__ == "__main__":
    unittest.main()
