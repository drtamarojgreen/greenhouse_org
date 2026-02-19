import bpy
import unittest
import os
import sys

# Add movie root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from silent_movie_generator import MovieMaster
import style

class TestExecutiveQualityBenchmarks(unittest.TestCase):
    """
    Point 100: Executive benchmarks for cinematic quality.
    Ensures that the systemic overhaul meets the Producer's standards.
    """
    @classmethod
    def setUpClass(cls):
        cls.master = MovieMaster(mode='SILENT_FILM')
        cls.master.run()

    def test_noise_modifier_adoption(self):
        """Benchmark: Verify Noise modifiers are used instead of massive keyframing."""
        # Point 23, 24, 26
        # Check flicker on Bright/Contrast node
        scene = bpy.context.scene
        tree = style.get_compositor_node_tree(scene)
        if tree and tree.animation_data and tree.animation_data.action:
            flicker_found = False
            for fc in style.get_action_curves(tree.animation_data.action):
                if 'Bright' in fc.data_path:
                    for mod in fc.modifiers:
                        if mod.type == 'NOISE':
                            flicker_found = True
            self.assertTrue(flicker_found, "Film flicker should use Noise modifier")

    def test_material_normal_combination(self):
        """Benchmark: Verify bark material uses combined normals."""
        # Point 72
        mat = bpy.data.materials.get("PlantMat_Herbaceous")
        if mat and mat.use_nodes:
            # Look for two Bump nodes in the chain
            bumps = [n for n in mat.node_tree.nodes if n.type == 'BUMP']
            self.assertGreaterEqual(len(bumps), 2, "Bark material should combine multiple bump layers")

    def test_saccade_discrete_nature(self):
        """Benchmark: Verify eye saccades are discrete jumps, not noise."""
        # Point 87
        eye = bpy.data.objects.get("Herbaceous_Eye_L")
        if eye and eye.animation_data:
            fc = next((c for c in style.get_action_curves(eye.animation_data.action) if "rotation_euler" in c.data_path), None)
            if fc:
                # Saccades should have fewer, sharper keyframes than noise
                # A 15000 frame timeline with noise every frame would have 15000 points.
                # Saccades should have significantly less.
                self.assertLess(len(fc.keyframe_points), 2000, "Eye movement still looks like continuous noise")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)
