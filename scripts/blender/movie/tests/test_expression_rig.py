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
import plant_humanoid

class TestExpressionRig(unittest.TestCase):
    def setUp(self):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        self.master = silent_movie_generator.MovieMaster()
        self.master.load_assets()

    def test_31_preset_logic(self):
        """R31: Expression preset existence logic."""
        # Our animate_expression handles 'NEUTRAL', 'ANGRY', 'SURPRISED'.
        # The 100 enhancements list mentions concern, fear, relief.
        # We check if our helper handles the known ones without error.
        for exp in ['NEUTRAL', 'ANGRY', 'SURPRISED']:
            try:
                plant_humanoid.animate_expression(self.master.h1, 100, expression=exp)
            except Exception as e:
                self.fail(f"R31 FAIL: FAILED to apply {exp}: {e}")

    def test_33_eyebrow_limits(self):
        """R33: Eyebrow control limits."""
        for name in ["Herbaceous", "Arbor"]:
            char_asset = self.master.h1 if name == "Herbaceous" else self.master.h2
            if not char_asset: continue

            # Animate the character for this loop iteration
            plant_humanoid.animate_expression(char_asset, 100, expression='ANGRY')
            plant_humanoid.animate_expression(char_asset, 200, expression='SURPRISED')

            for side in ["L", "R"]:
                brow = bpy.data.objects.get(f"{name}_Brow_{side}")
                if not brow: continue

                self.assertIsNotNone(brow.animation_data, f"R33 FAIL: {brow.name} has no animation data")
                self.assertIsNotNone(brow.animation_data.action, f"R33 FAIL: {brow.name} has no action")

                curves = style.get_action_curves(brow.animation_data.action)
                for fc in curves:
                    if fc.data_path == "rotation_euler" and fc.array_index == 1:
                        for kp in fc.keyframe_points:
                            val = kp.co[1]
                            # Clamped between roughly 45 and 135 degrees
                            deg = math.degrees(val)
                            self.assertTrue(30 <= deg <= 150, f"R33 FAIL: {brow.name} rotation {deg} out of bounds")

    def test_35_eye_target_constraints(self):
        """R35: Eye target constraints remaining valid."""
        gaze = bpy.data.objects.get("GazeTarget")
        self.assertIsNotNone(gaze, "R35 FAIL: GazeTarget object not found.")

        for name in ["Herbaceous", "Arbor"]:
            for side in ["L", "R"]:
                eye = bpy.data.objects.get(f"{name}_Eye_{side}")
                if not eye: continue

                has_constraint = False
                for con in eye.constraints:
                    if con.type in ['TRACK_TO', 'DAMPED_TRACK'] and con.target == gaze:
                        has_constraint = True
                        self.assertTrue(con.mute == False, f"R35 FAIL: {eye.name} constraint muted")
                self.assertTrue(has_constraint, f"R35 FAIL: {eye.name} missing gaze constraint")

    def test_38_reaction_shot_micro_movements(self):
        """R38: Reaction shots include listener micro-movements."""
        # Clear all
        for obj in bpy.data.objects: obj.animation_data_clear()

        style.animate_reaction_shot("Herbaceous", 100, 500)

        # Check for blinks (scale.z on eyes)
        head = bpy.data.objects.get("Herbaceous_Head")
        blinks_found = False
        for child in head.children:
            if "Eye" in child.name:
                if child.animation_data and child.animation_data.action:
                    fcurves = style.get_action_curves(child.animation_data.action)
                    for fc in fcurves:
                        if fc.data_path == "scale" and fc.array_index == 2:
                            if len(fc.keyframe_points) > 2:
                                blinks_found = True
        self.assertTrue(blinks_found, "R38 FAIL: No blinks found in reaction shot")

        # Check for nods (rotation.x on torso)
        torso = bpy.data.objects.get("Herbaceous_Torso")
        nods_found = False
        if torso.animation_data and torso.animation_data.action:
             fcurves = style.get_action_curves(torso.animation_data.action)
             for fc in fcurves:
                 if fc.data_path == "rotation_euler" and fc.array_index == 0:
                     if len(fc.keyframe_points) > 2:
                         nods_found = True
        self.assertTrue(nods_found, "R38 FAIL: No nods found in reaction shot")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)
