import bpy
import unittest
import os
import sys
import math

# Add movie root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from silent_movie_generator import MovieMaster
import style

class TestRenderPreparedness(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Run the movie master to generate the scene
        cls.master = MovieMaster(mode='SILENT_FILM')
        cls.master.run()
        cls.results = []

    def log_result(self, name, status, details=""):
        self.results.append({"name": name, "status": status, "details": details})

    def test_01_assets_exist(self):
        """Check if all major characters and structures are in the scene (5.0+ names)."""
        required_objs = ["Herbaceous_Mesh", "Arbor_Mesh", "GloomGnome_Mesh", "ExpressionistFloor", "CamTarget", "GazeTarget"]
        for obj_name in required_objs:
            with self.subTest(obj=obj_name):
                exists = obj_name in bpy.data.objects
                status = "PASS" if exists else "FAIL"
                self.log_result(f"Asset: {obj_name}", status, "Found" if exists else "MISSING")
                self.assertTrue(exists)

    def test_02_materials_integrity(self):
        """Check for modern 5.0+ material connectivity."""
        mats_to_check = ["GH_Iron", "PlantMat_Herbaceous", "LeafMat_Herbaceous", "CheckeredMarble"]
        for mat_name in mats_to_check:
            with self.subTest(mat=mat_name):
                mat = bpy.data.materials.get(mat_name)
                has_bsdf = False
                if mat and mat.node_tree:
                    has_bsdf = any(n.type == 'BSDF_PRINCIPLED' for n in mat.node_tree.nodes)
                status = "PASS" if has_bsdf else "FAIL"
                self.log_result(f"Material: {mat_name}", status)
                self.assertTrue(has_bsdf)

    def test_03_compositor_setup(self):
        """Check if compositor nodes are present (5.0+)."""
        scene = bpy.context.scene
        tree = style.get_compositor_node_tree(scene)
        self.assertIsNotNone(tree)

        required_nodes = ["Chromatic", "GlobalSaturation", "Bright/Contrast", "GlowTrail", "Vignette"]
        for node_name in required_nodes:
            node = tree.nodes.get(node_name)
            exists = node is not None
            self.log_result(f"Compositor Node: {node_name}", "PASS" if exists else "FAIL")
            self.assertTrue(exists)

    def test_06_engine_mode_switching(self):
        """Verify engine selection targets EEVEE_NEXT."""
        unity_master = MovieMaster(mode='UNITY_PREVIEW')
        engine = unity_master.scene.render.engine
        # Target EEVEE_NEXT for Blender 5.0+
        self.assertEqual(engine, 'BLENDER_EEVEE_NEXT')

    def test_14_global_cinematic_state(self):
        """Verify 5.0+ cinematic requirements."""
        scene = bpy.context.scene
        # View transform (Filmic or AgX depending on master.py choice, currently Filmic)
        view_transform = scene.view_settings.view_transform
        self.assertEqual(view_transform, 'Filmic')
        # Motion Blur
        self.assertTrue(scene.render.use_motion_blur)

    @classmethod
    def tearDownClass(cls):
        print("\n" + "="*50); print("RENDER PREPAREDNESS SUMMARY (5.0+ ONLY)"); print("="*50)
        passes = 0; fails = 0
        for r in cls.results:
            icon = "✓" if r["status"] == "PASS" else "✗"
            print(f"[{icon}] {r['name']:<40} : {r['status']}")
            if r['details']: print(f"    Details: {r['details']}")
            if r["status"] == "PASS": passes += 1
            else: fails += 1
        print("="*50); print(f"TOTAL: {len(cls.results)} | PASS: {passes} | FAIL: {fails}")
        print("STATUS: " + ("READY" if fails == 0 else "NOT READY"))
        print("="*50 + "\n")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv: argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv, exit=False)
