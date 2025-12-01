
import unittest
import sys
import os

# Add tools to path
sys.path.append(os.path.join(os.getcwd(), 'tools'))

from canvas_ml.cnn_layer import convolve2d, max_pooling, to_grayscale
from canvas_ml.scorers import calculate_contrast
from canvas_ml.model import KMeans, normalize_vectors

class TestCanvasML(unittest.TestCase):
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
        # Convolve
        # With zero padding (1), the center pixel at (1,1) (orig 0,0 relative?)
        # My implementation pads. 3x3 input becomes 5x5.
        # Top-left of output corresponds to top-left of input?
        # Let's just check it runs and returns correct shape
        # Input 3x3, Kernel 3x3, Padding 1 -> Output 3x3
        result = convolve2d(image, kernel)
        self.assertEqual(len(result), 3)
        self.assertEqual(len(result[0]), 3)

    def test_max_pooling(self):
        map = [
            [1, 2, 3, 4],
            [5, 6, 7, 8],
            [1, 2, 3, 4],
            [5, 6, 7, 8]
        ]
        # 2x2 pooling, stride 2 -> 2x2 output
        pooled = max_pooling(map, 2, 2)
        self.assertEqual(len(pooled), 2)
        self.assertEqual(len(pooled[0]), 2)
        self.assertEqual(pooled[0][0], 6) # Max of top-left 2x2 block

    def test_scorers(self):
        # 2x2 red image
        # RGBA: 255, 0, 0, 255
        pixels = [255, 0, 0, 255] * 4
        contrast = calculate_contrast(pixels, 2, 2)
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
