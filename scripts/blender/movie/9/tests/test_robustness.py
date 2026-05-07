import movie_configuration as mc
import unittest
import bpy
import os
import sys

# Standard Path setup for tests
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M9_ROOT = os.path.dirname(TEST_DIR)

if M9_ROOT not in sys.path:
    sys.path.insert(0, M9_ROOT)

from asset_manager import AssetManager
from character_builder import CharacterBuilder
import components

class TestMovie9Robustness(unittest.TestCase):

    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager()
        self.manager.clear_scene()

    def test_invalid_component_resolution(self):
        """Verifies that the builder handles missing components gracefully."""
        cfg = {
            "id": "Broken",
            "type": "DYNAMIC",
            "components": {"modeling": "NonExistent"}
        }
        char = CharacterBuilder.create("Broken", cfg)
        # In M9, CharacterBuilder doesn't have a .modeler attribute, it resolves it during .build()
        # To test "graceful failure", we check if .body remains None after build.
        char.build(self.manager)
        self.assertIsNone(char.body)

    def test_missing_geometry_structure(self):
        """Verifies that ProceduralModeler fails gracefully with missing structure."""
        cfg = {
            "id": "NoStructure",
            "type": "DYNAMIC",
            "components": {"modeling": "ProceduralModeler"},
            "structure": {} # Missing geometry
        }
        char = CharacterBuilder.create("NoStructure", cfg)
        char.build(self.manager)
        self.assertIsNotNone(char.body)
        self.assertEqual(len(char.body.data.vertices), 0)

    def test_normalization_bounds(self):
        """Verifies normalization metrics calculation doesn't crash on simple geometry."""
        cfg = mc.get_character_config("Herbaceous").copy()
        cfg["type"] = "DYNAMIC"
        cfg.setdefault("components", {"modeling": "PlantModeler", "rigging": "PlantRigger", "shading": "UniversalShader", "animation": "ProceduralAnimator"})
        char = CharacterBuilder.create("Simple", cfg)
        char.build(self.manager)

        metrics = self.manager._get_metrics(char.rig)
        self.assertIsNotNone(metrics)
        self.assertGreater(metrics['height'], 0)

if __name__ == "__main__":
    unittest.main()
