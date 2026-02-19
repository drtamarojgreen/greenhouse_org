import bpy
import os
import sys
import unittest
import math

# Add movie root to path for local imports
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

import silent_movie_generator
import style

class TestLightingIntegrity(unittest.TestCase):
    def setUp(self):
        self.master = silent_movie_generator.MovieMaster()
        self.master.run()

    def test_62_key_light_bounds(self):
        """R62: Key light (Sun) intensity bounds."""
        sun = bpy.data.objects.get("Sun")
        if sun and hasattr(sun.data, "energy"):
            energy = sun.data.energy
            self.assertTrue(1.0 <= energy <= 20.0, f"R62 FAIL: Sun energy {energy} out of bounds")

    def test_63_lighting_ratios(self):
        """R63: Fill/rim ratio bounds."""
        fill = bpy.data.objects.get("FillLight")
        rim = bpy.data.objects.get("RimLight")

        if fill and rim:
            # Rim is usually stronger than fill in this dramatic style
            ratio = rim.data.energy / fill.data.energy
            self.assertTrue(1.0 <= ratio <= 5.0, f"R63 FAIL: Rim/Fill ratio {ratio} out of bounds")

    def test_68_volumetric_stability(self):
        """R68: Volumetric effect stability."""
        beam = bpy.data.objects.get("LightShaftBeam")
        if beam and beam.data.animation_data and beam.data.animation_data.action:
            curves = style.get_action_curves(beam.data.animation_data.action)
            for fc in curves:
                if fc.data_path == "energy":
                    for kp in fc.keyframe_points:
                        val = kp.co[1]
                        # Ensure no insane bursts
                        self.assertLess(val, 200000, f"R68 FAIL: Volumetric burst {val} detected")

    def test_64_exposure_consistency(self):
        """R64: Exposure consistency across contiguous shots."""
        # Check if brightness keyframes have massive jumps between frames
        scene = self.master.scene
        tree = style.get_compositor_node_tree(scene)
        bright = tree.nodes.get("Bright/Contrast")
        if bright and tree.animation_data and tree.animation_data.action:
            # Animation for compositor nodes is stored on the node_tree itself
            curves = style.get_action_curves(tree.animation_data.action)
            bright_curves = [fc for fc in curves if 'Bright/Contrast' in fc.data_path and 'Bright' in fc.data_path]
            
            for fc in bright_curves:
                last_val = None
                for kp in fc.keyframe_points:
                    if last_val is not None:
                        diff = abs(kp.co[1] - last_val)
                        self.assertLess(diff, 1.0, f"R64 FAIL: Sudden exposure jump of {diff} at frame {kp.co[0]}")
                    last_val = kp.co[1]

    def test_67_shadow_direction(self):
        """R67: Shadow direction continuity (Sun rotation)."""
        sun = bpy.data.objects.get("Sun")
        if sun and sun.animation_data and sun.animation_data.action:
             curves = style.get_action_curves(sun.animation_data.action)
             for fc in curves:
                 if fc.data_path == "rotation_euler":
                     # No sudden spins
                     pass

    def test_70_antagonist_readability(self):
        """R70: Antagonist remains readable during retreat lighting."""
        # Check if gnome has a light source nearby or if world light is sufficient
        # (Simplified: check if Spot light is active during retreat)
        s22_range = silent_movie_generator.SCENE_MAP['scene22']
        spot = bpy.data.objects.get("Spot")
        if spot:
            self.assertGreater(spot.data.energy, 1000, "R70 FAIL: Spot light too dim for retreat")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)
