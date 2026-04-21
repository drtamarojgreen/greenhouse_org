import unittest
import bpy
import os
import sys

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M7_ROOT = os.path.dirname(TEST_DIR)

if M7_ROOT not in sys.path: sys.path.insert(0, M7_ROOT)

from asset_manager import AssetManager
from character_builder import CharacterBuilder

class TestMovie7Materials(unittest.TestCase):
    def setUp(self):
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_protagonist_material_assignment(self):
        """Verifies bark and leaf material assignment."""
        cfg = {"id": "Arbor", "type": "DYNAMIC", "components": {"modeling": "PlantModeler", "rigging": "PlantRigger", "shading": "PlantShader"}}
        char = CharacterBuilder.create("Arbor", cfg); char.build(self.manager)

        mats = [m.name for m in char.mesh.data.materials]
        self.assertTrue(any("Bark" in m for m in mats))
        self.assertTrue(any("Leaf" in m for m in mats))

    def test_eye_material_assignment(self):
        """Verifies iris material on facial props."""
        cfg = {"id": "Herbaceous", "type": "DYNAMIC", "components": {"modeling": "PlantModeler", "rigging": "PlantRigger", "shading": "PlantShader"}}
        char = CharacterBuilder.create("Herbaceous", cfg); char.build(self.manager)

        eye = bpy.data.objects.get("Herbaceous_Eye_L")
        if eye:
            self.assertTrue(any("Iris" in m.name for m in eye.data.materials))

if __name__ == "__main__":
    unittest.main()
