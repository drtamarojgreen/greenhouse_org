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

class TestNarrativeContinuityV10(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        components.initialize_registry()
        cls.manager = AssetManager()
        cls.manager.clear_scene()
        cls.director = Director()
        cls.director.setup_environment()
        # Note: We rely on the config to have objects built or mock them
        # For simplicity in this audit, we check for presence and visibility logic

    def test_narrative_beat_visibility(self):
        """Audits asset visibility across all defined narrative beats."""
        storyline = mc.get("ensemble.storyline", [])

        # Test frames for each beat
        for beat in storyline:
            beat_name = beat["beat"]
            test_frame = (beat["start"] + beat["end"]) // 2
            bpy.context.scene.frame_set(test_frame)

            print(f"Auditing beat: {beat_name} at frame {test_frame}")

            # Context-specific audit
            if beat_name == "Clinical Exchange":
                # Desk and Chair must be visible
                desk = bpy.data.objects.get("ClinicalDesk.Body") or bpy.data.objects.get("ClinicalDesk")
                if desk:
                    self.assertFalse(desk.hide_render, f"Desk should be visible in {beat_name}")

            if beat_name == "Arrival":
                # Sylvan_Majesty visibility event starts at 1, visible at 300
                majesty = bpy.data.objects.get("Sylvan_Majesty.Rig")
                if majesty:
                    # Frame 300 is midpoint, should be visible
                    for c in majesty.children_recursive:
                        if c.type == 'MESH':
                            self.assertFalse(c.hide_render, f"Majesty should be visible in {beat_name} at frame 300+")

    def test_context_asset_exclusion_audit(self):
        """Verifies that exterior assets are excluded from the greenhouse context."""
        context = "greenhouse"
        constraints = mc.get("context_constraints", {}).get(context, {})
        disallowed = constraints.get("disallowed_assets", [])

        for asset_id in disallowed:
            # Check for objects that might match these IDs
            obj = bpy.data.objects.get(asset_id)
            if obj:
                # If they exist (e.g. for testing purposes), they must be hidden
                self.assertTrue(obj.hide_render, f"Disallowed asset {asset_id} must be hidden in {context} context.")

if __name__ == "__main__":
    unittest.main()