import bpy
import sys
import os
import unittest
from base_test import BlenderTestCase

# Ensure style is available
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import style_utilities as style

class TestCompositor(BlenderTestCase):
    def test_01_compositor_nodes(self):
        """Check if compositor nodes for effects are present."""
        scene = bpy.context.scene
        if not scene.use_nodes:
            self.fail("Compositor not enabled")

        tree = style.get_compositor_node_tree(scene)
        if not tree:
            self.fail("Compositor node tree not found")
        
        render_layers_node = tree.nodes.get("Render Layers")
        composite_node = tree.nodes.get("Composite") or tree.nodes.get("Group Output")
        
        # If still None, try by type
        if not composite_node:
            for n in tree.nodes:
                if n.type in ('COMPOSITE', 'GROUP_OUTPUT', 'NodeGroupOutput'):
                    composite_node = n
                    break

        self.assertIsNotNone(render_layers_node, "Compositor is missing a 'Render Layers' node.")
        self.assertIsNotNone(composite_node, "Compositor is missing a 'Composite' or 'Group Output' node.")

        effect_nodes = ["ChromaticAberration", "GlobalSaturation", "Bright/Contrast", "GlowTrail", "Vignette"]
        
        for node_name in effect_nodes:
            with self.subTest(node=node_name):
                node = tree.nodes.get(node_name)
                exists = node is not None
                
                # Robustness: Check if the node is connected in the main path.
                is_connected = False
                if exists:
                    # A simple check: does it have both inputs and outputs linked?
                    # Mask nodes like EllipseMask have no inputs.
                    has_input_link = any(inp.is_linked for inp in node.inputs) or node.type in ('ELLIPSEMASK', 'BOXMASK', 'MASK', 'RGB', 'VALUE', 'TEXTURE')
                    has_output_link = any(out.is_linked for out in node.outputs)
                    is_connected = has_input_link and has_output_link

                status = "PASS" if is_connected else "FAIL"
                details = "Found and connected" if is_connected else ("Found but disconnected" if exists else "MISSING")
                self.log_result(f"Compositor Node: {node_name}", status, details)
                self.assertTrue(is_connected, f"Node '{node_name}' is missing or not connected in the compositor.")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)