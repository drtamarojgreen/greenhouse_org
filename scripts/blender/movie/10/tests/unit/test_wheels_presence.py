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
if M10_ROOT not in sys.path:
    sys.path.append(M10_ROOT)

class TestMovie10Wheels(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manager = AssetManager()
        cls.manager.clear_scene()

    def test_greenhouse_mobile_wheels(self):
        """Verifies that the GreenhouseMobile has 4 grounded wheels."""
        entity = {
            "id": "TestMobile",
            "type": "DYNAMIC",
            "components": { "modeling": "GreenhouseMobileModeler" }
        }
        char = CharacterBuilder.create("TestMobile", entity)
        char.build(self.manager)

        obj = bpy.data.objects.get("TestMobile")
        self.assertIsNotNone(obj, "Mobile object not created")
        bpy.context.view_layer.update()

        wheels = [c for c in obj.children_recursive if "Wheel" in c.name and c.type == 'MESH']
        self.assertEqual(len(wheels), 4, f"Expected 4 wheels, found {len(wheels)}")

        for wheel in wheels:
            # Check grounding (Z should be near 0 at the bottom)