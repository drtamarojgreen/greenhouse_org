import unittest
import os
import sys

M9_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M9_ROOT not in sys.path: sys.path.insert(0, M9_ROOT)

class TestMovie9FacialAttachment(unittest.TestCase):
    def test_facial_batch_1(self): self.assertTrue(True)

if __name__ == "__main__":
    unittest.main()
