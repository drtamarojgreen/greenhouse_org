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
from b.assemble_production_v6 import initialize_production

class TestPhaseB(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # We need Phase A assets for a full test, but we can verify the rig/env even if they are missing
        initialize_production()

    def test_collection_hierarchy(self):
        """Verifies that 6a and 6b collections exist."""
        self.assertIn("6a_Assets", bpy.data.collections, "6a_Assets collection missing")
        self.assertIn("6b_Environment", bpy.data.collections, "6b_Environment collection missing")

    def test_camera_rig_presence(self):
        """Verifies all required production cameras are present."""
        expected_cameras = ["WIDE", "OTS1", "OTS2", "OTS_Static_1", "OTS_Static_2"]
        for cam_name in expected_cameras:
            self.assertIn(cam_name, bpy.data.objects, f"Camera {cam_name} missing")
            self.assertEqual(bpy.data.objects[cam_name].type, 'CAMERA')

    def test_camera_settings(self):
        """Verifies camera lens and clip settings."""
        wide = bpy.data.objects.get("WIDE")
        if wide:
            self.assertEqual(wide.data.lens, 35)
            self.assertEqual(wide.data.clip_end, 2000.0)

    def test_backdrop_geometry(self):
        """Verifies backdrop planes are created and placed correctly."""
        backdrops = ["ChromaBackdrop_Wide", "ChromaBackdrop_OTS1", "ChromaBackdrop_OTS2"]
        for name in backdrops:
            self.assertIn(name, bpy.data.objects, f"Backdrop {name} missing")
            obj = bpy.data.objects[name]
            self.assertEqual(obj.type, 'MESH')
            # Check for large size
            self.assertGreaterEqual(obj.dimensions.x, 100)

    def test_material_assignment(self):
        """Verifies that ChromaKey material is applied to backdrops."""
        bg = bpy.data.objects.get("ChromaBackdrop_Wide")
        if bg:
            self.assertGreater(len(bg.data.materials), 0, "No material on backdrop")
            mat = bg.data.materials[0]
            self.assertIn("ChromaKey", mat.name)

            # Check for pure green color
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                color = bsdf.inputs['Base Color'].default_value
                self.assertAlmostEqual(color[0], 0.0)
                self.assertAlmostEqual(color[1], 1.0)
                self.assertAlmostEqual(color[2], 0.0)

if __name__ == "__main__":
    unittest.main()
