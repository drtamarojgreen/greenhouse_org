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
        for exp in ['NEUTRAL', 'ANGRY', 'SURPRISED']:
            with self.subTest(expression=exp):
                # Clear animation data for the character to ensure isolation
                for obj in bpy.data.objects:
                    if "Herbaceous" in obj.name:
                        obj.animation_data_clear()

                plant_humanoid.animate_expression(self.master.h1, 100, expression=exp)

                # Assert that some animation was actually created on a relevant part (brows are a good proxy)
                brow_l = bpy.data.objects.get("Herbaceous_Brow_L")
                has_keyframes = False
                if brow_l and brow_l.animation_data and brow_l.animation_data.action:
                    if len(style.get_action_curves(brow_l.animation_data.action)) > 0:
                        has_keyframes = True

                # Neutral might not create keyframes, but other expressions must.
                if exp != 'NEUTRAL':
                    self.assertTrue(has_keyframes, f"R31 FAIL: Expression '{exp}' created no keyframes on brow.")

    def test_33_eyebrow_limits(self):
        """R33: Eyebrow control limits."""
        for name in ["Herbaceous", "Arbor"]:
            with self.subTest(character=name):
                # Isolate test by clearing previous animation data for the character
                for obj in bpy.data.objects:
                    if name in obj.name:
                        obj.animation_data_clear()

                char_asset = self.master.h1 if name == "Herbaceous" else self.master.h2
                if not char_asset:
                    self.skipTest(f"Character asset for {name} not loaded.")
                    continue

                # Animate the character for this loop iteration
                plant_humanoid.animate_expression(char_asset, 100, expression='ANGRY')
                plant_humanoid.animate_expression(char_asset, 200, expression='SURPRISED')

                for side in ["L", "R"]:
                    brow = bpy.data.objects.get(f"{name}_Brow_{side}")
                    if not brow: continue

                    self.assertIsNotNone(brow.animation_data, f"R33 FAIL: {brow.name} has no animation data")
                    self.assertIsNotNone(brow.animation_data.action, f"R33 FAIL: {brow.name} has no action")

                    curves = style.get_action_curves(brow.animation_data.action)
                    self.assertGreater(len(curves), 0, f"R33 FAIL: No f-curves found for {brow.name}")

                    for fc in curves:
                        if fc.data_path == "rotation_euler" and fc.array_index == 1: # Y-axis rotation
                            self.assertGreater(len(fc.keyframe_points), 0, f"R33 FAIL: No keyframes on Y-rotation for {brow.name}")
                            for kp in fc.keyframe_points:
                                val = kp.co[1]
                                deg = math.degrees(val)
                                # Restore stricter bounds. If this fails, it indicates a real issue.
                                self.assertTrue(40 <= deg <= 140, f"R33 FAIL: {brow.name} rotation {deg} out of strict bounds (40-140)")

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
        for obj in bpy.data.objects: obj.animation_data_clear()

        style.animate_reaction_shot("Herbaceous", 100, 500)

        # Check for blinks (scale.z on eyes approaching zero)
        head = bpy.data.objects.get("Herbaceous_Head")
        blink_motion_found = False
        for child in head.children:
            if "Eye" in child.name and child.animation_data and child.animation_data.action:
                with self.subTest(eye=child.name):
                    fcurves = style.get_action_curves(child.animation_data.action)
                    for fc in fcurves:
                        if fc.data_path == "scale" and fc.array_index == 2: # Z-scale
                            values = [kp.co[1] for kp in fc.keyframe_points]
                            # A blink requires at least one keyframe to be near zero
                            if any(v < 0.1 for v in values):
                                blink_motion_found = True
                                break
                    if blink_motion_found: break
        self.assertTrue(blink_motion_found, "R38 FAIL: No blink motion (scale.z near zero) found in reaction shot")

        # Check for nods (rotation.x on torso changing value)
        torso = bpy.data.objects.get("Herbaceous_Torso")
        nod_motion_found = False
        if torso.animation_data and torso.animation_data.action:
             fcurves = style.get_action_curves(torso.animation_data.action)
             for fc in fcurves:
                 if fc.data_path == "rotation_euler" and fc.array_index == 0: # X-rotation
                     values = [kp.co[1] for kp in fc.keyframe_points]
                     # A nod requires rotation to change significantly from the initial state
                     if len(values) > 1 and (max(values) - min(values)) > 0.1: # ~5.7 degrees change
                         nod_motion_found = True
                         break
        self.assertTrue(nod_motion_found, "R38 FAIL: No significant nod motion (rotation.x) found in reaction shot")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)
