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

class TestMovie10Fidelity(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_mesh_smoothness(self):
        """Verifies that all generated faces are set to smooth."""
        cfg = mc.get_character_config("Herbaceous_HF")
        char = CharacterBuilder.create("Herbaceous_HF", cfg)
        char.build(self.manager)

        for poly in char.body.data.polygons:
            self.assertTrue(poly.use_smooth)

    def test_prop_attachment_fidelity(self):
        """Verifies that props are correctly parented to bones."""
        cfg = mc.get_character_config("Herbaceous_HF")
        char = CharacterBuilder.create("Herbaceous_HF", cfg)
        char.build(self.manager)

        eyes = [o for o in char.rig.children if "Eye" in o.name]
        for eye in eyes:
            self.assertEqual(eye.parent_type, 'BONE')
            # Allow sub-bones of Head (Eye.L, Eye.R etc)
            self.assertTrue("Head" in eye.parent_bone or "Eye" in eye.parent_bone)

if __name__ == "__main__":
    unittest.main()
