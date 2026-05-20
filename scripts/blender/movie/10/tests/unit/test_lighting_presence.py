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
if M10_ROOT not in sys.path: sys.path.insert(0, M10_ROOT)

class TestMovie10LightingPresence(unittest.TestCase):
    def test_lighting_rig_presence(self):
        """Ported from M6: Verifies that lighting objects are created."""
        d = Director(); d.setup_lighting()
        self.assertGreater(len([o for o in bpy.data.objects if o.type == 'LIGHT']), 0)

if __name__ == "__main__":
    unittest.main()