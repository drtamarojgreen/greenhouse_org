
import unittest
import sys
import os

sys.path.append(os.path.join(os.getcwd(), 'tools'))
from canvas_ml import scorers

class TestNewScorers(unittest.TestCase):
    def test_symmetry_perfect(self):
        # 4x2 grid
        # 10 20 | 20 10
        # 50 60 | 60 50
        grid = [
            [10, 20, 20, 10],
            [50, 60, 60, 50]
        ]
        score = scorers.calculate_symmetry(grid)
        self.assertAlmostEqual(score, 1.0)

    def test_symmetry_none(self):
        # 4x1 grid
        # 0 0 | 255 255
        grid = [[0, 0, 255, 255]]
        # diff: |0-255|/255 = 1.0
        # diff: |0-255|/255 = 1.0
        # avg diff = 1.0
        # symmetry = 0.0
        score = scorers.calculate_symmetry(grid)
        self.assertAlmostEqual(score, 0.0)

    def test_symmetry_partial(self):
        # 2x1 grid
        # 0 128
        # diff: |0-128|/255 ~= 0.5
        # symmetry ~= 0.5
        grid = [[0, 128]]
        score = scorers.calculate_symmetry(grid)
        self.assertAlmostEqual(score, 1.0 - (128/255.0), places=5)

if __name__ == '__main__':
    unittest.main()
