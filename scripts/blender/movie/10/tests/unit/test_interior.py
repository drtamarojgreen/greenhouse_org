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

class TestInteriorFurnishing(unittest.TestCase):
    def setUp(self):
        self.manager = AssetManager()
        self.manager.clear_scene()

    def test_interior_modeler_instantiation(self):
        """Verifies that InteriorModeler registers and can be instantiated."""
        from environment.interior import InteriorModeler
        modeler = InteriorModeler()
        self.assertIsNotNone(modeler)

    def test_interior_asset_creation(self):
        """Verifies that InteriorModeler creates all expected assets from JSON."""
        from environment.interior import InteriorModeler
        modeler = InteriorModeler()

        # We pass an empty dict for params, which should trigger loading of interior_assets.json
        modeler.build_mesh("Interior", {})

        expected = [
            "rack_front_left", "rack_front_right", "rack_rear_left", "rack_rear_right",
            "flower_bed_center", "flower_bed_left", "flower_bed_right",
            "pot_entrance_left", "pot_entrance_right",
            "chair_1", "chair_2",
            "end_table_left", "end_table_right",
            "tv_stand", "television", "tv_logo"
        ]

        for name in expected:
            self.assertIn(name, bpy.data.objects, f"Expected object '{name}' was not created.")

    def test_interior_hierarchy(self):
        """Verifies parenting relationships (TV -> Logo)."""
        from environment.interior import InteriorModeler
        InteriorModeler().build_mesh("Interior", {})

        tv = bpy.data.objects.get("television")
        logo = bpy.data.objects.get("tv_logo")
        self.assertIsNotNone(tv)
        self.assertIsNotNone(logo)
        self.assertEqual(logo.parent, tv, "TV Logo should be parented to the Television object.")

    def test_interior_materials(self):
        """Verifies that key materials (emission) are created."""
        from environment.interior import InteriorModeler
        InteriorModeler().build_mesh("Interior", {})

        self.assertIn("mat_tv_screen", bpy.data.materials)
        self.assertIn("mat_tv_logo", bpy.data.materials)

        mat_logo = bpy.data.materials["mat_tv_logo"]
        self.assertTrue(mat_logo.use_nodes)
        emit = next((n for n in mat_logo.node_tree.nodes if n.type == 'EMISSION'), None)
        self.assertIsNotNone(emit, "Logo material must have an Emission node.")

    def test_interior_animation_presence(self):
        """Verifies that the logo animation is keyed if 'animate' is true in mc."""
        from environment.interior import InteriorModeler

        # Load the real assets file to modify it for the test
        config_path = os.path.join(M10_ROOT, "environment", "interior_assets.json")
        with open(config_path, 'r') as f:
            cfg = json.load(f)

        # Ensure animate is true
        cfg["logo"]["animate"] = True
        temp_cfg_path = os.path.join(M10_ROOT, "environment", "test_interior_assets.json")
        with open(temp_cfg_path, 'w') as f:
            json.dump(cfg, f)
