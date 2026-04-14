import unittest
import bpy
import os
import sys

# Standardize path injection for movie/6 assets
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

import config
import generate_scene6

class TestLightingPresence(unittest.TestCase):

    def test_lighting_creation(self):
        """Verifies that lights are created for characters."""
        generate_scene6.generate_full_scene_v6()

        found_rim = 0
        found_key = 0
        found_leg = 0

        for obj in bpy.data.objects:
            if obj.type == 'LIGHT':
                if "RimLight" in obj.name: found_rim += 1
                if "HeadKey" in obj.name: found_key += 1
                if "LegKey" in obj.name: found_leg += 1

        self.assertGreater(found_rim, 0, "No rim lights found")
        self.assertGreater(found_key, 0, "No key lights found")
        self.assertGreater(found_leg, 0, "No leg lights found")

if __name__ == "__main__":
    unittest.main()
