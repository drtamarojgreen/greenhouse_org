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