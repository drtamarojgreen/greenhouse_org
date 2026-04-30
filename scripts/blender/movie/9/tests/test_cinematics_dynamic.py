import unittest
import bpy
import os
import sys

# Ensure Movie 9 root is in sys.path
M9_ROOT = os.path.dirname(os.path.abspath(os.path.join(__file__, "../..")))
if M9_ROOT not in sys.path:
    sys.path.insert(0, M9_ROOT)

from director import Director
import components

class TestCinematicsDynamicV9(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        components.initialize_registry()
        cls.director = Director()
        cls.director.setup_cinematics()
        cls.director.apply_sequencing()

    def test_clinical_camera_activation(self):
        """Verifies Clinical_TwoShot is active during the exchange."""
        # Beat starts at 1000
        bpy.context.scene.frame_set(1005)

        # Check active camera
        active_cam = bpy.context.scene.camera
        self.assertIsNotNone(active_cam)
        self.assertEqual(active_cam.name, "Clinical_TwoShot",
                         f"Incorrect camera at frame 1005: expected Clinical_TwoShot, got {active_cam.name}")

    def test_sequencing_cut_density(self):
        """Verifies professional-grade rapid cutting in the cycle."""
        markers = [m for m in bpy.context.scene.timeline_markers if "Shot_" in m.name]
        # In cycle 504 to 4150, cuts should be frequent
        cut_frames = sorted([m.frame for m in markers])

        diffs = []
        for i in range(len(cut_frames)-1):
            diffs.append(cut_frames[i+1] - cut_frames[i])

        if diffs:
            avg_cut = sum(diffs) / len(diffs)
            # Expecting average cut length between 40 and 100 for professional grade
            self.assertLessEqual(avg_cut, 100, f"Average cut length too slow for professional grade: {avg_cut} frames")

if __name__ == "__main__":
    unittest.main()
