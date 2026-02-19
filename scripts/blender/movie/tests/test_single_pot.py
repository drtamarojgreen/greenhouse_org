import bpy
import os
import sys
import unittest

# Add movie root to path for local imports
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

from assets import greenhouse_interior

class TestSinglePot(unittest.TestCase):
    def test_single_pot_count(self):
        """Verify that creating a plant uses exactly one object (an instance)."""
        # Clear scene
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete()

        initial_objs = len(bpy.data.objects)
        greenhouse_interior.create_potted_plant((0,0,0), plant_type='FERN', name="TestPot")

        final_objs = len(bpy.data.objects)
        diff = final_objs - initial_objs
        print(f"\nDEBUG: Potted plant created {diff} objects (including instances).")
        # With collection instancing, it should be exactly ONE empty object
        self.assertEqual(diff, 1, f"Expected 1 object for instance, got {diff}")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)
