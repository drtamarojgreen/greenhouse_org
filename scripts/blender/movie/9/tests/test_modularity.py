import unittest
import bpy
import os
import sys

# Ensure Movie 9 is in path
M9_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M9_DIR not in sys.path:
    sys.path.append(M9_DIR)

from config import config
from asset_manager import AssetManager
from director import Director
from registry import registry
from character_builder import CharacterBuilder
import components

class TestMovie9Modularity(unittest.TestCase):

    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager()
        self.director = Director()
        self.manager.clear_scene()

    def test_universal_build_data_driven(self):
        """Verifies that a character is built purely from geometry and props data."""
        cfg = config.get_character_config("Herbaceous")
        char = CharacterBuilder.create("Herbaceous", cfg)
        char.build(self.manager)

        # Verify prop objects exist (from structure.props)
        prop_names = [o.name for o in char.rig.children if o != char.mesh]
        self.assertTrue(any("Eye_L" in n for n in prop_names))

    def test_environment_modular_build(self):
        """Verifies that ExteriorModeler creates complex environment from config."""
        from environment.exterior import ExteriorModeler
        mod = ExteriorModeler()
        mod.build_mesh("TestEnv", config.get("environment", {}))

        self.assertIn("interior_floor", bpy.data.objects)
        self.assertIn("mountain_range", bpy.data.objects)
        self.assertIn("greenhouse_roof", bpy.data.objects)

    def test_backdrop_modular_build(self):
        """Verifies Chroma backdrops are built from config."""
        from environment.backdrop import BackdropModeler
        mod = BackdropModeler()
        mod.build_mesh("Chroma", config.get("chroma", {}))
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
