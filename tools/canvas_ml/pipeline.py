
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

def categorize_change(render_change, score_change):
    """
    Categorizes the improvement based on changes in rendering duration and score.

    Thresholds:
    - Regression: Score decreased by > 2.0 OR Render time increased by > 0.05s
    - Performance Win: Render time decreased by > 0.05s (and no regression)
    - Visual Polish: Score increased by > 2.0
    - Neutral: Minor fluctuations
    """
    if score_change < -2.0 or render_change > 0.05:
        return "Regression"
    elif render_change < -0.05:
        return "Performance Win"
    elif score_change > 2.0:
        return "Visual Polish"
    else:
        return "Neutral"

def run_pipeline(url=None, output_path=None, setup_script=None, description=None, patch_file=None, agent_id="10-999"):
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

    if description:
        render_description = description

    # Handle Patch Injection
    if patch_file:
        try:
            with open(patch_file, 'r') as f:
                patch_data = json.load(f)
                # Construct a setup script that merges this patch into the config
                # Assuming window.GreenhouseEnvironmentConfig is the target
                json_str = json.dumps(patch_data)
                patch_script = f"""
                console.log("Applying Runtime JSON Patch...");
                if (!window.GreenhouseEnvironmentConfig) window.GreenhouseEnvironmentConfig = {{}};
                const patch = {json_str};
                Object.assign(window.GreenhouseEnvironmentConfig, patch);
                console.log("Patch applied:", window.GreenhouseEnvironmentConfig);
                """
                if setup_script:
                    setup_script += "\n" + patch_script
                else:
                    setup_script = patch_script
                print(f"Loaded patch from {patch_file}")
        except Exception as e:
            print(f"Error loading patch file: {e}")

    print(f"Starting pipeline for {url} ({render_description})...")

    # Stage 1: Rendering & Benchmarking
    print("Stage 1: Rendering & Benchmarking...")
    render_result = renderer.render_and_capture(url, output_path, setup_script=setup_script)

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
    symmetry_score = scorers.calculate_symmetry(grayscale_grid)

    print(f"Contrast: {contrast_score:.2f}, Whitespace: {whitespace_score:.2f}")
    print(f"Edge Density: {edge_density_score:.2f}, Color Entropy: {color_entropy_score:.2f}, Feature Density: {feature_density_score:.2f}")
    print(f"Symmetry: {symmetry_score:.2f}")

    # Stage 4: Unsupervised Machine Learning
    print("Stage 4: Clustering...")

    # Expanded input vector
    input_vector = [
        contrast_score,
        whitespace_score,
        edge_density_score,
        color_entropy_score,
        feature_density_score,
        symmetry_score,
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

    # Bonus for symmetry (Golden Ratio / Harmony check)
    if symmetry_score > 0.8:
        value_score += 10

    prediction = "High Value" if value_score > 50 else "Low Value"

    print(f"Predicted Implementation Value: {prediction} (Score: {value_score:.2f})")

    # Artifact Management
    baseline_file = "baseline_metrics.json"
    render_change = 0.0
    score_change = 0.0
    improvement_category = "Neutral"
    current_duration = metrics.get('duration', 0)

    if os.path.exists(baseline_file):
        try:
            with open(baseline_file, 'r') as f:
                baseline = json.load(f)
                last_duration = baseline.get('duration', 0)
                last_score = baseline.get('score', 0)
                render_change = current_duration - last_duration
                score_change = value_score - last_score
        except Exception as e:
            print(f"Error reading baseline: {e}")

    # Benchmarking & Categorization
    improvement_category = categorize_change(render_change, score_change)

    print(f"Change Analysis: Duration Delta: {render_change:.4f}s, Score Delta: {score_change:.2f}")
    print(f"Improvement Category: {improvement_category}")
    # Categorization
    RENDER_CHANGE_THRESHOLD = 0.05
    SCORE_CHANGE_THRESHOLD = 5.0

    category = "Neutral"
    # Check for combined improvement first (Optimization)
    if render_change < -RENDER_CHANGE_THRESHOLD and score_change > SCORE_CHANGE_THRESHOLD:
        category = "Optimization"
    elif render_change < -RENDER_CHANGE_THRESHOLD and score_change > -SCORE_CHANGE_THRESHOLD:
        category = "Performance Win"
    elif score_change > SCORE_CHANGE_THRESHOLD and render_change < RENDER_CHANGE_THRESHOLD:
        category = "Visual Polish"
    elif render_change > RENDER_CHANGE_THRESHOLD or score_change < -SCORE_CHANGE_THRESHOLD:
        category = "Regression"

    print(f"Improvement Category: {category} (Render Change: {render_change:.4f}s, Score Change: {score_change:.2f})")

    # Export CSV
    # Sanitize agent_id for filename
    safe_agent_id = agent_id.replace("-", "") if agent_id else "unknown"
    csv_file = f"vision_report{safe_agent_id}.csv"

    try:
        # Check if file exists to determine if we need to write header
        file_exists = os.path.isfile(csv_file)

        with open(csv_file, 'a', newline='') as f: # Append mode
            writer = csv.writer(f)
            if not file_exists:
                writer.writerow([
                    "render_description",
                    "render_change",
                    "score_change",
                    "improvement_category",
                    "total_score",
                    "contrast",
                    "whitespace",
                    "edge_density",
                    "color_entropy",
                    "feature_density",
                    "symmetry",
                    "duration",
                    "agent_id"
                ])

            writer.writerow([
                render_description,
                render_change,
                score_change,
                improvement_category,
                value_score,
                contrast_score,
                whitespace_score,
                edge_density_score,
                color_entropy_score,
                feature_density_score,
                symmetry_score,
                current_duration,
                agent_id
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
        "category": category
    }

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='CanvasML Pipeline')
    parser.add_argument('url', nargs='?', help='Target URL or file path')
    parser.add_argument('--patch', help='Path to JSON patch file for config injection')
    parser.add_argument('--output', help='Path to save screenshot')
    parser.add_argument('--agent-id', default="10-999", help='Agent ID for reporting')

    args = parser.parse_args()

    run_pipeline(args.url, output_path=args.output, patch_file=args.patch, agent_id=args.agent_id)
