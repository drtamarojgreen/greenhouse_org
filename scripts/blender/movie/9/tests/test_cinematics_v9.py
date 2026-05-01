import unittest
import bpy
import os
import sys
import json

# Ensure we can import Movie 9 modules
M9_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M9_ROOT not in sys.path:
    sys.path.insert(0, M9_ROOT)

class TestCinematicsV9(unittest.TestCase):
    def setUp(self):
        with open(os.path.join(M9_ROOT, "lights_camera.json"), 'r') as f:
            self.lc_cfg = json.load(f)

    def test_camera_variety(self):
        """Verifies that Movie 9 has a professional variety of cameras."""
        camera_ids = [c["id"] for c in self.lc_cfg.get("cameras", [])]
        required = ["Detail_CU", "Hero_Track", "Low_Angle", "Bird_Eye"]
        for r in required:
            self.assertIn(r, camera_ids, f"Movie 9 missing required professional camera: {r}")

    def test_switching_frequency(self):
        """Verifies that the sequencing cycle uses professional-grade rapid cutting."""
        cycle = self.lc_cfg.get("sequencing", {}).get("cycle", {})
        durs = cycle.get("durations", {})
        for cam, dur in durs.items():
            self.assertLessEqual(dur, 100, f"Camera {cam} has a duration too long for dynamic pacing: {dur}")

if __name__ == "__main__":
    unittest.main()
