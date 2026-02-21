import unittest
import os
import sys
import bpy

# Add movie root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from silent_movie_generator import MovieMaster
import style_utilities as style

class BlenderTestCase(unittest.TestCase):
    _master_initialized = False
    master = None

    @staticmethod
    def _movie_state_ready():
        """Return True only when a full movie pass appears to be present."""
        h1 = bpy.data.objects.get("Herbaceous")
        cam = bpy.context.scene.camera
        cam_target = bpy.data.objects.get("CamTarget")

        if not h1 or not cam or not cam_target:
            return False

        if not (h1.animation_data and h1.animation_data.action):
            return False
        if not (cam.animation_data and cam.animation_data.action):
            return False

        h1_curves = style.get_action_curves(h1.animation_data.action)
        cam_curves = style.get_action_curves(cam.animation_data.action)

        # After partial scene-module tests we may only have a handful of keys;
        # a complete build has broad timeline coverage and many channels.
        if len(h1_curves) < 10 or len(cam_curves) < 3:
            return False

        has_late_key = any(
            kp.co[0] >= 14000
            for fc in h1_curves
            for kp in fc.keyframe_points
        )
        has_cam_span = any(
            len(fc.keyframe_points) > 1 and (max(kp.co[0] for kp in fc.keyframe_points) - min(kp.co[0] for kp in fc.keyframe_points)) >= 1000
            for fc in cam_curves
            if "location" in fc.data_path
        )

        return has_late_key and has_cam_span

    @classmethod
    def setUpClass(cls):
        # Singleton initialization to avoid regenerating scene for every test file.
        # Rebuild whenever earlier tests left us with a partially animated state.
        if not cls._master_initialized or not cls._movie_state_ready():
            cls.master = MovieMaster(mode='SILENT_FILM')
            cls.master.run()
            cls._master_initialized = True

    def log_result(self, name, status, details=""):
        icon = "✓" if status == "PASS" else ("!" if status == "WARNING" else "✗")
        print(f"[{icon}] {name:<40} : {status} ({details})")
