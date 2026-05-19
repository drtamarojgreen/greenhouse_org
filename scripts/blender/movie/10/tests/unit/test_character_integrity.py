import unittest
try: import bpy
except ImportError: bpy = None
import os
import sys

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


class TestCharacterIntegrity(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager()
        self.manager.clear_scene()

    def test_armature_count_matches_ensemble(self):
        entities = mc.get("ensemble.entities", [])
        expected_rigs = 0
        for ent in entities:
            if ent.get("type") == "DYNAMIC":
                expected_rigs += 1 if ent.get("components", {}).get("rigging") else 0
            else:
                expected_rigs += 1 if ent.get("source_rig") else 0

        for ent in entities:
            char = CharacterBuilder.create(ent["id"], ent)
            char.build(self.manager)

        actual_rigs = len([o for o in bpy.data.objects if o.type == "ARMATURE" and o.name.endswith(".Rig")])
        self.assertEqual(actual_rigs, expected_rigs)


if __name__ == "__main__":
    unittest.main()
