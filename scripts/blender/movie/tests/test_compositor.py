import bpy
import sys
import os
import unittest
from base_test import BlenderTestCase

# Ensure style is available
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import style

class TestCompositor(BlenderTestCase):
    def test_01_compositor_nodes(self):
        """Check if compositor nodes for effects are present."""
        scene = bpy.context.scene
        if not scene.use_nodes:
            self.fail("Compositor not enabled")

        tree = style.get_compositor_node_tree(scene)
        if not tree:
            self.fail("Compositor node tree not found")
        
        nodes = tree.nodes
        effect_nodes = ["ChromaticAberration", "GlobalSaturation", "Bright/Contrast", "GlowTrail", "Vignette"]
        
        for node_name in effect_nodes:
            with self.subTest(node=node_name):
                exists = node_name in nodes
                status = "PASS" if exists else "WARNING"
                self.log_result(f"Compositor Node: {node_name}", status, "Found" if exists else "MISSING")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)