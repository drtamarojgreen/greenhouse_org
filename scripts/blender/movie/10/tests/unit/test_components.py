import unittest
try: import bpy
except ImportError: bpy = None
import os
import sys

# Ensure Movie 10 is in path
M10_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M10_DIR not in sys.path:
    sys.path.append(M10_DIR)
try:
    import movie_configuration as mc
except ImportError:
    from . import movie_configuration as mc

try:
    try:
    from asset_manager import
except ImportError:
    from ..asset_manager import AssetManager
except ImportError:
    from .asset_manager import AssetManager
try:
    try:
    from character_builder import
except ImportError:
    from ..character_builder import CharacterBuilder
except ImportError:
    from .character_builder import CharacterBuilder

class TestComponentParity(unittest.TestCase):
    def setUp(self):
        self.manager = AssetManager()
        self.manager.clear_scene()

    def test_component_building(self):
        """Verifies that the character build correctly utilizes components."""
        entity = {
            "id": "CompChar",
            "type": "MESH",
            "is_protagonist": True,
            "components": {
                "modeling": "PlantModeler",
                "rigging": "PlantRigger",
                "shading": "UniversalShader"
            }
        }
        char = CharacterBuilder.create("CompChar", entity)
        char.build(self.manager)

        self.assertIsNotNone(char.rig)
        self.assertIsNotNone(char.body)
        # PlantModeler with eyes has multiple materials (Bark, Leaf, Iris, Pupil)
        self.assertGreaterEqual(len(char.body.data.materials), 1)

if __name__ == "__main__":
    unittest.main()
