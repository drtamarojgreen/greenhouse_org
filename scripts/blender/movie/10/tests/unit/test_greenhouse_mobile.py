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

class TestMovie10GreenhouseMobile(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_mobile_asset_generation(self):
        """Verifies that the GreenhouseMobile vehicle is built with correct sub-components."""
        cfg = mc.get_character_config("GreenhouseMobile")
        self.assertIsNotNone(cfg)

        char = CharacterBuilder.create("GreenhouseMobile", cfg)
        char.build(self.manager)

        obj = bpy.data.objects.get("GreenhouseMobile")
        self.assertIsNotNone(obj)

        # Check for sub-components (Wheels, BedPlant)
        children_names = [c.name for c in obj.children]
        # El Camino design has Wheels and BedPlants instead of a sliding hatch door
        self.assertTrue(any("Wheel" in n for n in children_names))
        self.assertTrue(any("BedPlant" in n for n in children_names))

        # Check if it's tagged as GreenhouseMobile
        self.assertEqual(obj.name, "GreenhouseMobile")

if __name__ == "__main__":
    unittest.main()