
import sys
import os
import argparse
import json
import threading
import time
import http.server
import socketserver

# Add the parent directory to sys.path to ensure imports work if run directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from canvas_ml import renderer, scorers, task_registry

PORT = 8001
Handler = http.server.SimpleHTTPRequestHandler

def start_server():
    """Starts a simple HTTP server serving the repository root."""
    repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    os.chdir(repo_root)

    class ReusableTCPServer(socketserver.TCPServer):
        allow_reuse_address = True

    try:
        with ReusableTCPServer(("", PORT), Handler) as httpd:
            # print(f"Serving at port {PORT} from {repo_root}")
            httpd.serve_forever()
    except OSError:
        # print(f"Port {PORT} in use, assuming server is already running.")
        pass

def run_challenge(task_name, solution_file=None):
    task = task_registry.TASK_REGISTRY.get(task_name)
    if not task:
        print(f"Error: Task '{task_name}' not found.")
        return False

    print(f"Running Challenge: {task['description']} ({task_name})")

    # Start local server
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(1) # Wait for server

    url = f"http://localhost:{PORT}/docs/models.html"

    # Determine logic to apply
    logic_to_run = task.get("default_logic", "")
    if solution_file:
        if os.path.exists(solution_file):
            with open(solution_file, 'r') as f:
                print(f"Applying custom solution from {solution_file}...")
                logic_to_run = f.read()
        else:
            print(f"Warning: Solution file {solution_file} not found. Using default logic.")

    # Wrap the logic in the setup harness
    setup_script = task_registry.generate_setup_script(
        task["canvas_selector"],
        logic_to_run
    )

    # Render
    print("Capturing state...")
    result = renderer.render_and_capture(
        url,
        output_path=f"challenge_{task_name}.png",
        canvas_selector=task["canvas_selector"],
        setup_script=setup_script
    )

    pixels = result.get("pixel_data", [])
    width = result.get("width", 0)
    height = result.get("height", 0)

    if not pixels:
        print("Failure: No pixel data captured.")
        return False

    # Analyze
    print("Analyzing...")
    grayscale = scorers.to_grayscale_grid(pixels, width, height)

    metrics = {
        "contrast": scorers.calculate_contrast(pixels),
        "whitespace": scorers.calculate_whitespace_ratio(pixels),
        "edge_density": scorers.calculate_edge_density(grayscale),
        "feature_density": scorers.calculate_feature_density(grayscale),
        "color_entropy": scorers.calculate_color_entropy(pixels)
    }

    print("Measured Metrics:")
    for k, v in metrics.items():
        print(f"  {k}: {v:.4f}")

    # Grade
    criteria = task.get("criteria", {})
    passed = True
    print("\nGrading:")
    for key, min_val in criteria.items():
        # Map criteria keys to metric keys (e.g. min_contrast -> contrast)
        metric_key = key.replace("min_", "").replace("max_", "")
        actual_val = metrics.get(metric_key, 0)

        if key.startswith("min_"):
            if actual_val >= min_val:
                print(f"  [PASS] {metric_key}: {actual_val:.4f} >= {min_val}")
            else:
                print(f"  [FAIL] {metric_key}: {actual_val:.4f} < {min_val}")
                passed = False
        elif key.startswith("max_"):
            if actual_val <= min_val:
                print(f"  [PASS] {metric_key}: {actual_val:.4f} <= {min_val}")
            else:
                print(f"  [FAIL] {metric_key}: {actual_val:.4f} > {min_val}")
                passed = False

    if passed:
        print(f"\nSUCCESS: Challenge '{task_name}' Passed!")
        return True
    else:
        print(f"\nFAILURE: Challenge '{task_name}' Failed.")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run a CanvasML Render Challenge")
    parser.add_argument("task", help="Name of the task to run")
    parser.add_argument("--solution", help="Path to a JS file containing the solution code", default=None)

    args = parser.parse_args()

    success = run_challenge(args.task, args.solution)
    sys.exit(0 if success else 1)
