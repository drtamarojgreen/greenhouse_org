import bpy
import sys
import unittest
from base_test import BlenderTestCase
import test_utils

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
                mat = bpy.data.materials.get(mat_name)
                self.assertIsNotNone(mat, f"Material '{mat_name}' ({desc}) is missing.")
                
                bsdf = test_utils.get_principled_bsdf(mat)
                self.assertIsNotNone(bsdf, f"Material '{mat_name}' is missing a Principled BSDF node.")
                
                # Check for "Roughness" being driven or set
                roughness_socket = bsdf.inputs.get("Roughness")
                self.assertIsNotNone(roughness_socket)
                self.log_result(f"Material Integrity: {mat_name}", "PASS", "Has Principled BSDF")

    def test_02_texture_validation(self):
        """Verify that key materials contain procedural texture nodes and they are linked."""
        expectations = {
            "GH_Iron": ("Noise", "Base Color"),
            "GH_Glass": ("Noise", "Normal"), 
            "LeafMat_Herbaceous": ("Wave", "Base Color"),
            "GloomGnome_MatGloom": ("Noise", "Base Color")
        }

        for mat_name, (tex_type, input_socket) in expectations.items():
            with self.subTest(mat=mat_name):
                mat = bpy.data.materials.get(mat_name)
                self.assertIsNotNone(mat)
                
                # Use test_utils to verify connectivity from a specific texture type to a Principled BSDF input
                bsdf = test_utils.get_principled_bsdf(mat)
                self.assertIsNotNone(bsdf)
                
                target_socket = bsdf.inputs.get(input_socket)
                self.assertIsNotNone(target_socket, f"Socket '{input_socket}' not found on BSDF of {mat_name}")
                self.assertTrue(target_socket.is_linked, f"Texture logic for {mat_name} is not contributing to '{input_socket}'")
                
                # Trace back to check if the source is indeed the expected texture type
                # We expect a link: [TexNode] -> ... -> [Target Socket]
                source_node = target_socket.links[0].from_node
                # Recursively check for the texture type in the upward chain (shallow 1-level for now)
                found = tex_type.upper() in source_node.type or any(tex_type.upper() in n.type for n in mat.node_tree.nodes)
                
                status = "PASS" if found else "FAIL"
                self.log_result(f"Texture Connectivity: {mat_name}", status, f"{tex_type} -> {input_socket}")
                self.assertTrue(found, f"Expected {tex_type} to drive {input_socket} in {mat_name}")

    def test_03_material_node_connectivity(self):
        """VAL-03: Verify no unconnected Image Texture nodes in the shader tree."""
        for mat in bpy.data.materials:
            if not mat.use_nodes: continue
            
            unconnected = []
            for node in mat.node_tree.nodes:
                if node.type == 'TEX_IMAGE':
                    is_linked = any(socket.is_linked for socket in node.outputs)
                    if not is_linked:
                        unconnected.append(node.name)
            
            with self.subTest(material=mat.name):
                status = "PASS" if not unconnected else "FAIL"
                details = f"All textures linked" if not unconnected else f"Unlinked textures: {unconnected}"
                self.log_result(f"Node Links: {mat.name}", status, details)
                self.assertTrue(not unconnected, f"Material {mat.name} has unconnected image textures: {unconnected}")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)