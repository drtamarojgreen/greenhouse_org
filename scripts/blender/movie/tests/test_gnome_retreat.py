import bpy
import os
import sys
import unittest
import math
import mathutils

# Add movie root to path for local imports
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

import silent_movie_generator
import style

class TestGnomeRetreat(unittest.TestCase):
    def setUp(self):
        self.master = silent_movie_generator.MovieMaster()
        self.master.load_assets()
        # Point 54: Robust imports for scene logic
        try:
            import scene18_dialogue.scene_logic as s18
            import scene19_dialogue.scene_logic as s19
            import scene20_dialogue.scene_logic as s20
            import scene21_dialogue.scene_logic as s21
            import scene22_retreat.scene_logic as s22
        except ImportError:
            # Fallback to dynamic import if needed
            def dynamic_import(name):
                return __import__(f"{name}.scene_logic", fromlist=['scene_logic'])
            s18 = dynamic_import("scene18_dialogue")
            s19 = dynamic_import("scene19_dialogue")
            s20 = dynamic_import("scene20_dialogue")
            s21 = dynamic_import("scene21_dialogue")
            s22 = dynamic_import("scene22_retreat")

        s18.setup_scene(self.master)
        s19.setup_scene(self.master)
        s20.setup_scene(self.master)
        s21.setup_scene(self.master)
        s22.setup_scene(self.master)

    def test_42_retreat_path_exists(self):
        """R42: Antagonist retreat path existence."""
        gnome = self.master.gnome
        self.assertIsNotNone(gnome)

        # Check location keyframes in scene 22 range
        s22_range = silent_movie_generator.SCENE_MAP['scene22']
        curves = style.get_action_curves(gnome.animation_data.action)

        loc_keys = []
        for fc in curves:
            if fc.data_path == "location":
                for kp in fc.keyframe_points:
                    if s22_range[0] <= kp.co[0] <= s22_range[1]:
                        loc_keys.append(kp.co[0])
        self.assertGreater(len(loc_keys), 1, "R42 FAIL: No movement path found for gnome in retreat scene")

    def test_44_speed_ramp(self):
        """R44: Retreat speed ramp behavior."""
        gnome = self.master.gnome
        s22_range = silent_movie_generator.SCENE_MAP['scene22']

        # Sample distance moved at beginning vs end of retreat
        # Start of scene 22: he stumbles/hesitates
        # End of scene 22: he sprints

        def get_pos(frame):
            # Minimal simulation of keyframe evaluation if possible,
            # or just look at keyframe values.
            # In our setup we have (start+300) and (end-50)
            curves = style.get_action_curves(gnome.animation_data.action)
            pos = mathutils.Vector((0,0,0))
            for fc in curves:
                if fc.data_path == "location":
                    pos[fc.array_index] = fc.evaluate(frame)
            return pos

        pos_start = get_pos(s22_range[0] + 150) # During hesitation
        pos_mid = get_pos(s22_range[0] + 250)
        pos_end = get_pos(s22_range[1] - 50) # During sprint

        dist_1 = (pos_mid - pos_start).length
        dist_2 = (pos_end - pos_mid).length

        # Sprint should cover more ground than hesitation
        self.assertGreater(dist_2, dist_1, "R44 FAIL: No speed ramp detected in retreat")

    def test_45_off_screen_state(self):
        """R45: Antagonist final off-screen or occluded state."""
        gnome = self.master.gnome
        credits_start = silent_movie_generator.SCENE_MAP['scene12_credits'][0]

        # Check hide_render at end of retreat
        hide_found = False
        curves = style.get_action_curves(gnome.animation_data.action)
        for fc in curves:
            if fc.data_path == "hide_render":
                for kp in fc.keyframe_points:
                    if kp.co[0] >= credits_start - 10:
                        if kp.co[1] == 1.0: # True
                            hide_found = True
        self.assertTrue(hide_found, "R45 FAIL: Gnome not hidden before credits")

    def test_48_no_teleport_jumps(self):
        """R48: No teleport jumps during retreat."""
        gnome = self.master.gnome
        s22_range = silent_movie_generator.SCENE_MAP['scene22']

        last_pos = None
        for f in range(s22_range[0], s22_range[1], 10):
            current_pos = mathutils.Vector((0,0,0))
            for fc in gnome.animation_data.action.fcurves:
                if fc.data_path == "location":
                    current_pos[fc.array_index] = fc.evaluate(f)

            if last_pos is not None:
                dist = (current_pos - last_pos).length
                # Max plausible jump per 10 frames: 5 units?
                self.assertLess(dist, 10, f"R48 FAIL: Large teleport jump of {dist} detected at frame {f}")
            last_pos = current_pos

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)
