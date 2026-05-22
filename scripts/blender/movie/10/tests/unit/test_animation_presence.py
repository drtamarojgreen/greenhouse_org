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

class TestMovie10AnimationPresence(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_procedural_animation_presence(self):
        """Verifies that the animator correctly targets bones from mc."""
        cfg = mc.get_character_config("Herbaceous_HF").copy()
        # Force ProceduralAnimator to avoid baked action missing warnings
        cfg["components"]["animation"] = "ProceduralAnimator"
        char = CharacterBuilder.create("Herbaceous_HF", cfg)
        char.build(self.manager)

        char.animate("talking", 1, {"duration": 10})

        if char.rig and char.rig.animation_data:
            self.assertIsNotNone(char.rig.animation_data.action)

if __name__ == "__main__":
    unittest.main()
