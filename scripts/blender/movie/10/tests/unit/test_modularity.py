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

class TestMovie10Modularity(unittest.TestCase):

    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager()
        self.director = Director()
        self.manager.clear_scene()

    def test_universal_build_data_driven(self):
        """Verifies that a character is built purely from geometry and props data."""
        cfg = mc.get_character_config("Herbaceous_HF")
        char = CharacterBuilder.create("Herbaceous_HF", cfg)
        char.build(self.manager)

        # Verify prop objects exist (from structure.props)
        prop_names = [o.name for o in char.rig.children if o != char.body]
        self.assertTrue(any("Eye_L" in n for n in prop_names))

    def test_environment_modular_build(self):
        """Verifies that ExteriorModeler creates complex environment from mc."""
        from environment.exterior import ExteriorModeler
        mod = ExteriorModeler()
        mod.build_mesh("TestEnv", mc.get("environment", {}))

        self.assertIn("interior_floor", bpy.data.objects)
        self.assertIn("mountain_range", bpy.data.objects)
        self.assertIn("greenhouse_roof", bpy.data.objects)

    def test_backdrop_modular_build(self):
        """Verifies Chroma backdrops are built from mc."""
        from environment.backdrop import BackdropModeler
        mod = BackdropModeler()
        mod.build_mesh("Chroma", mc.get("chroma", {}))
        self.assertIn("chroma_backdrop_wide", bpy.data.objects)

    def test_director_cinematics_full(self):
        """Verifies all camera types from lights_camera.json."""
        self.director.setup_cinematics()
        self.assertIn("Ots1", bpy.data.objects)
        self.assertIn("Antag1", bpy.data.objects)
        self.assertIn("Exterior", bpy.data.objects)

    def test_director_sequencing_markers(self):
        """Verifies markers are correctly placed for Intro and Cycle."""
        self.director.setup_cinematics()
        self.director.apply_sequencing()
        markers = bpy.context.scene.timeline_markers
        self.assertTrue(any("Intro" in m.name for m in markers))
        self.assertTrue(any("Shot_Ots1" in m.name for m in markers))

if __name__ == "__main__":
    unittest.main()
