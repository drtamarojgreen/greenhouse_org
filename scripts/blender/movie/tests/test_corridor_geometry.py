import unittest
import sys
import os
import mathutils

# Add movie root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scene_utils import is_in_camera_corridor

class TestCorridorGeometry(unittest.TestCase):
    def test_point_on_direct_line(self):
        """Points directly on the camera-to-target vector should be in the corridor."""
        cam = (0, 0, 10)
        target = (0, 0, 0)
        p = (0, 0, 5)
        self.assertTrue(is_in_camera_corridor(p, cam, target, width=1.0))

    def test_point_within_width(self):
        """Points slightly off the vector but within 'width' should be in the corridor."""
        cam = (0, 0, 10)
        target = (0, 0, 0)
        p = (0.5, 0, 5) # Dist 0.5 < Width 1.0
        self.assertTrue(is_in_camera_corridor(p, cam, target, width=1.0))

    def test_point_outside_width(self):
        """Points further than 'width' should NOT be in the corridor."""
        cam = (0, 0, 10)
        target = (0, 0, 0)
        p = (1.5, 0, 5) # Dist 1.5 > Width 1.0
        self.assertFalse(is_in_camera_corridor(p, cam, target, width=1.0))

    def test_point_behind_camera(self):
        """Points behind the camera should NOT be considered part of the corridor."""
        cam = (0, 0, 10)
        target = (0, 0, 0)
        p = (0, 0, 15)
        self.assertFalse(is_in_camera_corridor(p, cam, target, width=1.0))

    def test_point_beyond_target(self):
        """Points beyond the target should NOT be considered part of the corridor."""
        cam = (0, 0, 10)
        target = (0, 0, 0)
        p = (0, 0, -5)
        self.assertFalse(is_in_camera_corridor(p, cam, target, width=1.0))

    def test_diagonal_corridor(self):
        """Verify the check works for arbitrary diagonal vectors."""
        cam = (0, 0, 0)
        target = (10, 10, 10)
        p = (5, 5, 5) # Precisely on diagonal
        self.assertTrue(is_in_camera_corridor(p, cam, target, width=1.0))
        
        # Slightly off diagonal
        p_off = (5.5, 4.5, 5) 
        # project (5.5, 4.5, 5) onto (1, 1, 1). dot = (5.5+4.5+5)/sqrt(3) = 15/sqrt(3)
        # closest point = (5, 5, 5). dist = sqrt(0.5^2 + 0.5^2 + 0) = sqrt(0.5) approx 0.707
        self.assertTrue(is_in_camera_corridor(p_off, cam, target, width=1.0))
        self.assertFalse(is_in_camera_corridor(p_off, cam, target, width=0.5))

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv: argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv, exit=False)
