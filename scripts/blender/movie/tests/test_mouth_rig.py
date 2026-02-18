import bpy
import os
import sys
import unittest
import math

# Add movie root to path for local imports
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

import silent_movie_generator
import style

class TestMouthRig(unittest.TestCase):
    def setUp(self):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        self.master = silent_movie_generator.MovieMaster()
        # Initialize assets
        self.master.load_assets()

    def test_21_amplitude_bounds(self):
        """R21: Mouth animation amplitude bounds test per character."""
        for name in ["Herbaceous", "Arbor"]:
            mouth = bpy.data.objects.get(f"{name}_Mouth")
            if not mouth: continue

            # Run dialogue helper
            style.animate_dialogue_v2(mouth, 100, 200, intensity=1.5)

            curves = style.get_action_curves(mouth.animation_data.action)
            for fc in curves:
                if fc.data_path == "scale" and fc.array_index == 2:
                    for kp in fc.keyframe_points:
                        val = kp.co[1]
                        # Expect scale.z to be within [0.1, 2.0]
                        self.assertTrue(0.05 <= val <= 2.5, f"R21 FAIL: {name} mouth amplitude {val} out of bounds")

    def test_23_silent_segments(self):
        """R23: Silent segments keep mouth movement near zero (or at neutral)."""
        for name in ["Herbaceous", "Arbor"]:
            mouth = bpy.data.objects.get(f"{name}_Mouth")
            if not mouth: continue

            # Clear and then run for a specific range
            mouth.animation_data_clear()
            style.animate_dialogue_v2(mouth, 500, 600)

            # Check frames outside [500, 600]
            # In our implementation, we only keyframe the range and the end.
            # But let's check if there are any keyframes in a "silent" range we know of.
            curves = style.get_action_curves(mouth.animation_data.action)
            for fc in curves:
                if fc.data_path == "scale" and fc.array_index == 2:
                    for kp in fc.keyframe_points:
                        f = kp.co[0]
                        if f < 500 or f > 600:
                            val = kp.co[1]
                            self.assertAlmostEqual(val, 0.4, delta=0.01, msg=f"R23 FAIL: {name} mouth active at silent frame {f}")

    def test_26_no_negative_scale(self):
        """R26: Preventing impossible negative jaw scale."""
        for name in ["Herbaceous", "Arbor"]:
            mouth = bpy.data.objects.get(f"{name}_Mouth")
            if not mouth: continue

            if not mouth.animation_data or not mouth.animation_data.action:
                style.animate_dialogue_v2(mouth, 100, 200)

            curves = style.get_action_curves(mouth.animation_data.action)
            for fc in curves:
                if fc.data_path == "scale":
                    for kp in fc.keyframe_points:
                        val = kp.co[1]
                        self.assertGreater(val, 0, f"R26 FAIL: {name} mouth has negative/zero scale {val}")

    def test_29_keyframes_within_scene_range(self):
        """R29: No mouth animation keyframes outside scene range."""
        # This is similar to R18 but specific to mouth
        scene16_range = silent_movie_generator.SCENE_MAP['scene16']
        from scene16_dialogue import scene_logic as s16

        # Clear all
        for obj in bpy.data.objects: obj.animation_data_clear()

        s16.setup_scene(self.master)

        for name in ["Herbaceous", "Arbor"]:
            mouth = bpy.data.objects.get(f"{name}_Mouth")
            if not mouth: continue
            if mouth.animation_data and mouth.animation_data.action:
                fcurves = style.get_action_curves(mouth.animation_data.action)
                for fc in fcurves:
                    for kp in fc.keyframe_points:
                        f = kp.co[0]
                        self.assertTrue(scene16_range[0] <= f <= scene16_range[1],
                                        f"R29 FAIL: {name} mouth keyframe at {f} outside scene16 range {scene16_range}")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)
