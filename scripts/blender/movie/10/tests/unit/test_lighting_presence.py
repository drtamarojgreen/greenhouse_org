import unittest
try: import bpy
except ImportError: bpy = None
import os
import sys

M10_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if M10_ROOT not in sys.path: sys.path.insert(0, M10_ROOT)
try:
    import movie_configuration as mc
except ImportError:
    from . import movie_configuration as mc

try:
    try:
    from director import
except ImportError:
    from ..director import Director
except ImportError:
    from .director import Director

class TestMovie10LightingPresence(unittest.TestCase):
    def test_lighting_rig_presence(self):
        """Ported from M6: Verifies that lighting objects are created."""
        d = Director(); d.setup_lighting()
        self.assertGreater(len([o for o in bpy.data.objects if o.type == 'LIGHT']), 0)

if __name__ == "__main__":
    unittest.main()
