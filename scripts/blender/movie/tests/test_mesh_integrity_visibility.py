import bpy
import os
import sys
import unittest

# Add movie root to path for local imports
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

sys.path.append(os.path.join(MOVIE_ROOT, "tests"))
from base_test import BlenderTestCase

import silent_movie_generator
import style_utilities as style

class TestMeshIntegrity(BlenderTestCase):
    def test_71_mouth_clipping_bounds(self):
        """R71: Mesh clipping around mouth (Bone scale version)."""
        for char_obj in [self.master.h1, self.master.h2]:
            if not char_obj: continue
            if char_obj.animation_data and char_obj.animation_data.action:
                curves = style.get_action_curves(char_obj.animation_data.action)
                for fc in curves:
                    if "Mouth" in fc.data_path and "scale" in fc.data_path:
                        for kp in fc.keyframe_points:
                            self.assertLessEqual(kp.co[1], 2.5, f"Mouth scale too large")

    def test_76_floor_penetration(self):
        """R76: Floor penetration during retreat."""
        gnome = self.master.gnome
        s22_range = silent_movie_generator.SCENE_MAP['scene22']
        for f in [s22_range[0], s22_range[0]+100, s22_range[1]]:
            self.master.scene.frame_set(f)
            self.assertGreaterEqual(gnome.location.z, -0.05, f"Gnome penetrated floor at frame {f}")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)
