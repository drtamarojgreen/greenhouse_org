
import sys
import os
import time
import threading
import http.server
import socketserver
import csv

# Add the parent directory to sys.path to ensure imports work if run directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from canvas_ml import renderer, cnn_layer, scorers, model

PORT = 8000
Handler = http.server.SimpleHTTPRequestHandler

def start_server():
    """Starts a simple HTTP server serving the repository root."""
    # We want to serve from the root of the repo so /docs/models.html is accessible
    repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    os.chdir(repo_root)

    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"Serving at port {PORT} from {repo_root}")
            httpd.serve_forever()
    except OSError:
        print(f"Port {PORT} in use, assuming server is already running.")

def run_pipeline(url=None, save_artifacts=False, csv_output="vision_metrics.csv"):
    server_thread = None

    if url is None:
        # Start local server
        print("No URL provided. Starting local server for docs/models.html...")
        server_thread = threading.Thread(target=start_server, daemon=True)
        server_thread.start()
        # Give it a moment to start
        time.sleep(1)
        url = f"http://localhost:{PORT}/docs/models.html"

    print(f"Starting pipeline for {url}...")

    # Determine output path for screenshot
    output_path = "capture.png" if save_artifacts else None

    # Stage 1: Rendering & Benchmarking
    print("Stage 1: Rendering & Benchmarking...")
    render_result = renderer.render_and_capture(url, output_path)

    pixels = render_result.get("pixel_data", [])
    width = render_result.get("width", 0)
    height = render_result.get("height", 0)
    metrics = render_result.get("metrics", {})

    if not pixels:
        print("Warning: No pixel data captured (no <canvas> found?). Pipeline will proceed with zeroed data.")
        # Create dummy data 100x100
        width = 100
        height = 100
        pixels = [0] * (width * height * 4)

    print(f"Captured {width}x{height} image. Duration: {metrics.get('duration', 0):.2f}s")

    # Stage 2: Advanced Feature Extraction (CNN Layer)
    print("Stage 2: Advanced Feature Extraction (CNN)...")

    # Convert flat pixels to 2D grid (using only R channel for grayscale features)
    grayscale_grid = []
    for y in range(height):
        row = []
        for x in range(width):
            idx = (y * width + x) * 4
            if idx + 2 < len(pixels):
                r = pixels[idx]
                g = pixels[idx+1]
                b = pixels[idx+2]
                lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
                row.append(lum)
            else:
                row.append(0)
        grayscale_grid.append(row)

    # Apply Edge Detection Kernel
    kernel = [
        [-1, -1, -1],
        [-1,  8, -1],
        [-1, -1, -1]
    ]

    feature_map = cnn_layer.convolve_2d(grayscale_grid, kernel)
    feature_map = cnn_layer.relu(feature_map)
    pooled_map = cnn_layer.max_pool(feature_map, pool_size=2, stride=2)
    flat_features = cnn_layer.flatten(pooled_map)

    print(f"Extracted feature vector of size: {len(flat_features)}")

    # Stage 3: Comprehensive Scoring Metrics
    print("Stage 3: Scoring Metrics...")
    contrast_score = scorers.calculate_contrast(pixels)
    whitespace_score = scorers.calculate_whitespace_ratio(pixels)

    print(f"Contrast: {contrast_score:.2f}, Whitespace: {whitespace_score:.2f}")

    # Stage 4: Unsupervised Machine Learning
    print("Stage 4: Clustering...")

    input_vector = [contrast_score, whitespace_score, metrics.get('duration', 0)] + flat_features[:10]

    kmeans = model.KMeans(k=3)
    # Mock training data
    dummy_data = [[x * 0.9 for x in input_vector], [x * 1.1 for x in input_vector], input_vector]
    kmeans.fit(dummy_data)

    cluster_id = kmeans.predict(input_vector)
    print(f"Assigned to Cluster: {cluster_id}")

    # Stage 5: Value Prediction
    print("Stage 5: Value Prediction...")
    value_score = (contrast_score * 0.5) + (whitespace_score * 100) - (metrics.get('duration', 0) * 10)
    prediction = "High Value" if value_score > 50 else "Low Value"

    print(f"Predicted Implementation Value: {prediction} (Score: {value_score:.2f})")

    # Artifact Management: Export CSV
    # Columns: render_change, total_score
    # render_change: Placeholder 0.0 for now as we don't have baseline comparison
    render_change = 0.0
    total_score = value_score

    print(f"Exporting metrics to {csv_output}...")
    with open(csv_output, mode='w', newline='') as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(["render_change", "total_score"])
        writer.writerow([render_change, total_score])

    return {
        "cluster": cluster_id,
        "prediction": prediction,
        "score": value_score,
        "metrics": metrics
    }

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else None
    # Defaults to no artifacts (save_artifacts=False)
    run_pipeline(target)
