import unittest
import bpy
import os
import sys
import math

# Ensure Movie 7 is in path
M7_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_DIR not in sys.path:
    sys.path.append(M7_DIR)

from asset_manager import AssetManager
from character_builder import CharacterBuilder

class TestMovie6Parity(unittest.TestCase):

    def setUp(self):
        self.manager = AssetManager()
        self.manager.clear_scene()

    def test_procedural_rig_structure_parity(self):
        """Verifies that the M7 rig structure matches the M6 standard."""
        cfg = {"type": "DYNAMIC", "builder": "ProceduralCharacter"}
        char = CharacterBuilder.create("ParityChar", cfg)
        char.build(self.manager)

        # Check for core bones required by M6 animations
        required_bones = ["Torso", "Neck", "Head", "Arm.L", "Elbow.L", "Hand.L", "Hip.L", "Thigh.L", "Knee.L", "Foot.L"]
        for b in required_bones:
            self.assertIn(b, char.rig.pose.bones, f"Bone {b} missing - parity failure.")

        # Check for facial bones
        facial_bones = ["Eye.L", "Eye.R", "Eyelid.Upper.L", "Eyelid.Lower.L", "Nose", "Lip.Upper"]
        for b in facial_bones:
            self.assertIn(b, char.rig.pose.bones, f"Facial bone {b} missing.")

    def test_foliage_algorithm_parity(self):
        """Verifies that foliage generation follows the M6 algorithm."""
        cfg = {"type": "DYNAMIC", "builder": "ProceduralCharacter", "parameters": {"foliage": {"density": 50}}}
        char = CharacterBuilder.create("FoliageChar", cfg)
        char.build(self.manager)

        # Check mesh density
        self.assertGreater(len(char.mesh.data.vertices), 1000, "Mesh density too low for M6 parity.")

if __name__ == "__main__":
    unittest.main()
