import unittest
import bpy
import os
import sys

M7_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_ROOT not in sys.path: sys.path.insert(0, M7_ROOT)

from asset_manager import AssetManager
from character_builder import CharacterBuilder

class TestMovie7CharacterScale(unittest.TestCase):
    def setUp(self):
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_character_scale_normalization(self):
        """Ported from M6: Verifies that characters are normalized to target height."""
        cfg = {"id": "Giant", "type": "DYNAMIC", "components": {"modeling": "PlantModeler", "rigging": "PlantRigger"}, "target_height": 10.0}
        char = CharacterBuilder.create("Giant", cfg); char.build(self.manager)
        m = self.manager._get_metrics(char.rig)
        self.assertAlmostEqual(m['height'], 10.0, delta=0.5)

if __name__ == "__main__":
    unittest.main()
