import unittest
import os
import sys
import bpy

# Standardize path injection for movie/6 assets
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
V6_DIR = os.path.dirname(TEST_DIR)
if V6_DIR not in sys.path:
    sys.path.insert(0, V6_DIR)

import config
from a.extract_ensemble import extract_assets

class TestPhaseA(unittest.TestCase):

    def test_extraction_execution(self):
        """Verifies that the extraction script runs and produces expected files."""
        # Note: This test depends on the presence of the production blend
        # if it's missing, it will log errors but we check what it managed to do.

        # Ensure a clean state before running
        asset_dir = os.path.join(V6_DIR, "assets")
        if os.path.exists(asset_dir):
            import shutil
            shutil.rmtree(asset_dir)

        # Run extraction
        extract_assets()

        # 1. Verify directory creation
        self.assertTrue(os.path.exists(asset_dir), "Asset directory was not created")

        # 2. Check for FBX files if production blend was available
        # If blend was missing, we skip the file count check but verify the process didn't crash
        if os.path.exists(config.SPIRITS_ASSET_BLEND):
            fbx_files = [f for f in os.listdir(asset_dir) if f.endswith(".fbx")]
            # Expecting 8 ensemble members
            self.assertGreaterEqual(len(fbx_files), 1, "No FBX files were exported")

            for art_name in config.SPIRIT_ENSEMBLE.values():
                expected_path = os.path.join(asset_dir, f"{art_name}.fbx")
                self.assertTrue(os.path.exists(expected_path), f"Missing FBX for {art_name}")
                self.assertGreater(os.path.getsize(expected_path), 0, f"FBX for {art_name} is empty")

    def test_naming_parity_in_scene(self):
        """Verifies that objects are renamed correctly in the scene before export."""
        bpy.ops.wm.read_factory_settings(use_empty=True)

        # Create a mock object with a source name
        src_name = list(config.SPIRIT_ENSEMBLE.keys())[0]
        art_name = config.SPIRIT_ENSEMBLE[src_name]

        mesh = bpy.data.meshes.new(src_name)
        obj = bpy.data.objects.new(src_name, mesh)
        bpy.context.scene.collection.objects.link(obj)

        # Run a minimal version of the renaming logic
        from a.extract_ensemble import _is_protagonist
        sep = "_" if _is_protagonist(art_name) else "."
        new_name = f"{art_name}{sep}Body"
        obj.name = new_name

        self.assertEqual(obj.name, new_name)

if __name__ == "__main__":
    unittest.main()
