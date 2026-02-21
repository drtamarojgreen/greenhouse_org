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

    @classmethod
    def setUpClass(cls):
        # Singleton initialization to avoid regenerating scene for every test file
        # Check if animation data actually exists on key objects
        has_anim = False
        if cls.master and cls.master.scene:
             h1 = bpy.data.objects.get("Herbaceous")
             if h1 and h1.animation_data and h1.animation_data.action:
                 has_anim = len(style.get_action_curves(h1.animation_data.action)) > 0

        if not cls._master_initialized or not has_anim:
            cls.master = MovieMaster(mode='SILENT_FILM')
            cls.master.run()
            cls._master_initialized = True

    def log_result(self, name, status, details=""):
        icon = "✓" if status == "PASS" else ("!" if status == "WARNING" else "✗")
        print(f"[{icon}] {name:<40} : {status} ({details})")