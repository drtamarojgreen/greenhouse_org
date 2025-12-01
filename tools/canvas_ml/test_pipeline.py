
import unittest
from tools.canvas_ml import cnn_layer, scorers, model

class TestCanvasML(unittest.TestCase):

    def test_convolution_logic(self):
        # 3x3 image, 3x3 kernel -> 1x1 output
        image = [
            [10, 10, 10],
            [10, 10, 10],
            [10, 10, 10]
        ]
        kernel = [
            [0, 0, 0],
            [0, 1, 0],
            [0, 0, 0]
        ]
        # Identity kernel center -> should output value of center pixel (10)
        output = cnn_layer.convolve_2d(image, kernel)
        self.assertEqual(len(output), 1)
        self.assertEqual(len(output[0]), 1)
        self.assertEqual(output[0][0], 10)

    def test_max_pool_logic(self):
        # 4x4 image
        image = [
            [1, 2, 3, 4],
            [5, 6, 7, 8],
            [9, 1, 2, 3],
            [4, 5, 6, 7]
        ]
        # Pool size 2, stride 2 -> 2x2 output
        # Top-left window [1,2,5,6] -> max 6
        # Top-right window [3,4,7,8] -> max 8
        # Bot-left window [9,1,4,5] -> max 9
        # Bot-right window [2,3,6,7] -> max 7
        output = cnn_layer.max_pool(image, 2, 2)
        self.assertEqual(output, [[6, 8], [9, 7]])

    def test_contrast_scorer(self):
        # All black -> 0 contrast
        pixels = [0, 0, 0, 255, 0, 0, 0, 255]
        score = scorers.calculate_contrast(pixels)
        self.assertEqual(score, 0.0)

        # Black and White
        # Lum Black = 0
        # Lum White ~ 255
        # Mean ~ 127.5
        # Std Dev ~ 127.5
        pixels_bw = [0,0,0,255, 255,255,255,255]
        score_bw = scorers.calculate_contrast(pixels_bw)
        self.assertTrue(score_bw > 100)

    def test_kmeans(self):
        data = [
            [1, 1],
            [1.1, 1.1],
            [10, 10],
            [10.1, 10.1]
        ]
        kmeans = model.KMeans(k=2)
        kmeans.fit(data)

        # Should group smalls together and bigs together
        p1 = kmeans.predict([1.05, 1.05])
        p2 = kmeans.predict([10.05, 10.05])

        self.assertNotEqual(p1, p2)

    def test_color_entropy(self):
        # Single color -> 0 entropy
        pixels = [255, 0, 0, 255] * 10
        entropy = scorers.calculate_color_entropy(pixels)
        self.assertAlmostEqual(entropy, 0.0)

        # Uniform distribution of colors
        # For simplicity, we can't easily create a perfectly uniform distribution in 8x8x8 bins with few pixels
        # But we can try 2 distinct colors
        # Red and Blue
        pixels_mix = [255, 0, 0, 255, 0, 0, 255, 255]
        entropy_mix = scorers.calculate_color_entropy(pixels_mix)
        # 2 bins with p=0.5 -> entropy = -0.5*log2(0.5) * 2 = 0.5 + 0.5 = 1.0
        self.assertAlmostEqual(entropy_mix, 1.0)

if __name__ == '__main__':
    unittest.main()
