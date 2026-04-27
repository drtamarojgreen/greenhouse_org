import unittest
import bpy
import os
import sys

# Standard Path setup for tests
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M7_ROOT = os.path.dirname(TEST_DIR)

if M7_ROOT not in sys.path:
    sys.path.insert(0, M7_ROOT)

from asset_manager import AssetManager
from character_builder import CharacterBuilder
import components

class TestMovie7GreenhouseMobile(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_mobile_asset_generation(self):
        """Verifies that the GreenhouseMobile vehicle is built with correct sub-components."""
        from config import config
        cfg = config.get_character_config("GreenhouseMobile")
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
