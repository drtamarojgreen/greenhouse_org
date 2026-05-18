import unittest
import bpy
import os
import sys

M7_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_ROOT not in sys.path: sys.path.insert(0, M7_ROOT)

from director import Director

class TestMovie7CameraAudit(unittest.TestCase):
    def setUp(self):
        self.director = Director()
        self.director.setup_cinematics()

    def test_v7_cameras_exist(self):
        """Verifies that all standard V7 cameras are created."""
        expected = ["Wide", "Ots1", "Ots2", "Antag1", "Antag2", "Antag3", "Antag4", "Exterior"]
        for cam in expected:
            self.assertIn(cam, bpy.data.objects, f"Camera '{cam}' missing from scene.")

    def test_v7_camera_lenses(self):
        """Verifies that the cameras have correct focal lengths."""
        self.assertEqual(bpy.data.cameras["Wide"].lens, 35.0)
        self.assertEqual(bpy.data.cameras["Ots1"].lens, 50.0)
        self.assertEqual(bpy.data.cameras["Antag1"].lens, 135.0)

    def test_v7_camera_tracking(self):
        """Verifies that tracking constraints are assigned."""
        for cam in ["Wide", "Ots1"]:
            obj = bpy.data.objects[cam]
            self.assertTrue(any(c.type == 'TRACK_TO' for c in obj.constraints))

if __name__ == "__main__":
    unittest.main()
