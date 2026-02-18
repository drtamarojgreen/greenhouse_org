import bpy
import sys
import unittest
from base_test import BlenderTestCase

class TestLighting(BlenderTestCase):
    def test_01_volume_scatter(self):
        """Verify volume scatter density."""
        world = bpy.context.scene.world
        vol = world.node_tree.nodes.get("Volume Scatter")
        if vol:
            density = vol.inputs['Density'].default_value
            is_sane = 0.0 < density < 0.1
            status = "PASS" if is_sane else "WARNING"
            self.log_result("Volume Density", status, f"{density}")
        else:
            self.log_result("Volume Density", "FAIL", "Node MISSING")

    def test_02_lighting_check(self):
        """Ensure there are active light sources."""
        lights = [o for o in bpy.data.objects if o.type == 'LIGHT']
        visible_lights = [l for l in lights if not l.hide_render]
        
        emissive_mats = []
        for mat in bpy.data.materials:
            if mat.use_nodes:
                for node in mat.node_tree.nodes:
                    if hasattr(node, 'inputs') and 'Emission Strength' in node.inputs and node.inputs['Emission Strength'].default_value > 0:
                        emissive_mats.append(mat.name)

        has_light = len(visible_lights) > 0 or len(emissive_mats) > 0
        self.log_result("Lighting Check", "PASS" if has_light else "FAIL", f"Lights: {len(visible_lights)}, Emissive: {len(emissive_mats)}")
        self.assertTrue(has_light)

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)