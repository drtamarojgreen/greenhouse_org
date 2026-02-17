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
        # Point 59: Support --quick flag for faster tests
        quick = "--quick" in sys.argv
        cls.master = MovieMaster(mode='SILENT_FILM')
        cls.master.run(quick=quick)

    def test_herbaceous_hierarchy(self):
        """Verify the deep hierarchy of Herbaceous."""
        torso = bpy.data.objects.get("Herbaceous_Torso")
        self.assertIsNotNone(torso, "Herbaceous_Torso missing")

        # Check for immediate children
        child_names = [c.name for c in torso.children]
        expected_children = ["Herbaceous_Head", "Herbaceous_Arm_L", "Herbaceous_Arm_R", "Herbaceous_Leg_L", "Herbaceous_Leg_R", "Herbaceous_ReasonStaff"]
        for name in expected_children:
            self.assertIn(name, child_names, f"Herbaceous child {name} missing or not parented to Torso")

        # Check Head children (facial details)
        head = bpy.data.objects.get("Herbaceous_Head")
        head_children = [c.name for c in head.children]
        self.assertIn("Herbaceous_Eye_L", head_children)
        self.assertIn("Herbaceous_Eye_R", head_children)
        self.assertIn("Herbaceous_Mouth", head_children)

        # Check for leaves
        leaves = [c for c in head_children if "Leaf" in c]
        self.assertGreater(len(leaves), 10, "Herbaceous Head should have many leaves")

    def test_gnome_hierarchy(self):
        """Point 28 & 58: Verify the hierarchy of the Gloom Gnome (with merged static parts)."""
        torso = bpy.data.objects.get("GloomGnome_Torso")
        self.assertIsNotNone(torso, "GloomGnome_Torso missing")

        # After Point 28, Hat/Beard/Cloak are joined into Torso mesh, not children.
        child_names = [c.name for c in torso.children]
        self.assertIn("GloomGnome_Staff_Container", child_names)

        # Check staff container for segments
        staff = bpy.data.objects.get("GloomGnome_Staff_Container")
        staff_children = [c.name for c in staff.children]
        self.assertTrue(any("StaffSeg" in c for c in staff_children), "Gnome Staff missing segments")
        self.assertIn("GloomGnome_GloomOrb", staff_children)

    def test_procedural_textures_in_materials(self):
        """Verify that materials contain the expected procedural texture nodes."""
        # Herbaceous Bark
        mat_bark = bpy.data.materials.get("PlantMat_Herbaceous")
        self.assertIsNotNone(mat_bark)
        nodes = mat_bark.node_tree.nodes
        node_types = [n.type for n in nodes]
        self.assertIn('TEX_NOISE', node_types, "Herbaceous Bark material missing Noise texture")
        self.assertIn('TEX_VORONOI', node_types, "Herbaceous Bark material missing Voronoi texture")

        # Herbaceous Leaf
        mat_leaf = bpy.data.materials.get("LeafMat_Herbaceous")
        self.assertIsNotNone(mat_leaf)
        node_types_leaf = [n.type for n in mat_leaf.node_tree.nodes]
        self.assertIn('TEX_WAVE', node_types_leaf, "Herbaceous Leaf material missing Wave texture (Venation)")

        # Gnome Cloak
        mat_cloak = bpy.data.materials.get("GloomGnome_MatCloak")
        self.assertIsNotNone(mat_cloak)
        node_types_cloak = [n.type for n in mat_cloak.node_tree.nodes]
        self.assertIn('TEX_WAVE', node_types_cloak, "Gnome Cloak material missing Wave texture (Weave)")

    def test_compositor_textures(self):
        """Verify compositor setup includes Film Noise and Scratches."""
        scene = bpy.context.scene
        tree = style.get_compositor_node_tree(scene)
        self.assertIsNotNone(tree)

        tex_nodes = [n for n in tree.nodes if n.type == 'TEXTURE']
        self.assertGreaterEqual(len(tex_nodes), 2, "Compositor should have at least 2 texture nodes (Grain and Scratches)")

        textures = [n.texture.name for n in tex_nodes if n.texture]
        self.assertIn("FilmNoise", textures)
        self.assertIn("Scratches", textures)

    def test_visibility_keyframes(self):
        """Verify visibility (hide_render) keyframes for assets across the timeline."""
        # Herbaceous (Plant) visibility ranges (from silent_movie_generator.py)
        # p_ranges = [(501, 650), (751, 950), (1051, 1250), (1601, 1800), (2101, 2500), (2601, 2800), (2901, 3400), (3901, 4100), (4501, 9500)]
        torso = bpy.data.objects.get("Herbaceous_Torso")
        anim_data = torso.animation_data
        self.assertIsNotNone(anim_data)

        curves = style.get_action_curves(anim_data.action)
        hide_render_curve = next((fc for fc in curves if fc.data_path == "hide_render"), None)
        self.assertIsNotNone(hide_render_curve, "Herbaceous missing hide_render keyframes")

        keyframes = [kp.co[0] for kp in hide_render_curve.keyframe_points]

        # Check some key frames
        self.assertIn(500, keyframes) # rs-1 for 501
        self.assertIn(501, keyframes) # rs for 501
        self.assertIn(650, keyframes) # re for 650

        # Check new interaction range visibility
        self.assertIn(4501, keyframes)
        self.assertIn(9500, keyframes)

        # Gnome visibility
        gnome = bpy.data.objects.get("GloomGnome_Torso")
        gnome_anim = gnome.animation_data
        gnome_curves = style.get_action_curves(gnome_anim.action)
        gnome_hide = next((fc for fc in gnome_curves if fc.data_path == "hide_render"), None)
        gnome_kps = [kp.co[0] for kp in gnome_hide.keyframe_points]

        # Gnome visible in (2101, 2500), (2601, 2800)
        self.assertIn(2101, gnome_kps)
        self.assertIn(2800, gnome_kps)

if __name__ == "__main__":
    # Filter out Blender arguments
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv, exit=False)
