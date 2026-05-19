import bpy
import unittest
import os
import sys

# Ensure Movie 10 root is in sys.path
M10_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M10_ROOT not in sys.path:
    sys.path.insert(0, M10_ROOT)

import movie_configuration as mc
from asset_manager import AssetManager
from character_builder import CharacterBuilder
from director import Director
import components

class TestV10Regressions(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        components.initialize_registry()
        cls.manager = AssetManager()
        cls.manager.clear_scene()

    def test_environment_restoration(self):
        """Verifies that torches, lavender, and statues are correctly built by ExteriorModeler."""
        director = Director()
        director.setup_environment()

        env_coll = bpy.data.collections.get("9b.ENVIRONMENT")
        self.assertIsNotNone(env_coll, "Environment collection not found")

        # Check for Torches
        torches = [obj for obj in env_coll.objects if "torch" in obj.name.lower()]
        self.assertGreater(len(torches), 0, "No torches found in environment")

        # Check for Lavender
        lavender = [obj for obj in env_coll.objects if "lavender" in obj.name.lower()]
        self.assertGreater(len(lavender), 0, "No lavender found in environment")

        # Check for Statues/Complex Pillars
        statues = [obj for obj in env_coll.objects if "statue" in obj.name.lower()]
        self.assertGreater(len(statues), 0, "No statues found in environment")

    def test_animation_tags_presence(self):
        """Verifies that new animation tags are supported by the CharacterBuilder."""
        char = CharacterBuilder.create("Herbaceous")
        # Just verify we can call animate with these tags without crash (logic will be implemented later)
        tags = ["grasp", "bend_down", "reach_out", "droop", "stretch", "wiggle"]
        for tag in tags:
            try:
                char.animate(tag, 1)
            except Exception as e:
                self.fail(f"Animation tag '{tag}' failed: {e}")

    def test_water_can_spout(self):
        """Verifies that the WaterCan is built with a spout."""
        char = CharacterBuilder.create("WaterCan")
        obj = char.build(self.manager)

        # ProceduralModeler builds geometry into the mesh. Check vertex groups.
        self.assertIn("Spout", obj.vertex_groups.keys(), "WaterCan missing Spout vertex group")

    def test_greenhouse_mobile_details(self):
        """Verifies that GreenhouseMobile respects detailed structural parameters."""
        char = CharacterBuilder.create("GreenhouseMobile")
        obj = char.build(self.manager)

        # Check for door and wheels as children
        children_names = [child.name.lower() for child in obj.children]
        self.assertTrue(any("door" in n for n in children_names), "GreenhouseMobile missing Door")
        self.assertTrue(any("wheel" in n for n in children_names), "GreenhouseMobile missing Wheels")

if __name__ == '__main__':
    unittest.main()
