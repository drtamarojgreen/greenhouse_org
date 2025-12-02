
import unittest
from canvas_ml import scorers

class TestScorers(unittest.TestCase):
    def test_calculate_palette_compliance(self):
        # Palette: Red, Green
        palette = [(255, 0, 0), (0, 255, 0)]

        # Pixels: 2 Red, 1 Green, 1 Blue (Mismatch)
        # Flattened RGBA:
        # Red: 255,0,0,255
        # Red: 255,0,0,255
        # Green: 0,255,0,255
        # Blue: 0,0,255,255

        pixels = [
            255, 0, 0, 255,
            255, 0, 0, 255,
            0, 255, 0, 255,
            0, 0, 255, 255
        ]

        # Expected: 3/4 matches = 0.75
        score = scorers.calculate_palette_compliance(pixels, palette, tolerance=0)
        self.assertEqual(score, 0.75)

    def test_calculate_palette_compliance_tolerance(self):
        # Palette: Red
        palette = [(255, 0, 0)]

        # Pixel: Slightly Darker Red (240, 0, 0)
        pixels = [240, 0, 0, 255]

        # Tolerance 20. Dist = 15. Match.
        score = scorers.calculate_palette_compliance(pixels, palette, tolerance=20)
        self.assertEqual(score, 1.0)

        # Tolerance 10. Dist = 15. No Match.
        score = scorers.calculate_palette_compliance(pixels, palette, tolerance=10)
        self.assertEqual(score, 0.0)
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
