import unittest
import bpy
import os
import sys

V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)
ASSETS_V6_DIR = os.path.join(V6_DIR, "assets_v6")
if ASSETS_V6_DIR not in sys.path: sys.path.insert(0, ASSETS_V6_DIR)

import camera_rig_v6

class TestCameraRig(unittest.TestCase):
    def setUp(self):
        for obj in bpy.data.objects:
            bpy.data.objects.remove(obj, do_unlink=True)

    def test_camera_paths_and_constraints(self):
        """Verify camera paths exist and constraints are set."""
        cameras = camera_rig_v6.setup_scene6_cameras()

        for name, cam_obj in cameras.items():
            self.assertIsNotNone(cam_obj, f"Camera {name} not found")

            # Check for Follow Path
            fp = next((c for c in cam_obj.constraints if c.type == 'FOLLOW_PATH'), None)
            self.assertIsNotNone(fp, f"Camera {name} missing FOLLOW_PATH constraint")
            self.assertIsNotNone(fp.target, f"Camera {name} FOLLOW_PATH has no target")
            self.assertIn("_Path", fp.target.name, f"Camera {name} target is not a path")

            # Check for Track To
            tt = next((c for c in cam_obj.constraints if c.type == 'TRACK_TO'), None)
            self.assertIsNotNone(tt, f"Camera {name} missing TRACK_TO constraint")
            self.assertIsNotNone(tt.target, f"Camera {name} TRACK_TO has no target")
            self.assertIn("Focus_", tt.target.name, f"Camera {name} target is not a focus object")

if __name__ == '__main__':
    unittest.main()
