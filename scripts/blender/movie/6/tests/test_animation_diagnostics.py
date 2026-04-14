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
        """Verifies Herbaceous and Arbor have actions with keyframes."""
        for name in [config.CHAR_HERBACEOUS, config.CHAR_ARBOR]:
            obj = bpy.data.objects.get(name)
            self.assertIsNotNone(obj, f"Protagonist {name} missing")
            self.assertIsNotNone(obj.animation_data, f"{name} has no animation data")
            self.assertIsNotNone(obj.animation_data.action, f"{name} has no assigned action")

            action = obj.animation_data.action
            f_range = action.frame_range
            print(f"DIAGNOSTIC: {name} action {action.name} range: {f_range[0]} to {f_range[1]}")

            # Check for range covering significant portion of render
            self.assertGreaterEqual(f_range[1], 3000, f"{name} animation ends too early ({f_range[1]})")

    def test_ensemble_animation_ranges(self):
        """Verifies spirits have animations covering the full duration."""
        spirits = [o for o in bpy.data.objects if o.type == 'ARMATURE' and ".Rig" in o.name]
        for s in spirits:
            if not s.animation_data or not s.animation_data.action:
                continue
            f_range = s.animation_data.action.frame_range
            print(f"DIAGNOSTIC: Spirit {s.name} range: {f_range[0]} to {f_range[1]}")
            self.assertGreaterEqual(f_range[1], config.TOTAL_FRAMES - 100, f"Spirit {s.name} animation ends early")

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
