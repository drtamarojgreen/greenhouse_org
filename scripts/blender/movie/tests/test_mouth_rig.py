import bpy
import os
import sys
import unittest
import math

# Add movie root to path for local imports
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

sys.path.append(os.path.join(MOVIE_ROOT, "tests"))
from base_test import BlenderTestCase

import silent_movie_generator
import style
from assets import plant_humanoid

class TestMouthRig(BlenderTestCase):
    def test_21_amplitude_bounds(self):
        """R21: Mouth animation amplitude bounds (Bone version)."""
        for char_obj in [self.master.h1, self.master.h2]:
            if not char_obj: continue
            char_obj.animation_data_clear()

            # Run talk helper
            plant_humanoid.animate_talk(char_obj, 100, 200, intensity=1.5)

            self.assertIsNotNone(char_obj.animation_data, "No animation data")
            curves = style.get_action_curves(char_obj.animation_data.action)

            mouth_z_found = False
            for fc in curves:
                if "Mouth" in fc.data_path and "scale" in fc.data_path and fc.array_index == 2:
                    mouth_z_found = True
                    values = [kp.co[1] for kp in fc.keyframe_points]
                    self.assertGreater(len(values), 1, "No animation variation.")
                    for val in values:
                        self.assertTrue(0.05 <= val <= 2.5, f"Amplitude {val:.2f} out of bounds")
            self.assertTrue(mouth_z_found, "Mouth Z scale f-curve not found")

    def test_26_no_negative_scale(self):
        """R26: Preventing impossible negative jaw scale."""
        for char_obj in [self.master.h1, self.master.h2]:
            if not char_obj: continue
            if not char_obj.animation_data:
                plant_humanoid.animate_talk(char_obj, 100, 200)

            curves = style.get_action_curves(char_obj.animation_data.action)
            for fc in curves:
                if "scale" in fc.data_path:
                    for kp in fc.keyframe_points:
                        self.assertGreater(kp.co[1], 0, f"Negative/zero scale found: {kp.co[1]}")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)
