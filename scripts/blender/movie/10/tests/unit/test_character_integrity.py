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

class TestCharacterIntegrity(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager()
        self.manager.clear_scene()

    def test_armature_count_matches_ensemble(self):
        entities = mc.get("ensemble.entities", [])
        expected_rigs = 0
        for ent in entities:
            if ent.get("type") == "DYNAMIC":
                expected_rigs += 1 if ent.get("components", {}).get("rigging") else 0
            else:
                expected_rigs += 1 if ent.get("source_rig") else 0

        for ent in entities:
            char = CharacterBuilder.create(ent["id"], ent)
            char.build(self.manager)

        actual_rigs = len([o for o in bpy.data.objects if o.type == "ARMATURE" and o.name.endswith(".Rig")])
        self.assertEqual(actual_rigs, expected_rigs)


if __name__ == "__main__":
    unittest.main()
