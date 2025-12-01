
import unittest
import sys
import os

# Add tools to path so we can import canvas_ml
# Assumes we run from repo root
sys.path.append(os.path.join(os.getcwd(), 'tools'))

from canvas_ml.cnn_layer import convolve_2d, max_pool, to_grayscale
from canvas_ml.scorers import calculate_contrast
from canvas_ml.model import KMeans

class TestCanvasMLIntegration(unittest.TestCase):
    def test_cnn_logic(self):
        # 3x3 image
        image = [
            [10, 10, 10],
            [10, 10, 10],
            [10, 10, 10]
        ]
        kernel = [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1]
        ]
        # convolve_2d implementation returns valid convolution (no padding)
        # 3x3 - 3x3 + 1 = 1x1
        result = convolve_2d(image, kernel)
        self.assertEqual(len(result), 1)
        self.assertEqual(len(result[0]), 1)

    def test_max_pooling(self):
        map = [
            [1, 2, 3, 4],
            [5, 6, 7, 8],
            [1, 2, 3, 4],
            [5, 6, 7, 8]
        ]
        # max_pool signature: (feature_map, pool_size, stride)
        pooled = max_pool(map, 2, 2)
        self.assertEqual(len(pooled), 2)
        self.assertEqual(len(pooled[0]), 2)
        self.assertEqual(pooled[0][0], 6) # Max of top-left 2x2 block

    def test_scorers(self):
        # 2x2 red image
        # RGBA: 255, 0, 0, 255
        pixels = [255, 0, 0, 255] * 4
        # calculate_contrast takes only pixels
        contrast = calculate_contrast(pixels)
        self.assertEqual(contrast, 0.0) # No variation

    def test_kmeans(self):
        data = [
            [0.1, 0.1],
            [0.2, 0.2],
            [0.9, 0.9],
            [0.8, 0.8]
        ]
        model = KMeans(k=2)
        model.fit(data)
        # Should cluster close points together
        l1 = model.predict([0.15, 0.15])
        l2 = model.predict([0.85, 0.85])
        self.assertNotEqual(l1, l2)

if __name__ == '__main__':
    unittest.main()
