import unittest
import bpy
import os
import sys

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M7_ROOT = os.path.dirname(TEST_DIR)

if M7_ROOT not in sys.path: sys.path.insert(0, M7_ROOT)

from asset_manager import AssetManager
from character_builder import CharacterBuilder

class TestMovie7Fidelity(unittest.TestCase):
    def setUp(self):
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_foliage_density(self):
        """Verifies high-fidelity foliage generation."""
        cfg = {"id": "Tree", "type": "DYNAMIC", "components": {"modeling": "PlantModeler"}, "parameters": {"foliage": {"density": 100}}}
        char = CharacterBuilder.create("Tree", cfg); char.build(self.manager)
        self.assertGreater(len(char.mesh.data.vertices), 1000)

    def test_facial_prop_attachment(self):
        """Verifies facial props are correctly parented to bones."""
        cfg = {"id": "FaceChar", "type": "DYNAMIC", "components": {"modeling": "PlantModeler", "rigging": "PlantRigger"}}
        char = CharacterBuilder.create("FaceChar", cfg); char.build(self.manager)

        eye = bpy.data.objects.get("FaceChar_Eye_L")
        self.assertIsNotNone(eye)
        self.assertEqual(eye.parent, char.rig)
        # bone name fix in plant rigger wassx*0.14
        self.assertIn("Eye.L", eye.parent_bone)

if __name__ == "__main__":
    unittest.main()
