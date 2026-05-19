import unittest
try: import bpy
except ImportError: bpy = None
import os
import sys
import json

# Ensure we can import Movie 10 modules
M10_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if M10_ROOT not in sys.path:
    sys.path.insert(0, M10_ROOT)
try:
    import movie_configuration as mc
except ImportError:
    from . import movie_configuration as mc

class TestCinematicsV10(unittest.TestCase):
    def setUp(self):
        with open(os.path.join(M10_ROOT, "lights_camera.json"), 'r') as f:
            self.lc_cfg = json.load(f)

    def test_camera_variety(self):
        """Verifies that Movie 10 has a professional variety of cameras."""
        camera_ids = [c["id"] for c in self.lc_cfg.get("cameras", [])]
        required = ["Detail_cu", "Hero_track", "Low_angle", "Bird_eye"]
        for r in required:
            self.assertIn(r, camera_ids, f"Movie 10 missing required professional camera: {r}")

    def test_switching_frequency(self):
        """Verifies that the sequencing cycle uses professional-grade rapid cutting."""
        cycle = self.lc_cfg.get("sequencing", {}).get("cycle", {})
        durs = cycle.get("durations", {})
        for cam, dur in durs.items():
            self.assertLessEqual(dur, 100, f"Camera {cam} has a duration too long for dynamic pacing: {dur}")

if __name__ == "__main__":
    unittest.main()
