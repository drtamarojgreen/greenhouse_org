import bpy
import unittest
import os
import sys
import math

# Add movie root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from silent_movie_generator import MovieMaster
import style

class TestAssetDetails(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Run the movie master to generate the scene
        cls.master = MovieMaster(mode='SILENT_FILM')
        cls.master.run()

    def test_herbaceous_hierarchy(self):
        """Verify the rigged hierarchy of Herbaceous."""
        arm = bpy.data.objects.get("Herbaceous")
        self.assertIsNotNone(arm, "Herbaceous Armature missing")
        self.assertEqual(arm.type, 'ARMATURE')

        mesh = bpy.data.objects.get("Herbaceous_Mesh")
        self.assertIsNotNone(mesh, "Herbaceous_Mesh missing")
        self.assertEqual(mesh.parent, arm, "Mesh not parented to Armature")

        # Check for Armature modifier
        mod = next((m for m in mesh.modifiers if m.type == 'ARMATURE' and m.object == arm), None)
        self.assertIsNotNone(mod, "Mesh missing Armature modifier")

        # Check for vertex groups
        vg_names = [vg.name for vg in mesh.vertex_groups]
        self.assertIn("Torso", vg_names)
        self.assertIn("Head", vg_names)

    def test_gnome_hierarchy(self):
        """Verify the rigged hierarchy of the Gloom Gnome."""
        arm = bpy.data.objects.get("GloomGnome")
        self.assertIsNotNone(arm, "GloomGnome Armature missing")

        mesh = bpy.data.objects.get("GloomGnome_Mesh")
        self.assertIsNotNone(mesh, "GloomGnome_Mesh missing")
        self.assertEqual(mesh.parent, arm)

    def test_procedural_textures_in_materials(self):
        """Verify that materials contain expected procedural nodes."""
        def check_node_type(mat, type_name):
            if not mat or not mat.use_nodes or not mat.node_tree: return False
            return any(n.type == type_name for n in mat.node_tree.nodes)

        # Herbaceous Bark
        mat_bark = bpy.data.materials.get("PlantMat_Herbaceous")
        self.assertIsNotNone(mat_bark)
        self.assertTrue(check_node_type(mat_bark, 'TEX_NOISE'))

        # Greenhouse Iron
        mat_iron = bpy.data.materials.get("GH_Iron")
        self.assertTrue(check_node_type(mat_iron, 'TEX_NOISE'))

    def test_compositor_nodes(self):
        """Verify compositor setup includes essential nodes."""
        scene = bpy.context.scene
        tree = style.get_compositor_node_tree(scene)
        self.assertIsNotNone(tree)

        node_types = [n.type for n in tree.nodes]
        self.assertIn('GLARE', node_types)
        self.assertIn('LENSDIST', node_types)
        self.assertIn('ELLIPSEMASK', node_types)

    def test_visibility_keyframes(self):
        """Verify visibility (hide_render) keyframes for assets."""
        arm = bpy.data.objects.get("Herbaceous")
        self.assertIsNotNone(arm.animation_data)

        curves = style.get_action_curves(arm.animation_data.action)
        hide_render_curve = next((fc for fc in curves if "hide_render" in fc.data_path), None)
        self.assertIsNotNone(hide_render_curve, "Herbaceous Armature missing hide_render keyframes")

        keyframes = [kp.co[0] for kp in hide_render_curve.keyframe_points]
        # Range 501-650
        self.assertIn(500, keyframes)
        self.assertIn(501, keyframes)

if __name__ == "__main__":
    # Filter out Blender arguments
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv, exit=False)
