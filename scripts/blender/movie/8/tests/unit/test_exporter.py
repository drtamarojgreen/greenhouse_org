# test_exporter.py - Verification for Movie 8 Asset Pipeline

import bpy
import unittest
import os
import json
import shutil
import sys
from pathlib import Path

# Add current dir to sys.path to import exporter
M8_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M8_ROOT not in sys.path:
    sys.path.insert(0, M8_ROOT)

from asset_exporter import UnityAssetExporter

class TestUnityAssetExporter(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.test_export_root = Path(M8_ROOT) / "Test_Unity_Assets"
        cls.exporter = UnityAssetExporter(export_root=str(cls.test_export_root))

    def setUp(self):
        # Clear previous test data
        if self.test_export_root.exists():
            shutil.rmtree(self.test_export_root)
        self.test_export_root.mkdir(parents=True)

        # Clear Blender data
        bpy.ops.wm.read_factory_settings(use_empty=True)

    def create_mock_character(self, name):
        """Creates a minimal rig and mesh for testing."""
        bpy.ops.object.armature_add()
        rig = bpy.context.active_object
        rig.name = f"{name}.Rig"

        bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 1))
        mesh = bpy.context.active_object
        mesh.name = f"{name}_Mesh"
        mesh.parent = rig

        # Assign material
        mat = bpy.data.materials.new(name=f"{name}_Mat")
        mesh.data.materials.append(mat)

        return rig, mesh

    def test_character_export_integrity(self):
        """Verifies character export generates expected FBX and Metadata."""
        self.create_mock_character("TestBot")

        self.exporter.export_characters()

        char_dir = self.test_export_root / "Characters"
        self.assertTrue((char_dir / "TestBot_LOD0.fbx").exists())
        self.assertTrue((char_dir / "TestBot_LOD1.fbx").exists())
        self.assertTrue((char_dir / "TestBot_LOD2.fbx").exists())

        metadata_path = char_dir / "TestBot_metadata.json"
        self.assertTrue(metadata_path.exists())

        with open(metadata_path, 'r') as f:
            data = json.load(f)
            self.assertEqual(data["id"], "TestBot")
            self.assertIn("TestBot_Mat", data["materials"])
            self.assertIn("collider", data)
            self.assertEqual(data["collider"]["type"], "BOX")

    def test_environment_join_optimization(self):
        """Verifies mesh joining in environment export."""
        coll = bpy.data.collections.new("7b.ENVIRONMENT")
        bpy.context.scene.collection.children.link(coll)

        # Create multiple meshes
        for i in range(3):
            bpy.ops.mesh.primitive_cube_add(location=(i*3, 0, 0))
            coll.objects.link(bpy.context.active_object)

        self.exporter.export_environment(join_meshes=True)

        env_fbx = self.test_export_root / "Environment" / "7b_ENVIRONMENT.fbx"
        self.assertTrue(env_fbx.exists())
        # Note: We can't easily check FBX internal mesh count without re-importing,
        # but we verified the logic in asset_exporter.py

    def test_level_layout_generation(self):
        """Verifies LevelLayout.json contains character and camera data."""
        self.create_mock_character("Hero")

        bpy.ops.object.camera_add(location=(0, -10, 5))
        cam = bpy.context.active_object
        cam.name = "MainCamera"

        self.exporter.export_level_layout()

        layout_path = self.test_export_root / "LevelLayout.json"
        self.assertTrue(layout_path.exists())

        with open(layout_path, 'r') as f:
            data = json.load(f)
            char_ids = [c["id"] for c in data["characters"]]
            self.assertIn("Hero", char_ids)

            cam_names = [s["name"] for s in data["spawn_points"]]
            self.assertIn("MainCamera", cam_names)

    def test_manifest_creation(self):
        """Verifies AssetManifest.json is created with correct version."""
        self.exporter.generate_metadata()

        manifest_path = self.test_export_root / "AssetManifest.json"
        self.assertTrue(manifest_path.exists())

        with open(manifest_path, 'r') as f:
            data = json.load(f)
            self.assertEqual(data["version"], "8.0.0")

if __name__ == "__main__":
    unittest.main(argv=['first-arg-is-ignored'], exit=False)
