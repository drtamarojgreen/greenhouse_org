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
                    # Robustness: Check for a Principled BSDF node, which is essential for modern materials.
                    has_bsdf = False
                    if mat.use_nodes and mat.node_tree:
                        has_bsdf = any(n.type == 'BSDF_PRINCIPLED' for n in mat.node_tree.nodes)
                    status = "PASS" if has_bsdf else "FAIL"
                    details = "Has Principled BSDF" if has_bsdf else "MISSING Principled BSDF node"
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
            is_connected = False
            for node in mat.node_tree.nodes:
                for exp in expected_types:
                    if exp in node.name or exp in node.type or (hasattr(node, 'texture') and exp in node.texture.name):
                        found_types.append(exp)
                        # Robustness: Check if this found node is actually connected to anything.
                        for output in node.outputs:
                            if output.is_linked:
                                is_connected = True
                                break
                        if is_connected: break
                if is_connected: break
            
            found_and_connected = len(set(found_types) & set(expected_types)) > 0 and is_connected
            status = "PASS" if found_and_connected else "FAIL"
            details = f"Found and connected {list(set(found_types))}" if found_and_connected else f"Missing or disconnected expected node(s): {expected_types}"
            self.log_result(f"Texture: {mat_name}", status, details)
            self.assertTrue(found_and_connected)

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

    def test_04_lod_logic_verification(self):
        """OPT-01: Verify existence of LOD_Switch logic in botanical materials."""
        mats_with_lod = ["LeafMat_Herbaceous", "LeafMat_Arbor", "BarkMat_Herbaceous"]
        for mat_name in mats_with_lod:
            mat = bpy.data.materials.get(mat_name)
            if not mat: continue
            
            # Look for a node group or math node that acts as an LOD switch
            has_lod = False
            if mat.use_nodes:
                for node in mat.node_tree.nodes:
                    if "LOD" in node.name.upper() or (node.type == 'GROUP' and node.node_tree and "LOD" in node.node_tree.name.upper()):
                        has_lod = True
                        break
            
            status = "PASS" if has_lod else "WARNING"
            details = "LOD logic found" if has_lod else "LOD logic MISSING"
            self.log_result(f"LOD Logic: {mat_name}", status, details)
            # Warning only as per plan

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)