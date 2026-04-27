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
import config

class TestMovie7CharacterScale(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_procedural_scaling(self):
        """Verifies that the AssetManager correctly scales a character based on target_height."""
        cfg = config.config.get("ensemble.entities", [])
        herb_cfg = next((c for c in cfg if c["id"] == "Herbaceous"), {"id": "Herbaceous", "target_height": 3.0}).copy()
        herb_cfg["type"] = "DYNAMIC"
        # Ensure components are set even if ID is not Herbaceous
        herb_cfg.setdefault("components", {"modeling": "PlantModeler", "rigging": "PlantRigger", "shading": "UniversalShader", "animation": "ProceduralAnimator"})
        herb_cfg["target_height"] = 5.0
        char = CharacterBuilder.create("ScaledChar", herb_cfg)
        char.build(self.manager)

        metrics = self.manager._get_metrics(char.rig)
        self.assertAlmostEqual(metrics['height'], 5.0, places=1)

if __name__ == "__main__":
    unittest.main()
