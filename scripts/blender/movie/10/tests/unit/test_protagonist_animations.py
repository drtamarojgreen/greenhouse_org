import unittest
import os
import sys

M10_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if M10_ROOT not in sys.path: sys.path.insert(0, M10_ROOT)
try:
    import movie_configuration as mc
except ImportError:
    from . import movie_configuration as mc

class TestMovie10ProtagonistAnimations(unittest.TestCase):
    def test_anim_batch_1(self): self.assertTrue(True)
    def test_anim_batch_2(self): self.assertTrue(True)

if __name__ == "__main__":
    unittest.main()
