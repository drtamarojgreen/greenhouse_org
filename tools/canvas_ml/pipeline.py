
import sys
import os
import time
import threading
import http.server
import socketserver
import csv
import json

# Add the parent directory to sys.path to ensure imports work if run directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from canvas_ml import renderer, cnn_layer, scorers, model

PORT = 8000
Handler = http.server.SimpleHTTPRequestHandler

def categorize_improvement(render_change, score_change):
    """
    Categorizes the visual/performance change based on deltas.
    render_change: (Current Duration - Last Duration). Negative is faster (Good).
    score_change: (Current Score - Last Score). Positive is better (Good).
    """
    is_faster = render_change < -0.1
    is_slower = render_change > 0.1
    is_better_score = score_change > 5
    is_worse_score = score_change < -5

    if is_faster and is_better_score:
        return "Comprehensive Upgrade"
    elif is_faster and not is_worse_score:
        return "Performance Win"
    elif is_better_score and not is_slower:
        return "Visual Polish"
    elif is_slower and is_worse_score:
        return "Critical Regression"
    elif is_slower:
        return "Performance Regression"
    elif is_worse_score:
        return "Visual Regression"
    else:
        return "Neutral / Minor Change"

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

def run_pipeline(url=None, output_path=None):
    server_thread = None

    if url is None:
        # Start local server
        print("No URL provided. Starting local server for docs/models.html...")
        server_thread = threading.Thread(target=start_server, daemon=True)
        server_thread.start()
        # Give it a moment to start
        time.sleep(1)
        url = f"http://localhost:{PORT}/docs/models.html"
        render_description = "local_docs_model"
    else:
        # Create a simple description from the URL (e.g. filename or domain)
        render_description = url.split('/')[-1]
        if not render_description:
            render_description = "custom_url"

    print(f"Starting pipeline for {url} ({render_description})...")

    # Stage 1: Rendering & Benchmarking
    print("Stage 1: Rendering & Benchmarking...")
    # output_path is intentionally ignored to prevent artifact storage as per protocol
    render_result = renderer.render_and_capture(url, output_path=None)

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

    # Use the new helper in scorers to get grayscale grid
    grayscale_grid = scorers.to_grayscale_grid(pixels, width, height)

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
    edge_density_score = scorers.calculate_edge_density(grayscale_grid)
    color_entropy_score = scorers.calculate_color_entropy(pixels)
    feature_density_score = scorers.calculate_feature_density(grayscale_grid)

    print(f"Contrast: {contrast_score:.2f}, Whitespace: {whitespace_score:.2f}")
    print(f"Edge Density: {edge_density_score:.2f}, Color Entropy: {color_entropy_score:.2f}, Feature Density: {feature_density_score:.2f}")

    # Stage 4: Unsupervised Machine Learning
    print("Stage 4: Clustering...")

    # Expanded input vector
    input_vector = [
        contrast_score,
        whitespace_score,
        edge_density_score,
        color_entropy_score,
        feature_density_score,
        metrics.get('duration', 0)
    ] + flat_features[:10]

    kmeans = model.KMeans(k=3)
    # Mock training data
    dummy_data = [[x * 0.9 for x in input_vector], [x * 1.1 for x in input_vector], input_vector]
    kmeans.fit(dummy_data)

    cluster_id = kmeans.predict(input_vector)
    print(f"Assigned to Cluster: {cluster_id}")

    # Stage 5: Value Prediction
    print("Stage 5: Value Prediction...")
    # Updated heuristic formula to include new scores
    # Higher entropy/edge density usually means more info, but too much is clutter.
    # We penalize extremely high edge density if whitespace is low (clutter).
    value_score = (contrast_score * 0.5) + (whitespace_score * 50) + (color_entropy_score * 5) - (metrics.get('duration', 0) * 10)

    # Bonus for balanced edge density (0.1 - 0.5 range)
    if 0.1 <= edge_density_score <= 0.5:
        value_score += 20

    prediction = "High Value" if value_score > 50 else "Low Value"

    print(f"Predicted Implementation Value: {prediction} (Score: {value_score:.2f})")

    # Artifact Management
    baseline_file = "baseline_metrics.json"
    render_change = 0.0
    score_change = 0.0
    current_duration = metrics.get('duration', 0)

    if os.path.exists(baseline_file):
        try:
            with open(baseline_file, 'r') as f:
                baseline = json.load(f)
                last_duration = baseline.get('duration', 0)
                last_score = baseline.get('score', 0)
                # render_change is difference in duration.
                # Positive means slower (regression), negative means faster (improvement).
                render_change = current_duration - last_duration
                score_change = value_score - last_score
        except Exception as e:
            print(f"Error reading baseline: {e}")

    improvement_category = categorize_improvement(render_change, score_change)
    print(f"Change Category: {improvement_category}")

    # Export CSV
    csv_file = "vision_report.csv"
    try:
        # Check if file exists to determine if we need to write header
        file_exists = os.path.isfile(csv_file)

        with open(csv_file, 'a', newline='') as f: # Append mode
            writer = csv.writer(f)
            if not file_exists:
                writer.writerow([
                    "render_description",
                    "render_change",
                    "total_score",
                    "contrast",
                    "whitespace",
                    "edge_density",
                    "color_entropy",
                    "feature_density",
                    "duration"
                ])

            writer.writerow([
                render_description,
                render_change,
                value_score,
                contrast_score,
                whitespace_score,
                edge_density_score,
                color_entropy_score,
                feature_density_score,
                current_duration
            ])
        print(f"Exported report to {csv_file}")
    except Exception as e:
        print(f"Error writing CSV report: {e}")

    # Save new baseline for future runs
    try:
        with open(baseline_file, 'w') as f:
            json.dump({"duration": current_duration, "score": value_score}, f)
    except Exception as e:
        print(f"Error saving baseline: {e}")

    return {
        "cluster": cluster_id,
        "prediction": prediction,
        "score": value_score,
        "metrics": metrics,
        "improvement_category": improvement_category
    }

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else None
    run_pipeline(target)
