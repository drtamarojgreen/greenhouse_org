try:
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None

    from asset_manager import AssetManager
    from director import Director
    from render import build_scene
    from animation_handler import AnimationHandler
    from character_builder import CharacterBuilder
    import components
except ImportError:
    from ..asset_manager import AssetManager
    from ..director import Director
    from ..render import build_scene
    from ..animation_handler import AnimationHandler
    from ..character_builder import CharacterBuilder
    from .. import components
    import bpy
    import bmesh
    import mathutils
    bpy = None
    bmesh = None
    mathutils = None
        AssetManager = None
        Director = None
        build_scene = None
        AnimationHandler = None
        CharacterBuilder = None

import unittest


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