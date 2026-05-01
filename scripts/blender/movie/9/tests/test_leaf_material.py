import unittest
import bpy
import os
import sys

# Standard Path setup for tests
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M9_ROOT = os.path.dirname(TEST_DIR)

if M9_ROOT not in sys.path:
    sys.path.insert(0, M9_ROOT)

from environment.vegetation_utils import create_leaf_material

class TestMovie9LeafMaterial(unittest.TestCase):
    def test_leaf_material_nodes(self):
        """Verifies that the procedural leaf material contains noise-based translucency nodes."""
        base_color = [0.2, 0.6, 0.2]
        leaf_cfg = {"primary_color": base_color}
        mat = create_leaf_material("TestLeafMat", base_color, leaf_cfg)
        self.assertTrue(mat.use_nodes)

        node_types = [n.type for n in mat.node_tree.nodes]
        self.assertIn('TEX_NOISE', node_types)
        self.assertIn('MIX_SHADER', node_types)
        self.assertIn('BSDF_TRANSLUCENT', node_types)

if __name__ == "__main__":
    unittest.main()
