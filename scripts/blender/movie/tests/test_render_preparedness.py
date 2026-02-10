import bpy
import unittest
import os
import sys

# Add movie root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from silent_movie_generator import MovieMaster

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
        """Check if all major characters and structures are in the scene."""
        required_objs = ["Herbaceous_Torso", "Arbor_Torso", "GloomGnome_Torso", "ExpressionistFloor", "CamTarget", "GazeTarget"]
        for obj_name in required_objs:
            with self.subTest(obj=obj_name):
                exists = obj_name in bpy.data.objects
                status = "PASS" if exists else "FAIL"
                self.log_result(f"Asset: {obj_name}", status, "Object found in bpy.data.objects" if exists else "Object MISSING")
                self.assertTrue(exists)

    def test_02_materials_integrity(self):
        """Check for specific material enhancements (Moss, Rust, Venation)."""
        mats_to_check = {
            "GH_Iron": "Mossy Iron",
            "GloomGnome_MatGloom": "Rusted Staff",
            "LeafMat_Herbaceous": "Leaf Venation",
            "CheckeredMarble": "Organic Floor Craters"
        }
        for mat_name, desc in mats_to_check.items():
            with self.subTest(mat=mat_name):
                exists = mat_name in bpy.data.materials
                if exists:
                    mat = bpy.data.materials[mat_name]
                    # Check for nodes (procedural enhancements)
                    has_nodes = mat.use_nodes and len(mat.node_tree.nodes) > 2
                    status = "PASS" if has_nodes else "WARNING"
                    details = f"Nodes found: {len(mat.node_tree.nodes)}" if has_nodes else "Material exists but has NO procedural nodes"
                else:
                    status = "FAIL"
                    details = "Material MISSING"

                self.log_result(f"Material: {mat_name} ({desc})", status, details)
                self.assertTrue(exists)

    def test_03_compositor_setup(self):
        """Check if compositor nodes for effects are present."""
        if not bpy.context.scene.use_nodes:
            self.log_result("Compositor", "FAIL", "use_nodes is FALSE")
            self.fail("Compositor not enabled")

        nodes = bpy.context.scene.node_tree.nodes
        required_nodes = ["ChromaticAberration", "GlobalSaturation", "Bright/Contrast", "GlowTrail", "Vignette"]
        for node_name in required_nodes:
            with self.subTest(node=node_name):
                exists = node_name in nodes
                status = "PASS" if exists else "FAIL"
                self.log_result(f"Compositor Node: {node_name}", status, "Node found" if exists else "Node MISSING")
                self.assertTrue(exists)

    def test_04_animation_presence(self):
        """Check if objects have animation data (secondary motion)."""
        objs_with_anim = ["Herbaceous_Torso", "Arbor_Torso", "GazeTarget", "CamTarget"]
        for name in objs_with_anim:
            obj = bpy.data.objects.get(name)
            if obj:
                has_anim = obj.animation_data is not None
                status = "PASS" if has_anim else "FAIL"
                self.log_result(f"Animation: {name}", status, "Animation data present" if has_anim else "NO animation data")
                self.assertTrue(has_anim)

    @classmethod
    def tearDownClass(cls):
        print("\n" + "="*50)
        print("RENDER PREPAREDNESS SUMMARY")
        print("="*50)
        passes = 0
        fails = 0
        warnings = 0
        for r in cls.results:
            icon = "✓" if r["status"] == "PASS" else ("✗" if r["status"] == "FAIL" else "!")
            print(f"[{icon}] {r['name']:<40} : {r['status']}")
            if r['details']:
                print(f"    Details: {r['details']}")

            if r["status"] == "PASS": passes += 1
            elif r["status"] == "FAIL": fails += 1
            else: warnings += 1

        print("="*50)
        print(f"TOTAL: {len(cls.results)} | PASS: {passes} | FAIL: {fails} | WARNING: {warnings}")
        if fails == 0:
            print("STATUS: READY FOR RENDER")
        else:
            print("STATUS: NOT READY - CRITICAL FAILURES DETECTED")
        print("="*50 + "\n")

if __name__ == "__main__":
    unittest.main(exit=False)
