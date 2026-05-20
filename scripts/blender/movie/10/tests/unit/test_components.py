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

class TestComponentParity(unittest.TestCase):
    def setUp(self):
        self.manager = AssetManager()
        self.manager.clear_scene()

    def test_component_building(self):
        """Verifies that the character build correctly utilizes components."""
        entity = {
            "id": "CompChar",
            "type": "MESH",
            "is_protagonist": True,
            "components": {
                "modeling": "PlantModeler",
                "rigging": "PlantRigger",
                "shading": "UniversalShader"
            }
        }
        char = CharacterBuilder.create("CompChar", entity)
        char.build(self.manager)

        self.assertIsNotNone(char.rig)
        self.assertIsNotNone(char.body)
        # PlantModeler with eyes has multiple materials (Bark, Leaf, Iris, Pupil)
        self.assertGreaterEqual(len(char.body.data.materials), 1)

if __name__ == "__main__":
    unittest.main()
