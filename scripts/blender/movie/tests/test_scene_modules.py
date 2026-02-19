import bpy
import os
import sys
import unittest
import importlib

# Add movie root to path for local imports
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

sys.path.append(os.path.join(MOVIE_ROOT, "tests"))
from base_test import BlenderTestCase

import silent_movie_generator
import style

class TestSceneModules(BlenderTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.scene_names = [f'scene{i}_dialogue' for i in range(16, 22)] + ['scene22_retreat']

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

    def test_13_14_15_smoke_and_state_tests(self):
        """R13/14/15: Invoke scene setup, check for crashes."""
        # Use a copy of the list to avoid mutating during iteration if needed
        for name in self.scene_names:
            with self.subTest(scene=name):
                # Clear animation data
                for obj in bpy.data.objects:
                    obj.animation_data_clear()

                mod = importlib.import_module(name + ".scene_logic")
                
                initial_object_count = len(bpy.data.objects)
                # Smoke test
                try:
                    mod.setup_scene(self.master)
                except Exception as e:
                    self.fail(f"R13/R14 FAIL: {name}.setup_scene crashed: {e}")

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
                        if len(style.get_action_curves(obj.animation_data.action)) > 0:
                            has_keyframes = True
                            break
                self.assertTrue(has_keyframes, f"R17 FAIL: {name} created no keyframes")
