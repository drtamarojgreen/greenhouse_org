"""
Main orchestrator for the Vision ML Pipeline.
"""

import sys
import os

# Add current directory to path so we can import modules if run directly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from .renderer import Renderer
    from .cnn_layer import to_grayscale, convolve2d, max_pooling, flatten, KERNELS
    from .scorers import calculate_contrast, calculate_white_space, calculate_color_themes
    from .model import KMeans, normalize_vectors
except ImportError:
    # Fallback for direct execution
    from renderer import Renderer
    from cnn_layer import to_grayscale, convolve2d, max_pooling, flatten, KERNELS
    from scorers import calculate_contrast, calculate_white_space, calculate_color_themes
    from model import KMeans, normalize_vectors

class Pipeline:
    def __init__(self):
        self.renderer = Renderer()
        self.model = KMeans(k=3) # 3 archetypes: Good, Bad, Cluttered?
        self.training_data = [] # Store vectors

    def analyze_url(self, url):
        """
        Runs the full pipeline on a single URL.
        """
        print(f"Analyzing {url}...")

        # 1. Render & Capture
        results = self.renderer.render_and_capture(url)
        if results.get("error"):
            print(f"Error rendering {url}: {results['error']}")
            return None

        pixel_data = results.get("pixel_data")
        width = results.get("width")
        height = results.get("height")
        metrics = results.get("metrics")

        if not pixel_data or width == 0 or height == 0:
            print("No pixel data captured.")
            return None

        # 2. Extract Features (CNN)
        print("Extracting features with CNN...")
        # Convert to grayscale for CNN
        gray_image = to_grayscale(pixel_data, width, height)

        # Apply Edge Detection
        edge_map = convolve2d(gray_image, KERNELS["edge_detection"])

        # Pooling (reduce size)
        pooled_map = max_pooling(edge_map, pool_size=4, stride=4)
        # Note: 4x4 pooling to be aggressive and keep vectors small for this prototype

        cnn_vector = flatten(pooled_map)
        # Truncate vector if it's too huge for our simple K-Means?
        # Or maybe average it down to a few scalars (e.g., "edge density")
        edge_density = sum(cnn_vector) / len(cnn_vector)

        # 3. Scoring Metrics
        print("Calculating scoring metrics...")
        contrast_score = calculate_contrast(pixel_data, width, height)
        white_space_score = calculate_white_space(pixel_data, width, height)
        color_entropy = calculate_color_themes(pixel_data, width, height)

        # 4. Construct Feature Vector
        # [EdgeDensity, Contrast, WhiteSpace, ColorEntropy, RenderTime, MemoryUsed]
        vector = [
            edge_density,
            contrast_score,
            white_space_score,
            color_entropy,
            metrics.get("render_time", 0),
            metrics.get("memory_used", 0)
        ]

        return vector

    def train(self, urls):
        """
        Analyzes a list of URLs and trains the unsupervised model.
        """
        raw_vectors = []
        valid_urls = []

        for url in urls:
            vec = self.analyze_url(url)
            if vec:
                raw_vectors.append(vec)
                valid_urls.append(url)

        if not raw_vectors:
            print("No data to train on.")
            return

        # Normalize
        norm_vectors = normalize_vectors(raw_vectors)
        self.training_data = norm_vectors

        # Fit K-Means
        print("Training K-Means model...")
        self.model.fit(norm_vectors)

        # Report
        for i, url in enumerate(valid_urls):
            cluster = self.model.predict(norm_vectors[i])
            print(f"URL: {url} -> Cluster {cluster}")

    def predict_value(self, vector, cluster):
        """
        Heuristic to predict value based on vector and cluster.
        This would be calibrated by human feedback in a real system.
        """
        # Example logic:
        # High contrast + High white space = usually good?
        # High edge density = cluttered?

        # vector is normalized [Edge, Contrast, WhiteSpace, Color, Time, Mem]
        edge, contrast, white, color, time, mem = vector

        score = 0
        score += contrast * 10
        score += white * 5
        score -= edge * 5 # Penalize clutter

        return score

if __name__ == "__main__":
    # Example usage
    pipeline = Pipeline()
    # In a real scenario, these would be internal dev URLs or local files
    test_urls = ["https://example.com"]
    pipeline.train(test_urls)
