import bpy
import unittest
import warnings
import style_utilities as style
from assets import gnome_antagonist, plant_humanoid, greenhouse_structure

class TestBlenderCompatibility(unittest.TestCase):
    """
    Ensures that movie assembly scripts run without DeprecationWarnings
    related to .use_nodes in Blender 5.x.
    """

    @classmethod
    def setUpClass(cls):
        # Treat all deprecation warnings as errors for this test
        warnings.simplefilter("error", DeprecationWarning)
        # Specifically ignore some known 3rd party or internal Blender warnings if they interfere,
        # but the goal is to catch OUR usage of .use_nodes.

    @classmethod
    def tearDownClass(cls):
        warnings.simplefilter("default", DeprecationWarning)

    def setUp(self):
        style.clear_scene_selective()

    def test_material_compat_helper(self):
        """Verify ensure_material_node_tree works without warnings."""
        mat = bpy.data.materials.new(name="TestMat")
        tree = style.ensure_material_node_tree(mat)
        self.assertIsNotNone(tree)
        self.assertEqual(tree.bl_idname, 'ShaderNodeTree')

    def test_compositor_compat_helper(self):
        """Verify ensure_compositor_tree works without warnings."""
        scene = bpy.context.scene
        tree = style.ensure_compositor_tree(scene)
        self.assertIsNotNone(tree)
        self.assertEqual(tree.bl_idname, 'CompositorNodeTree')

    def test_world_compat_helper(self):
        """Verify ensure_world_node_tree works without warnings."""
        world = bpy.context.scene.world
        tree = style.ensure_world_node_tree(world)
        self.assertIsNotNone(tree)
        self.assertEqual(tree.bl_idname, 'ShaderNodeTree')

    def test_gnome_material_assembly(self):
        """Verify gnome materials build without warnings."""
        gnome_antagonist.create_gnome("TestGnome", (0,0,0))
        # If we reached here without a DeprecationWarning error, we pass

    def test_plant_material_assembly(self):
        """Verify plant materials build without warnings."""
        plant_humanoid.create_plant_humanoid("TestPlant", (0,0,0))

    def test_greenhouse_material_assembly(self):
        """Verify greenhouse materials build without warnings."""
        greenhouse_structure.create_greenhouse_iron_mat()
        greenhouse_structure.create_greenhouse_glass_mat()
        greenhouse_structure.create_mossy_stone_mat()

    def test_compositor_setup_assembly(self):
        """Verify style compositor setup works without warnings."""
        scene = bpy.context.scene
        style.get_compositor_node_tree(scene)
        style.setup_chromatic_aberration(scene)
        style.setup_saturation_control(scene)

if __name__ == '__main__':
    unittest.main()
