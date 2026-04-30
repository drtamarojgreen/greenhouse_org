import unittest
import bpy
import os
import sys

M9_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M9_ROOT not in sys.path: sys.path.insert(0, M9_ROOT)

from director import Director

class TestMovie9LightingPresence(unittest.TestCase):
    def test_lighting_rig_presence(self):
        """Ported from M6: Verifies that lighting objects are created."""
        d = Director(); d.setup_lighting()
        self.assertGreater(len([o for o in bpy.data.objects if o.type == 'LIGHT']), 0)

if __name__ == "__main__":
    unittest.main()
