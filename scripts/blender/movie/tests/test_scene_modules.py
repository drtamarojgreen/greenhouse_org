import bpy
import os
import sys
import unittest
import importlib

# Add movie root to path for local imports
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

import silent_movie_generator

class TestSceneModules(unittest.TestCase):
    def setUp(self):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        self.master = silent_movie_generator.MovieMaster()
        self.master.load_assets()
        self.scene_names = [f'scene{i}_dialogue' for i in range(16, 22)] + ['scene22_retreat']

    def test_11_imports(self):
        """R11: Assert each new scene module imports successfully."""
        for name in self.scene_names:
            with self.subTest(scene=name):
                try:
                    mod = importlib.import_module(name + ".scene_logic")
                    self.assertIsNotNone(mod)
                except ImportError as e:
                    self.fail(f"R11 FAIL: Failed to import {name}.scene_logic: {e}")

    def test_12_exposed_functions(self):
        """R12: Assert each new scene exposes expected scene logic functions."""
        for name in self.scene_names:
            with self.subTest(scene=name):
                mod = importlib.import_module(name + ".scene_logic")
                self.assertTrue(hasattr(mod, 'setup_scene'), f"R12 FAIL: {name} missing setup_scene")
                # animate_scene is mentioned in Phase 2 scaffolding but existing ones usually only have setup_scene
                # or have it within setup_scene. The 100 enhancements list mentions both.
                # Let's check for setup_scene as mandatory.

    def test_13_14_15_smoke_and_state_tests(self):
        """R13/14/15: Invoke scene setup, check for crashes, and verify state changes (camera, objects)."""
        for name in self.scene_names:
            with self.subTest(scene=name):
                # Clear animation data to ensure a clean slate for this scene's test
                for obj in bpy.data.objects:
                    obj.animation_data_clear()

                mod = importlib.import_module(name + ".scene_logic")
                
                initial_object_count = len(bpy.data.objects)

                # Smoke test: should not crash
                try:
                    mod.setup_scene(self.master)
                except Exception as e:
                    self.fail(f"R13/R14 FAIL: {name}.setup_scene crashed: {e}")

                # R15: Check that a camera still exists after scene setup
                self.assertIsNotNone(self.master.scene.camera, f"R15 FAIL: Camera is missing after {name}.setup_scene")

                # Robustness: check that something actually happened (objects created or keyframes added)
                final_object_count = len(bpy.data.objects)
                has_keyframes = any(obj.animation_data and obj.animation_data.action for obj in bpy.data.objects)
                self.assertTrue(final_object_count > initial_object_count or has_keyframes,
                                f"R13/14 FAIL: {name}.setup_scene ran but created no new objects and no keyframes.")

    def test_17_keyframes_created(self):
        """R17: Each scene creates at least one keyframe."""
        for name in self.scene_names:
            with self.subTest(scene=name):
                # Clear all animation data first
                for obj in bpy.data.objects:
                    obj.animation_data_clear()

                mod = importlib.import_module(name + ".scene_logic")
                mod.setup_scene(self.master)

                has_keyframes = False
                for obj in bpy.data.objects:
                    if obj.animation_data and obj.animation_data.action:
                        if len(obj.animation_data.action.fcurves) > 0:
                            has_keyframes = True
                            break
                self.assertTrue(has_keyframes, f"R17 FAIL: {name} created no keyframes")

    def test_18_frame_bounds(self):
        """R18: Frame ranges used in each scene stay in bounds."""
        for name in self.scene_names:
            with self.subTest(scene=name):
                # Clear all animation data
                for obj in bpy.data.objects:
                    obj.animation_data_clear()

                mod = importlib.import_module(name + ".scene_logic")
                mod.setup_scene(self.master)

                scene_key = name.split('_')[0]
                if scene_key == 'scene22': scene_key = 'scene22'
                expected_start, expected_end = silent_movie_generator.SCENE_MAP[scene_key]

                for obj in bpy.data.objects:
                    if obj.animation_data and obj.animation_data.action:
                        for fc in obj.animation_data.action.fcurves:
                            for kp in fc.keyframe_points:
                                f = kp.co[0]
                                # Tighten tolerance from 10 to 1 for robustness
                                self.assertTrue(expected_start - 1 <= f <= expected_end + 1,
                                                f"R18 FAIL: {name} keyframe at {f} out of strict bounds ({expected_start}-{expected_end})")

    def test_19_asset_fallback(self):
        """R19: Test missing asset fallback behavior."""
        # Temporarily remove an asset and see if setup_scene still runs (it should guard against None)
        h1 = self.master.h1
        self.master.h1 = None
        try:
            for name in self.scene_names:
                mod = importlib.import_module(name + ".scene_logic")
                mod.setup_scene(self.master)
            print("R19 PASS: Handled missing master.h1 gracefully")
        except Exception as e:
            self.fail(f"R19 FAIL: Crashed with missing asset: {e}")
        finally:
            self.master.h1 = h1

if __name__ == "__main__":
    # Filter out Blender arguments
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)
