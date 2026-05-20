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

class TestMovie10RigIntegrity(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_procedural_rig_bone_hierarchy(self):
        """Verifies that the rigger builds the correct parent-child relationships from mc."""
        cfg = mc.get_character_config("Herbaceous_HF")
        char = CharacterBuilder.create("Herbaceous_HF", cfg)
        char.build(self.manager)

        neck = char.rig.data.bones.get("Neck")
        self.assertIsNotNone(neck)
        self.assertEqual(neck.parent.name, "Torso")

        head = char.rig.data.bones.get("Head")
        self.assertIsNotNone(head)
        self.assertEqual(head.parent.name, "Neck")

    def test_rig_rotation_mode_xyz(self):
        """Ensures all bones are in XYZ mode for procedural animation compatibility."""
        cfg = mc.get_character_config("Herbaceous_HF")
        char = CharacterBuilder.create("Herbaceous_HF", cfg)
        char.build(self.manager)

        for pb in char.rig.pose.bones:
            self.assertEqual(pb.rotation_mode, 'XYZ', f"Bone {pb.name} is not in XYZ mode.")

    def test_deform_flags(self):
        """Verifies use_deform flags are correctly set from mc."""
        cfg = mc.get_character_config("Herbaceous_HF")
        char = CharacterBuilder.create("Herbaceous_HF", cfg)
        char.build(self.manager)

        self.assertTrue(char.rig.data.bones["Torso"].use_deform)
        self.assertTrue(char.rig.data.bones["Neck"].use_deform)

if __name__ == "__main__":
    unittest.main()