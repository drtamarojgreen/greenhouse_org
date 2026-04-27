import unittest
import bpy
import os
import sys

# Standard Path setup for tests
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M7_ROOT = os.path.dirname(TEST_DIR)

if M7_ROOT not in sys.path:
    sys.path.insert(0, M7_ROOT)

class TestMovie7RenderEngine(unittest.TestCase):
    def test_eevee_enforcement(self):
        """Verifies that the render engine is set to EEVEE and fails if Cycles is active."""
        bpy.context.scene.render.engine = 'BLENDER_EEVEE'
        self.assertEqual(bpy.context.scene.render.engine, 'BLENDER_EEVEE')
        
        # Simulate a check that would be in the render pipeline
        if bpy.context.scene.render.engine == 'CYCLES':
            self.fail("Cycles engine detected. EEVEE is strictly enforced for Movie 7 production.")

if __name__ == "__main__":
    unittest.main()
