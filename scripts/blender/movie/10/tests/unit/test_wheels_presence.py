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

class TestMovie10Wheels(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manager = AssetManager()
        cls.manager.clear_scene()

    def test_greenhouse_mobile_wheels(self):
        """Verifies that the GreenhouseMobile has 4 grounded wheels."""
        entity = {
            "id": "TestMobile",
            "type": "DYNAMIC",
            "components": { "modeling": "GreenhouseMobileModeler" }
        }
        char = CharacterBuilder.create("TestMobile", entity)
        char.build(self.manager)

        obj = bpy.data.objects.get("TestMobile")
        self.assertIsNotNone(obj, "Mobile object not created")
        bpy.context.view_layer.update()

        wheels = [c for c in obj.children_recursive if "Wheel" in c.name and c.type == 'MESH']
        self.assertEqual(len(wheels), 4, f"Expected 4 wheels, found {len(wheels)}")

        for wheel in wheels:
            # Check grounding (Z should be near 0 at the bottom)
            bottom_z = min((wheel.matrix_world @ mathutils.Vector(corner)).z for corner in wheel.bound_box)
            self.assertAlmostEqual(bottom_z, 0.0, delta=0.05)
