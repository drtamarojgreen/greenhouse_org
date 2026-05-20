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

if M10_ROOT not in sys.path:
    sys.path.insert(0, M10_ROOT)


class TestV10Regressions(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        components.initialize_registry()
        cls.manager = AssetManager()
        cls.manager.clear_scene()

    def test_environment_restoration(self):
        """Verifies that torches, lavender, and statues are correctly built by ExteriorModeler."""
        director = Director()
        director.setup_environment()

        env_coll = bpy.data.collections.get("9b.ENVIRONMENT")
        self.assertIsNotNone(env_coll, "Environment collection not found")

        # Check for Torches
        torches = [obj for obj in env_coll.objects if "torch" in obj.name.lower()]
        self.assertGreater(len(torches), 0, "No torches found in environment")

        # Check for Lavender
        lavender = [obj for obj in env_coll.objects if "lavender" in obj.name.lower()]
        self.assertGreater(len(lavender), 0, "No lavender found in environment")

        # Check for Statues/Complex Pillars
        statues = [obj for obj in env_coll.objects if "statue" in obj.name.lower()]
        self.assertGreater(len(statues), 0, "No statues found in environment")

    def test_animation_tags_presence(self):
        """Verifies that new animation tags are supported by the CharacterBuilder."""
        char = CharacterBuilder.create("Herbaceous_HF")
        # Just verify we can call animate with these tags without crash (logic will be implemented later)
        tags = ["grasp", "bend_down", "reach_out", "droop", "stretch", "wiggle"]
        for tag in tags: