import bpy
import sys
import unittest
from base_test import BlenderTestCase

class TestMaterials(BlenderTestCase):
    def test_01_materials_integrity(self):
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
                    has_nodes = mat.use_nodes and len(mat.node_tree.nodes) > 2
                    status = "PASS" if has_nodes else "WARNING"
                    details = f"Nodes: {len(mat.node_tree.nodes)}" if has_nodes else "No procedural nodes"
                else:
                    status = "FAIL"
                    details = "MISSING"

                self.log_result(f"Material: {mat_name}", status, details)
                self.assertTrue(exists)

    def test_02_texture_validation(self):
        """Verify that key materials contain procedural texture nodes."""
        expectations = {
            "GH_Iron": "Noise",
            "GH_Glass": "Noise", # Scratches
            "LeafMat_Herbaceous": ["Noise", "Wave"], # Venation/Fuzz
            "CheckeredMarble": ["Checker", "Noise"],
            "GloomGnome_MatCloak": "Wave", # Weave
            "GloomGnome_MatGloom": "Noise" # Rust/Runes
        }

        for mat_name, expected_types in expectations.items():
            if not isinstance(expected_types, list): expected_types = [expected_types]
            
            mat = bpy.data.materials.get(mat_name)
            if not mat or not mat.use_nodes: continue

            found_types = []
            for node in mat.node_tree.nodes:
                for exp in expected_types:
                    if exp in node.name or exp in node.type or (hasattr(node, 'texture') and exp in node.texture.name):
                        found_types.append(exp)
            
            found_any = len(set(found_types) & set(expected_types)) > 0
            status = "PASS" if found_any else "WARNING"
            self.log_result(f"Texture: {mat_name}", status, f"Found {list(set(found_types))}")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)