# test_export_scenarios.py - BDD-style integration scenarios for Movie 8

import bpy
import unittest
import os
import shutil
import sys
from pathlib import Path

# Add Movie 8 root to sys.path
M8_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if M8_ROOT not in sys.path:
    sys.path.insert(0, M8_ROOT)

from asset_exporter import UnityAssetExporter

class TestExportScenarios(unittest.TestCase):
    """
    Behavior-Driven Development tests for the Movie 8 Asset Pipeline.
    Focuses on user-centric scenarios and expected system behavior.
    """

    @classmethod
    def setUpClass(cls):
        cls.test_export_root = Path(M8_ROOT) / "Test_BDD_Assets"
        cls.exporter = UnityAssetExporter(export_root=str(cls.test_export_root))

    def setUp(self):
        if self.test_export_root.exists():
            shutil.rmtree(self.test_export_root)
        self.test_export_root.mkdir(parents=True)
        bpy.ops.wm.read_factory_settings(use_empty=True)

    def test_scenario_full_scene_export(self):
        """
        Scenario: Exporting a complete scene with characters and environment.
        Given: A Blender scene with a rigged character 'Arbor' and an environment collection '7b.ENVIRONMENT'.
        When: The 'export_all_assets' method is called.
        Then: The export directory should contain FBXs for both character and environment,
              plus the layout and manifest files.
        """
        # Given
        bpy.ops.object.armature_add()
        rig = bpy.context.active_object
        rig.name = "Arbor.Rig"

        coll = bpy.data.collections.new("7b.ENVIRONMENT")
        bpy.context.scene.collection.children.link(coll)
        bpy.ops.mesh.primitive_plane_add(size=10)
        coll.objects.link(bpy.context.active_object)

        # When
        self.exporter.export_all_assets()

        # Then
        self.assertTrue((self.test_export_root / "Characters" / "Arbor_LOD0.fbx").exists())
        self.assertTrue((self.test_export_root / "Environment" / "7b_ENVIRONMENT.fbx").exists())
        self.assertTrue((self.test_export_root / "LevelLayout.json").exists())
        self.assertTrue((self.test_export_root / "AssetManifest.json").exists())

    def test_scenario_empty_environment(self):
        """
        Scenario: Graceful handling of empty environment collections.
        Given: A scene where '7b.ENVIRONMENT' exists but is empty.
        When: Environment export is triggered.
        Then: No '7b_ENVIRONMENT.fbx' should be created, and no errors should crash the script.
        """
        # Given
        bpy.data.collections.new("7b.ENVIRONMENT")

        # When
        try:
            self.exporter.export_environment()
            success = True
        except Exception:
            success = False

        # Then
        self.assertTrue(success, "Exporter should handle empty collections without crashing.")
        self.assertFalse((self.test_export_root / "Environment" / "7b_ENVIRONMENT.fbx").exists())

    def test_scenario_animation_assignment(self):
        """
        Scenario: Animation clips correctly classified and linked in the controller.
        Given: An action named 'Arbor_Walk' in Blender.
        When: Animations are exported for character 'Arbor'.
        Then: The AnimatorController.json should list 'Arbor_Walk' with type 'walk'.
        """
        # Given
        action = bpy.data.actions.new("Arbor_Walk")
        # Add a dummy f-curve to make it valid for export
        action.fcurves.new(data_path="location", index=0)

        bpy.ops.object.armature_add()
        rig = bpy.context.active_object
        rig.name = "Arbor.Rig"

        # When
        self.exporter.export_animations()

        # Then
        controller_path = self.test_export_root / "Animations" / "AnimatorController.json"
        import json
        with open(controller_path, 'r') as f:
            data = json.load(f)
            states = [s for s in data["states"] if s["name"] == "Arbor_Walk"]
            self.assertEqual(len(states), 1)
            self.assertEqual(states[0]["type"], "walk")

if __name__ == "__main__":
    unittest.main(argv=['first-arg-is-ignored'], exit=False)
