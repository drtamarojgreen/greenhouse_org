import bpy
import unittest
import os
import sys

# Add the necessary paths for imports
V6_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if V6_DIR not in sys.path:
    sys.path.insert(0, V6_DIR)
ASSETS_V6_DIR = os.path.join(V6_DIR, "assets_v6")
if ASSETS_V6_DIR not in sys.path:
    sys.path.insert(0, ASSETS_V6_DIR)

# Import the modules we need to test
from generate_scene6 import generate_full_scene_v6
from config import CHAR_HERBACEOUS, CHAR_ARBOR

class TestProtagonistColors(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Ensure a clean Blender scene for testing
        bpy.ops.wm.read_factory_settings(use_empty=True)
        # Generate the full scene which includes the protagonists
        generate_full_scene_v6()

    def _get_principled_bsdf_base_color(self, obj_name, material_name):
        obj = bpy.data.objects.get(obj_name)
        self.assertIsNotNone(obj, f"Object {obj_name} not found in scene.")
        
        # We need to find the specific material applied to the object
        # Since procedural materials are appended, we check by name
        material = bpy.data.materials.get(material_name)
        self.assertIsNotNone(material, f"Material {material_name} not found in bpy.data.materials.")

        self.assertTrue(material.use_nodes, f"Material {material_name} does not use nodes.")
        
        principled_bsdf = None
        for node in material.node_tree.nodes:
            if node.type == 'BSDF_PRINCIPLED':
                principled_bsdf = node
                break
        self.assertIsNotNone(principled_bsdf, f"Principled BSDF node not found in material {material_name}.")
        
        return principled_bsdf.inputs['Base Color'].default_value

    def test_herbaceous_bark_color(self):
        # The expected color for Herbaceous's bark material from plant_humanoid_v6.py
        expected_color = (0.1, 0.15, 0.05, 1.0) # RGBA
        
        actual_color = self._get_principled_bsdf_base_color(f"{CHAR_HERBACEOUS}_Body", f"Bark_{CHAR_HERBACEOUS}")
        self.assertAlmostEqual(actual_color[0], expected_color[0], places=3)
        self.assertAlmostEqual(actual_color[1], expected_color[1], places=3)
        self.assertAlmostEqual(actual_color[2], expected_color[2], places=3)

    def test_herbaceous_leaf_color(self):
        # The expected color for Herbaceous's leaf material from plant_humanoid_v6.py
        expected_color = (0.6, 0.4, 0.8, 1.0) # RGBA

        actual_color = self._get_principled_bsdf_base_color(f"{CHAR_HERBACEOUS}_Body", f"Leaf_{CHAR_HERBACEOUS}")
        self.assertAlmostEqual(actual_color[0], expected_color[0], places=3)
        self.assertAlmostEqual(actual_color[1], expected_color[1], places=3)
        self.assertAlmostEqual(actual_color[2], expected_color[2], places=3)

    def test_arbor_bark_color(self):
        # The expected color for Arbor's bark material from plant_humanoid_v6.py
        expected_color = (0.2, 0.12, 0.08, 1.0) # RGBA

        actual_color = self._get_principled_bsdf_base_color(f"{CHAR_ARBOR}_Body", f"Bark_{CHAR_ARBOR}")
        self.assertAlmostEqual(actual_color[0], expected_color[0], places=3)
        self.assertAlmostEqual(actual_color[1], expected_color[1], places=3)
        self.assertAlmostEqual(actual_color[2], expected_color[2], places=3)

    def test_arbor_leaf_color(self):
        # The expected color for Arbor's leaf material from plant_humanoid_v6.py
        expected_color = (0.2, 0.6, 0.1, 1.0) # RGBA

        actual_color = self._get_principled_bsdf_base_color(f"{CHAR_ARBOR}_Body", f"Leaf_{CHAR_ARBOR}")
        self.assertAlmostEqual(actual_color[0], expected_color[0], places=3)
        self.assertAlmostEqual(actual_color[1], expected_color[1], places=3)
        self.assertAlmostEqual(actual_color[2], expected_color[2], places=3)

if __name__ == '__main__':
    # This block allows running the test directly with Blender's python
    # by providing a dummy argv for unittest to parse
    # Blender's bpy.app.version is not available during script execution directly
    # outside of a running Blender instance, so we check for it.
    if 'bpy' in locals() and bpy.app.version < (3, 0, 0):
        # If running inside Blender, we need to adapt argv for unittest
        # Remove Blender's arguments to allow unittest to parse its own
        import sys
        if '--' in sys.argv:
            idx = sys.argv.index('--')
            sys.argv = sys.argv[idx+1:] # unittest expects its args after --
        
        # Now run the tests
        unittest.main()
    else:
        # If running outside Blender, print a message.
        print("This test is intended to be run within a Blender environment.")
        print("Please run it using: blender --background --python <path_to_this_script>")
        sys.exit(1)
