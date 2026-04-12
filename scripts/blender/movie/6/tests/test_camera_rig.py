import bpy
import unittest

class TestCameraRig(unittest.TestCase):
    def test_camera_constraints(self):
        """Verifies cameras have Follow Path and Track To constraints."""
        cameras = ["WIDE", "OTS1", "OTS2"]
        for cam_name in cameras:
            cam = bpy.data.objects.get(cam_name)
            self.assertIsNotNone(cam, f"Camera {cam_name} missing")

            con_types = [c.type for c in cam.constraints]
            self.assertIn('FOLLOW_PATH', con_types, f"Camera {cam_name} missing FOLLOW_PATH")
            self.assertIn('TRACK_TO', con_types, f"Camera {cam_name} missing TRACK_TO")

            # Verify path object existence
            path = next((c.target for c in cam.constraints if c.type == 'FOLLOW_PATH'), None)
            self.assertIsNotNone(path, f"Camera {cam_name} Follow Path has no target")

if __name__ == '__main__':
    unittest.main()
