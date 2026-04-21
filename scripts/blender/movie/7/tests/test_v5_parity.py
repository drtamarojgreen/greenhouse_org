import unittest
import bpy
import os
import sys

M7_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_ROOT not in sys.path: sys.path.insert(0, M7_ROOT)

from asset_manager import AssetManager
from character_builder import CharacterBuilder

class TestMovie7V5Parity(unittest.TestCase):
    def setUp(self):
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_spirit_integration_spatial(self):
        """Verifies spatial separation of characters."""
        import config
        for ent_cfg in config.config.get("ensemble.entities", []):
            char = CharacterBuilder.create(ent_cfg["id"], ent_cfg)
            char.build(self.manager); char.apply_pose()

        objs = [o for o in bpy.data.objects if ".Rig" in o.name]
        for i, o1 in enumerate(objs):
            for o2 in objs[i+1:]:
                dist = (o1.location - o2.location).length
                self.assertGreater(dist, 1.0, f"{o1.name} and {o2.name} are overlapping.")

if __name__ == "__main__":
    unittest.main()
