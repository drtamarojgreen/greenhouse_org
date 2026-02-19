import bpy
import unittest
import os
import sys
from silent_movie_generator import MovieMaster
import style

class TestAssetDetails(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.master = MovieMaster(mode='SILENT_FILM')
        cls.master.run()

    def test_herbaceous_hierarchy(self):
        """Verify rigged hierarchy (5.0+)."""
        arm = bpy.data.objects.get("Herbaceous")
        self.assertIsNotNone(arm); self.assertEqual(arm.type, 'ARMATURE')
        mesh = bpy.data.objects.get("Herbaceous_Torso")
        self.assertIsNotNone(mesh); self.assertEqual(mesh.parent, arm)
        self.assertTrue(any(m.type == 'ARMATURE' and m.object == arm for m in mesh.modifiers))

    def test_procedural_textures(self):
        """Verify 5.0+ procedural materials."""
        mat = bpy.data.materials.get("LeafMat_Herbaceous")
        self.assertTrue(any(n.type == 'TEX_NOISE' for n in mat.node_tree.nodes))

    def test_compositor_nodes(self):
        """Verify 5.0+ compositor tree."""
        scene = bpy.context.scene
        tree = style.get_compositor_node_tree(scene)
        types = [n.type for n in tree.nodes]
        self.assertIn('GLARE', types); self.assertIn('LENSDIST', types); self.assertIn('ELLIPSEMASK', types)

    def test_visibility_keyframes(self):
        """Verify 5.0+ layered action visibility."""
        arm = bpy.data.objects.get("Herbaceous")
        curves = style.get_action_curves(arm.animation_data.action)
        self.assertTrue(any("hide_render" in fc.data_path for fc in curves))

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv: argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv, exit=False)
