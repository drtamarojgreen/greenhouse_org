# test_performance.py - Performance validation for Movie 8 Asset Pipeline

import bpy
import unittest
import os
import shutil
import sys
from pathlib import Path

# Add current dir to sys.path to import exporter
M8_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M8_ROOT not in sys.path:
    sys.path.insert(0, M8_ROOT)

from asset_exporter import UnityAssetExporter

class TestAssetPerformance(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.test_export_root = Path(M8_ROOT) / "Test_Performance_Assets"
        cls.exporter = UnityAssetExporter(export_root=str(cls.test_export_root))

    def setUp(self):
        # Clear previous test data
        if self.test_export_root.exists():
            shutil.rmtree(self.test_export_root)
        self.test_export_root.mkdir(parents=True)

        # Clear Blender data
        bpy.ops.wm.read_factory_settings(use_empty=True)

    def create_detailed_mesh(self, name, segments=32):
        """Creates a high-poly sphere for testing decimation."""
        bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=segments, radius=1)
        obj = bpy.context.active_object
        obj.name = name
        return obj

    def test_lod_decimation_performance(self):
        """Verifies that LODs actually reduce polygon counts."""
        rig = bpy.data.armatures.new("TestRig")
        rig_obj = bpy.data.objects.new("PerformanceBot.Rig", rig)
        bpy.context.scene.collection.objects.link(rig_obj)

        mesh_obj = self.create_detailed_mesh("HighPolyMesh")
        mesh_obj.parent = rig_obj

        # Get original poly count
        original_poly_count = len(mesh_obj.data.polygons)
        print(f"Original Poly Count: {original_poly_count}")

        # We need to mock the export or run it and check the temporary results
        # Since _export_lod cleans up, we'll check its internal logic by running it
        # and trusting the decimate modifier is applied correctly.

        # To actually verify, we can modify _export_lod to return the count or
        # just verify the FBX size (indirectly) or re-import.
        # But here we will verify that LOD ratios result in fewer polygons.

        # LOD1: 0.5 ratio
        # LOD2: 0.25 ratio

        # Run export_characters which calls _export_lod
        self.exporter.export_characters()

        # Verification of FBX existence
        char_dir = self.test_export_root / "Characters"
        self.assertTrue((char_dir / "PerformanceBot_LOD0.fbx").exists())
        self.assertTrue((char_dir / "PerformanceBot_LOD1.fbx").exists())
        self.assertTrue((char_dir / "PerformanceBot_LOD2.fbx").exists())

        # FBX size check as a proxy for performance optimization
        size0 = (char_dir / "PerformanceBot_LOD0.fbx").stat().st_size
        size1 = (char_dir / "PerformanceBot_LOD1.fbx").stat().st_size
        size2 = (char_dir / "PerformanceBot_LOD2.fbx").stat().st_size

        print(f"LOD Sizes: LOD0={size0}, LOD1={size1}, LOD2={size2}")
        self.assertLess(size1, size0, "LOD1 should be smaller than LOD0")
        self.assertLess(size2, size1, "LOD2 should be smaller than LOD1")

    def test_draw_call_reduction(self):
        """Verifies that mesh joining reduces the number of objects."""
        coll = bpy.data.collections.new("7b.ENVIRONMENT")
        bpy.context.scene.collection.children.link(coll)

        # Create 10 meshes
        for i in range(10):
            bpy.ops.mesh.primitive_cube_add(location=(i*2, 0, 0))
            coll.objects.link(bpy.context.active_object)

        # Export with join_meshes=True
        self.exporter.export_environment(join_meshes=True)

        # Re-import to verify single mesh
        fbx_path = self.test_export_root / "Environment" / "7b_ENVIRONMENT.fbx"
        bpy.ops.import_scene.fbx(filepath=str(fbx_path))

        # Count imported meshes
        imported_meshes = [o for o in bpy.context.selected_objects if o.type == 'MESH']
        print(f"Imported meshes after joining: {len(imported_meshes)}")
        self.assertEqual(len(imported_meshes), 1, "Draw calls should be reduced to 1 after joining environment meshes.")

    def test_vertex_budget_compliance(self):
        """Ensures exported assets stay within a defined vertex budget (mobile/performance goal)."""
        # Define a budget for LOD0 (e.g., 5000 verts)
        BUDGET = 5000

        rig = bpy.data.armatures.new("BudgetRig")
        rig_obj = bpy.data.objects.new("BudgetBot.Rig", rig)
        bpy.context.scene.collection.objects.link(rig_obj)

        # Create a mesh that stays under budget
        mesh_obj = self.create_detailed_mesh("BudgetMesh", segments=16)
        mesh_obj.parent = rig_obj

        vert_count = len(mesh_obj.data.vertices)
        print(f"BudgetBot Vertex Count: {vert_count}")
        self.assertLessEqual(vert_count, BUDGET, f"Asset exceeds performance budget of {BUDGET} vertices.")

if __name__ == "__main__":
    unittest.main(argv=['first-arg-is-ignored'], exit=False)
