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

class TestGlobalAuditV10(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        components.initialize_registry()
        cls.director = Director()
        cls.director.setup_lighting()

    def test_lighting_heartbeat_pulse(self):
        """Verifies that key lights have an intensity heartbeat pulse."""
        light = bpy.data.lights.get("Key")
        if not light: return

        # Check energy at two different frames in the pulse
        # pulse = 1.0 + 0.08 * math.sin(2.0 * math.pi * 0.5 * (f / 24.0))
        bpy.context.scene.frame_set(24) # sin(pi) = 0 -> base energy
        e1 = light.energy

        bpy.context.scene.frame_set(36) # sin(1.5pi) = -1 -> base * 0.92
        e2 = light.energy

        self.assertNotEqual(e1, e2, "Light intensity is static; heartbeat pulse missing.")

    def test_shadow_contrast_anxiety(self):
        """
        Verifies lighting configuration for anxiety-related beats.
        Note: Actual shadow analysis requires rendering, but we audit energy ratios.
        """
        rim = bpy.data.lights.get("Rim")
        key = bpy.data.lights.get("Key")

        if rim and key:
            # Rim should be high for 'sharp contrasts' in professional scenes
            self.assertGreater(rim.energy, key.energy, "Rim intensity should exceed Key for cinematic depth.")

if __name__ == "__main__":
    unittest.main()