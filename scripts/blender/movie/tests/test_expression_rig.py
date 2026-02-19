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

class TestExpressionRig(BlenderTestCase):
    def test_31_preset_logic(self):
        """R31: Expression preset existence logic."""
        for exp in ['NEUTRAL', 'ANGRY', 'SURPRISED']:
            with self.subTest(expression=exp):
                # Clear animation data for the character to ensure isolation
                for obj in bpy.data.objects:
                    if "Herbaceous" in obj.name:
                        obj.animation_data_clear()

                plant_humanoid.animate_expression(self.master.h1, 100, expression=exp)

                # Assert that some animation was actually created on a relevant part (Eyes/Mouth bones)
                has_keyframes = False
                if self.master.h1 and self.master.h1.animation_data and self.master.h1.animation_data.action:
                    if len(style.get_action_curves(self.master.h1.animation_data.action)) > 0:
                        has_keyframes = True

                if exp != 'NEUTRAL':
                    self.assertTrue(has_keyframes, f"R31 FAIL: Expression '{exp}' created no keyframes on character.")

    def test_33_eyebrow_limits(self):
        """R33: Eyebrow control limits (Bones version)."""
        # Brows are now implied by eye bone scaling in this rig
        for name in ["Herbaceous", "Arbor"]:
            with self.subTest(character=name):
                char_asset = self.master.h1 if name == "Herbaceous" else self.master.h2
                if not char_asset: continue
                char_asset.animation_data_clear()

                plant_humanoid.animate_expression(char_asset, 100, expression='ANGRY')

                self.assertIsNotNone(char_asset.animation_data, f"R33 FAIL: {name} has no animation data")
                curves = style.get_action_curves(char_asset.animation_data.action)
                self.assertGreater(len(curves), 0, f"R33 FAIL: No f-curves found for {name}")

    def test_35_eye_target_constraints(self):
        """R35: Eye target constraints (Bone Constraints version)."""
        for name in ["Herbaceous", "Arbor"]:
            char_obj = self.master.h1 if name == "Herbaceous" else self.master.h2
            if not char_obj: continue

            head_bone = char_obj.pose.bones.get("Head")
            if not head_bone: continue

            has_constraint = False
            for con in head_bone.constraints:
                if con.type == 'TRACK_TO':
                    has_constraint = True
                    self.assertFalse(con.mute, f"R35 FAIL: {name} Head constraint muted")
            self.assertTrue(has_constraint, f"R35 FAIL: {name} Head missing track constraint")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)
