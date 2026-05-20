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

class TestMovie10Comprehensive(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_full_production_cycle(self):
        """Verifies build, pose, and animate sequence."""
        cfg = mc.get_character_config("Herbaceous_HF")
        char = CharacterBuilder.create("Herbaceous_HF", cfg)
        char.build(self.manager)
        char.apply_pose()
        char.animate("idle", 1)

        self.assertIsNotNone(char.rig.animation_data)
        self.assertAlmostEqual(char.rig.location.x, cfg["default_pos"][0], places=4)

    def test_multiple_characters(self):
        """Verifies that building multiple characters doesn't cross-pollinate data."""
        h_cfg = mc.get_character_config("Herbaceous_HF")
        a_cfg = mc.get_character_config("Arbor_HF")

        h_char = CharacterBuilder.create("Herbaceous_HF", h_cfg)
        a_char = CharacterBuilder.create("Arbor_HF", a_cfg)

        h_char.build(self.manager)
        a_char.build(self.manager)

        self.assertNotEqual(h_char.body.name, a_char.body.name)
        self.assertNotEqual(h_char.rig.name, a_char.rig.name)

if __name__ == "__main__":
    unittest.main()
