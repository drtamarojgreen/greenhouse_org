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

class TestMovie10GreenhouseMobile(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_mobile_asset_generation(self):
        """Verifies that the GreenhouseMobile vehicle is built with correct sub-components."""
        cfg = mc.get_character_config("GreenhouseMobile")
        self.assertIsNotNone(cfg)

        char = CharacterBuilder.create("GreenhouseMobile", cfg)
        char.build(self.manager)

        obj = bpy.data.objects.get("GreenhouseMobile")
        self.assertIsNotNone(obj)

        # Check for sub-components (Wheels, BedPlant)
        children_names = [c.name for c in obj.children]
        # El Camino design has Wheels and BedPlants instead of a sliding hatch door
        self.assertTrue(any("Wheel" in n for n in children_names))
        self.assertTrue(any("BedPlant" in n for n in children_names))

        # Check if it's tagged as GreenhouseMobile
        self.assertEqual(obj.name, "GreenhouseMobile")

if __name__ == "__main__":
    unittest.main()
