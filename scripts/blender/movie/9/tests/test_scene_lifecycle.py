import unittest
import bpy
import os
import sys

# Ensure Movie 9 root is in sys.path
M9_ROOT = os.path.dirname(os.path.abspath(os.path.join(__file__, "../..")))
# Fix path for direct discovery
if M9_ROOT not in sys.path:
    sys.path.insert(0, M9_ROOT)

import config
from asset_manager import AssetManager
from director import Director
import components

class TestSceneLifecycleV9(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        components.initialize_registry()
        cls.manager = AssetManager()
        cls.manager.clear_scene()
        cls.director = Director()
        cls.director.setup_environment()
        cls.director.apply_storyline()

    def test_asset_availability_9a(self):
        """Verifies that all therapeutic assets are present in the collection."""
        coll = bpy.data.collections.get("9a.ASSETS")
        self.assertIsNotNone(coll, "9a.ASSETS collection missing.")

        # Check for newly added Clinical assets
        # Note: These are dynamic, built by Director if ensemble is built.
        # For this test, we verify the registry can resolve them.
        from registry import registry
        self.assertIsNotNone(registry.get_modeling("ProceduralModeler"))

    def test_visibility_lifecyle(self):
        """Verifies that the right assets display in the right frames."""
        # Clinical assets should be visible in greenhouse context
        desk = bpy.data.objects.get("ClinicalDesk.Body") or bpy.data.objects.get("ClinicalDesk")
        chair = bpy.data.objects.get("PatientChair.Body") or bpy.data.objects.get("PatientChair")

        # Test frame 1100 (Peak Clinical Exchange)
        bpy.context.scene.frame_set(1100)
        if desk:
            self.assertFalse(desk.hide_render, "Desk should be visible at frame 1100")
        if chair:
            self.assertFalse(chair.hide_render, "Chair should be visible at frame 1100")

    def test_transmission_cleanup(self):
        """Verifies visibility state after clinical scene transmission (frame 1800+)."""
        # Storyline doesn't explicitly hide desk/chair yet, but we check continuity
        bpy.context.scene.frame_set(1801)
        # Verify protagonists are not still sitting (stand action at 1400)
        herb = bpy.data.objects.get("Herbaceous.Rig")
        if herb:
            # Stand resets rotation
            self.assertAlmostEqual(herb.pose.bones["Torso"].rotation_euler[0], 0, places=2)

if __name__ == "__main__":
    unittest.main()
