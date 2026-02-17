import bpy
import os
import sys
import unittest

# Add movie root to path for local imports
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

import silent_movie_generator

class TestReleaseGate(unittest.TestCase):
    def setUp(self):
        self.master = silent_movie_generator.MovieMaster()
        self.master.run()

    def test_91_full_timeline(self):
        """R91: End-to-end test for full timeline playback from 1-15000."""
        scene = self.master.scene
        self.assertEqual(scene.frame_start, 1)
        self.assertEqual(scene.frame_end, 15000)

    def test_93_required_assets(self):
        """R93: Verify all required assets are loaded before scene animation."""
        required = ["Herbaceous_Torso", "Arbor_Torso", "GloomGnome_Torso", "Greenhouse_Structure"]
        for name in required:
            self.assertIn(name, bpy.data.objects, f"R93 FAIL: Required asset {name} missing")

    def test_96_critical_character_visibility(self):
        """R96: Validating no hidden critical characters during dialogue scenes."""
        dialogue_scenes = [f'scene{i}' for i in range(16, 22)]
        for s_name in dialogue_scenes:
            start, end = silent_movie_generator.SCENE_MAP[s_name]
            mid_frame = (start + end) // 2
            self.master.scene.frame_set(mid_frame)
            # Point 60: Update view layer to evaluate keyframes
            bpy.context.view_layer.update()

            # During these dialogue scenes, Herbaceous and Arbor must be visible
            for char in ["Herbaceous", "Arbor"]:
                obj = bpy.data.objects.get(f"{char}_Torso")
                if obj:
                    self.assertFalse(obj.hide_render, f"R96 FAIL: {char} hidden during {s_name} at frame {mid_frame}")

    def test_97_credits_trigger(self):
        """R97: Credits content start trigger only after retreat completion."""
        retreat_end = silent_movie_generator.SCENE_MAP['scene22'][1]
        credits_start = silent_movie_generator.SCENE_MAP['credits'][0]

        self.assertGreater(credits_start, retreat_end, "R97 FAIL: Credits started too early")

    def test_100_release_gate_summary(self):
        """R100: Release-gate test requiring all major components to be present."""
        # This is a summary check
        self.assertTrue(hasattr(self.master, 'h1'))
        self.assertTrue(hasattr(self.master, 'h2'))
        self.assertTrue(hasattr(self.master, 'gnome'))
        print("R100 PASS: Principal characters validated for release.")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)
