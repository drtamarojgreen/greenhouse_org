import unittest
import os
import sys
import bpy

# Add movie root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from silent_movie_generator import MovieMaster
import style

class BlenderTestCase(unittest.TestCase):
    _master_initialized = False
    master = None

    @classmethod
    def setUpClass(cls):
        # Singleton initialization to avoid regenerating scene for every test file
        if not cls._master_initialized:
            cls.master = MovieMaster(mode='SILENT_FILM')
            cls.master.run()
            cls._master_initialized = True

    def log_result(self, name, status, details=""):
        icon = "✓" if status == "PASS" else ("!" if status == "WARNING" else "✗")
        print(f"[{icon}] {name:<40} : {status} ({details})")