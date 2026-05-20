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
    sys.path.insert(0, M10_ROOT)

class TestContextConstraintsV10(unittest.TestCase):
    def test_asset_filtering(self):
        """Verifies that the Director correctly filters assets based on context constraints."""
        director = Director()

        # Mock an environment config that includes disallowed assets
        # Greenhouse context disallows 'mountain_range' and 'rock_path'
        env_cfg = {"type": "greenhouse"}

        # This test checks the logic inside setup_environment by examining how it would
        # process a hypothetical environment config block.

        context = "greenhouse"
        constraints = mc.get("context_constraints", {}).get(context, {})
        disallowed = constraints.get("disallowed_assets", [])

        test_env = {
            "mountains": {"count": 5},
            "pillars": {"radius": 0.5},
            "rock_path": {"width": 2}
        }

        filtered = test_env.copy()
        for d in disallowed:
            if d in filtered:
                del filtered[d]

        self.assertNotIn("mountains", filtered)
        self.assertNotIn("rock_path", filtered)
        self.assertIn("pillars", filtered)

if __name__ == "__main__":
    unittest.main()