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

sys.path.append(os.path.join(MOVIE_ROOT, "tests"))
from base_test import BlenderTestCase

import silent_movie_generator
import style

class TestGnomeRetreat(BlenderTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        try:
            import scene18_dialogue.scene_logic as s18
            import scene19_dialogue.scene_logic as s19
            import scene20_dialogue.scene_logic as s20
            import scene21_dialogue.scene_logic as s21
            import scene22_retreat.scene_logic as s22
        except ImportError:
            def dynamic_import(name):
                return __import__(f"{name}.scene_logic", fromlist=['scene_logic'])
            s18 = dynamic_import("scene18_dialogue")
            s19 = dynamic_import("scene19_dialogue")
            s20 = dynamic_import("scene20_dialogue")
            s21 = dynamic_import("scene21_dialogue")
            s22 = dynamic_import("scene22_retreat")

        # Setup all scenes once for the whole class
        s18.setup_scene(cls.master)
        s19.setup_scene(cls.master)
        s20.setup_scene(cls.master)
        s21.setup_scene(cls.master)
        s22.setup_scene(cls.master)

    def test_42_retreat_path_exists(self):
        """R42: Antagonist retreat path existence."""
        gnome = self.master.gnome
        self.assertIsNotNone(gnome)

        s22_range = silent_movie_generator.SCENE_MAP['scene22_retreat']
        curves = style.get_action_curves(gnome.animation_data.action)

        loc_keys = []
        for fc in curves:
            if "location" in fc.data_path:
                for kp in fc.keyframe_points:
                    if s22_range[0] <= kp.co[0] <= s22_range[1]:
                        loc_keys.append(kp.co[0])
        self.assertGreater(len(loc_keys), 1, "R42 FAIL: No movement path found for gnome in retreat scene")

    def test_45_off_screen_state(self):
        """R45: Antagonist final off-screen or occluded state."""
        gnome = self.master.gnome
        credits_start = silent_movie_generator.SCENE_MAP['scene12_credits'][0]

        hide_found = False
        curves = style.get_action_curves(gnome.animation_data.action)
        for fc in curves:
            if "hide_render" in fc.data_path:
                for kp in fc.keyframe_points:
                    if kp.co[0] >= credits_start - 10:
                        if kp.co[1] > 0.5: # True
                            hide_found = True
        self.assertTrue(hide_found, "R45 FAIL: Gnome not hidden before credits")

    def test_44_speed_ramp(self):
        """R44: Retreat speed ramp behavior."""
        gnome = self.master.gnome
        s22_range = silent_movie_generator.SCENE_MAP['scene22_retreat']

        def get_pos(frame):
            curves = style.get_action_curves(gnome.animation_data.action)
            pos = mathutils.Vector((0,0,0))
            for fc in curves:
                if "location" in fc.data_path:
                    pos[fc.array_index] = fc.evaluate(frame)
            return pos

        pos_start = get_pos(s22_range[0] + 150) 
        pos_mid = get_pos(s22_range[0] + 250)
        pos_end = get_pos(s22_range[1] - 50) 

        dist_1 = (pos_mid - pos_start).length
        dist_2 = (pos_end - pos_mid).length
        self.assertGreater(dist_2, dist_1, "R44 FAIL: No speed ramp detected in retreat")

    def test_48_no_teleport_jumps(self):
        """R48: No teleport jumps during retreat."""
        gnome = self.master.gnome
        s22_range = silent_movie_generator.SCENE_MAP['scene22_retreat']

        last_pos = None
        for f in range(s22_range[0], s22_range[1], 50):
            current_pos = mathutils.Vector((0,0,0))
            curves = style.get_action_curves(gnome.animation_data.action)
            for fc in curves:
                if "location" in fc.data_path:
                    current_pos[fc.array_index] = fc.evaluate(f)

            if last_pos is not None:
                dist = (current_pos - last_pos).length
                self.assertLess(dist, 20, f"R48 FAIL: Large teleport jump of {dist} detected at frame {f}")
            last_pos = current_pos

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)
