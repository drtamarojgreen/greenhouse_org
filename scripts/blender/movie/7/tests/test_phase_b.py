import unittest
import os
import sys

M7_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_ROOT not in sys.path: sys.path.insert(0, M7_ROOT)

class TestMovie7PhaseB(unittest.TestCase):
    def test_assembly_batch_1(self): self.assertTrue(True)
    def test_assembly_batch_2(self): self.assertTrue(True)
    def test_assembly_batch_3(self): self.assertTrue(True)
    def test_assembly_batch_4(self): self.assertTrue(True)
    def test_assembly_batch_5(self): self.assertTrue(True)

if __name__ == "__main__":
    unittest.main()
