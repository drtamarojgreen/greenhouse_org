import unittest
import bpy
import os
import sys

# Ensure v6 directory is in path
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path:
    sys.path.append(V6_DIR)

import config

class TestAnimationDiagnostics(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """Assembles the full production scene once for diagnostic audit."""
        from generate_scene6 import generate_full_scene_v6
        generate_full_scene_v6()
        bpy.context.view_layer.update()

    def test_protagonist_actions(self):
        """Verifies Herbaceous and Arbor have actions with keyframes, compatible with Slotted Action API."""
        from style_utilities.fcurves_operations import get_action_curves
        for name in [config.CHAR_HERBACEOUS, config.CHAR_ARBOR]:
            obj = bpy.data.objects.get(name)
            self.assertIsNotNone(obj, f"Protagonist {name} missing")
            self.assertIsNotNone(obj.animation_data, f"{name} has no animation data")
            self.assertIsNotNone(obj.animation_data.action, f"{name} has no assigned action")

            action = obj.animation_data.action
            curves = get_action_curves(action, obj=obj)
            self.assertGreater(len(curves), 0, f"{name} has action but no F-Curves in slot/bag")

            # Get range across all curves
            all_frames = []
            for fc in curves:
                all_frames.extend([k.co[0] for k in fc.keyframe_points])

            if all_frames:
                f_min, f_max = min(all_frames), max(all_frames)
                print(f"DIAGNOSTIC: {name} Slotted Range: {f_min} to {f_max}")
                self.assertGreaterEqual(f_max, 3000, f"{name} animation ends too early ({f_max})")
            else:
                self.fail(f"{name} has curves but no keyframe points")

    def test_ensemble_animation_ranges(self):
        """Verifies spirits have animations covering the full duration."""
        from style_utilities.fcurves_operations import get_action_curves
        spirits = [o for o in bpy.data.objects if o.type == 'ARMATURE' and ".Rig" in o.name]
        for s in spirits:
            if not s.animation_data or not s.animation_data.action:
                continue

            curves = get_action_curves(s.animation_data.action, obj=s)
            all_frames = []
            for fc in curves:
                all_frames.extend([k.co[0] for k in fc.keyframe_points])

            if all_frames:
                f_max = max(all_frames)
                print(f"DIAGNOSTIC: Spirit {s.name} range max: {f_max}")
                self.assertGreaterEqual(f_max, config.TOTAL_FRAMES - 100, f"Spirit {s.name} animation ends early")

    def test_camera_marker_switching(self):
        """Verifies camera markers are correctly established."""
        scene = bpy.context.scene
        markers = scene.timeline_markers
        self.assertGreaterEqual(len(markers), 4, "Missing camera switch markers")

        cams_found = {m.camera.name for m in markers if m.camera}
        expected = {"WIDE", "OTS1", "OTS2"}
        self.assertTrue(expected.issubset(cams_found), f"Missing cameras in markers: {expected - cams_found}")

if __name__ == "__main__":
    unittest.main()
