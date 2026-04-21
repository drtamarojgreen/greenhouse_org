import unittest
import bpy
import os
import sys

# Add M7 to path
M7_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_DIR not in sys.path: sys.path.append(M7_DIR)

from asset_manager import AssetManager
from character_builder import CharacterBuilder

class TestMovie7FinalParity(unittest.TestCase):
    def setUp(self):
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_complete_plant_build(self):
        """Verifies full OO building with all components and registration."""
        cfg = {
            "id": "Arbor", "type": "DYNAMIC",
            "components": { "modeling": "PlantModeler", "rigging": "PlantRigger", "shading": "PlantShader" },
            "parameters": { "dimensions": { "torso_h": 1.5, "head_r": 0.4, "neck_h": 0.2 }, "foliage": {"density": 10}, "materials": {} }
        }
        char = CharacterBuilder.create("Arbor", cfg)
        char.build(self.manager)

        # Rig Verification
        self.assertIsNotNone(char.rig)
        bones = char.rig.pose.bones
        for b in ["Torso", "Hand.L", "Foot.R", "Eye.L", "Nose", "Lip.Upper", "Chin"]:
            self.assertIn(b, bones, f"Bone {b} missing.")

        # Mesh Verification
        self.assertIsNotNone(char.mesh)
        self.assertGreater(len(char.mesh.data.vertices), 100)

        # Facial Prop Verification
        self.assertIn("Arbor_Eye_L", bpy.data.objects)
        self.assertIn("Arbor_Nose", bpy.data.objects)
        self.assertEqual(bpy.data.objects["Arbor_Eye_L"].parent, char.rig)

if __name__ == "__main__":
    unittest.main()
