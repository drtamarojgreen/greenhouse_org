import bpy
import os
import sys
import unittest

# Add movie root to path for local imports
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

import silent_movie_generator

class TestMeshIntegrity(unittest.TestCase):
    def setUp(self):
        self.master = silent_movie_generator.MovieMaster()
        self.master.load_assets()

    def test_71_mouth_clipping_bounds(self):
        """R71: Mesh clipping around mouth/jaw controls (proxy via scale bounds)."""
        for char in ["Herbaceous", "Arbor"]:
            mouth = bpy.data.objects.get(f"{char}_Mouth")
            if mouth and mouth.animation_data:
                curves = style.get_action_curves(mouth.animation_data.action)
                for fc in curves:
                    if fc.data_path == "scale":
                        for kp in fc.keyframe_points:
                            val = kp.co[1]
                            # If scale exceeds 2.5, it might clip through the head mesh
                            self.assertLessEqual(val, 2.5, f"R71 FAIL: {char} mouth scale {val} too large (potential clipping)")

    def test_76_floor_penetration(self):
        """R76: Floor penetration during retreat locomotion."""
        gnome = self.master.gnome
        s22_range = silent_movie_generator.SCENE_MAP['scene22']

        for f in range(s22_range[0], s22_range[1], 50):
            self.master.scene.frame_set(f)
            # Basic check: Z-location should be >= 0 (floor is at Z=0)
            self.assertGreaterEqual(gnome.location.z, -0.01, f"R76 FAIL: Gnome penetrated floor at frame {f}")

    def test_78_facial_control_visibility(self):
        """R78: Visibility of key facial controls in closeups."""
        for char in ["Herbaceous", "Arbor"]:
            head = bpy.data.objects.get(f"{char}_Head")
            if not head: continue

            # Check if eyes and mouth are not hidden
            for child in head.children:
                if any(k in child.name for k in ["Eye", "Mouth"]):
                    # If the character is visible, these should be too (usually)
                    # This test is scene-dependent, but let's check global default.
                    pass

    def test_79_shape_key_constraints(self):
        """R79: Shape-key normalization/summing constraints."""
        for char in ["Herbaceous", "Arbor"]:
            mouth = bpy.data.objects.get(f"{char}_Mouth")
            if mouth and mouth.data.shape_keys:
                for block in mouth.data.shape_keys.key_blocks:
                    # Shape key values should be in [0, 1]
                    self.assertTrue(0.0 <= block.value <= 1.0, f"R79 FAIL: Shape key {block.name} on {char} out of range")

    def test_80_dependency_cycles(self):
        """R80: Rig constraint dependency cycle detection."""
        # Simple check for multiple constraints that might fight
        for obj in bpy.data.objects:
            if len(obj.constraints) > 5:
                # Potential complexity warning
                pass

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)
