import bpy
import sys
import unittest
from base_test import BlenderTestCase

class TestLighting(BlenderTestCase):
    def test_01_volume_scatter(self):
        """Verify volume scatter density."""
        world = bpy.context.scene.world
        self.assertTrue(world and world.use_nodes and world.node_tree, "World nodes are not enabled.")
        
        vol_node = world.node_tree.nodes.get("Volume Scatter")
        world_output = world.node_tree.nodes.get("World Output")

        self.assertIsNotNone(vol_node, "Volume Scatter node is MISSING.")
        self.assertIsNotNone(world_output, "World Output node is MISSING.")

        # Robustness: Check that the volume scatter is actually connected to the world output.
        is_connected = any(link.from_node == vol_node for link in world.node_tree.links if link.to_node == world_output and link.to_socket.name == "Volume")
        self.assertTrue(is_connected, "Volume Scatter node is not connected to the World Output.")

        if vol_node:
            density = vol_node.inputs['Density'].default_value
            is_sane = 0.0 < density < 0.1
            status = "PASS" if is_sane else "WARNING"
            self.log_result("Volume Density", status, f"{density}")

    def test_02_lighting_check(self):
        """Ensure there are active light sources."""
        # Robustness: Check for specific, powerful light types, not just any light.
        key_lights = [o for o in bpy.data.objects if o.type == 'LIGHT' and o.data.type in ('SUN', 'AREA') and not o.hide_render and o.data.energy > 1.0]
        
        emissive_mats = []
        for mat in bpy.data.materials:
            if mat.use_nodes:
                for node in mat.node_tree.nodes:
                    # Robustness: Check for a meaningful emission strength.
                    if hasattr(node, 'inputs') and 'Emission Strength' in node.inputs and node.inputs['Emission Strength'].default_value > 0.1:
                        emissive_mats.append(mat.name)

        has_light = len(key_lights) > 0 or len(emissive_mats) > 0
        self.log_result("Lighting Check", "PASS" if has_light else "FAIL", f"Key Lights: {len(key_lights)}, Strong Emissive Mats: {len(emissive_mats)}")
        self.assertTrue(has_light)

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)