import unittest
try: import bpy
except ImportError: bpy = None
import os
import sys

# Standard Path setup for tests
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M10_ROOT = os.path.dirname(os.path.dirname(TEST_DIR))

if M10_ROOT not in sys.path:
    sys.path.insert(0, M10_ROOT)
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
import components

class TestMovie10CharacterScale(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_procedural_scaling(self):
        """Verifies that the AssetManager correctly scales a character based on target_height."""
        cfg = mc.get("ensemble.entities", [])
        herb_cfg = next((c for c in cfg if c["id"] == "Herbaceous_HF"), {"id": "Herbaceous_HF", "target_height": 3.0}).copy()
        herb_cfg["type"] = "DYNAMIC"
        # Ensure components are set even if ID is not Herbaceous_HF
        herb_cfg.setdefault("components", {"modeling": "PlantModeler", "rigging": "PlantRigger", "shading": "UniversalShader", "animation": "ProceduralAnimator"})
        herb_cfg["target_height"] = 5.0
        char = CharacterBuilder.create("ScaledChar", herb_cfg)
        char.build(self.manager)

        metrics = self.manager._get_metrics(char.rig)
        self.assertAlmostEqual(metrics['height'], 5.0, places=1)

if __name__ == "__main__":
    unittest.main()
