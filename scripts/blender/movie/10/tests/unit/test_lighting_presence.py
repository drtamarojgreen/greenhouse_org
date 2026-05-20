import json
import math
import os
import sys
import unittest

try:
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M10_ROOT = os.path.abspath(os.path.join(TEST_DIR, "..", ".."))
M9_ROOT = os.path.abspath(os.path.join(M10_ROOT, "..", "9"))

if M10_ROOT not in sys.path:
    sys.path.insert(0, M10_ROOT)
if M9_ROOT not in sys.path:
    sys.path.append(M9_ROOT)

import movie_configuration as mc
from asset_manager import AssetManager
from director import Director
from render import build_scene
from animation_handler import AnimationHandler
from character_builder import CharacterBuilder
from modeling.greenhouse_mobile import GreenhouseMobileModeler
import components

class TestMovie10LightingPresence(unittest.TestCase):
    def test_lighting_rig_presence(self):
        """Ported from M6: Verifies that lighting objects are created."""
        d = Director(); d.setup_lighting()
        self.assertGreater(len([o for o in bpy.data.objects if o.type == 'LIGHT']), 0)

if __name__ == "__main__":
    unittest.main()
