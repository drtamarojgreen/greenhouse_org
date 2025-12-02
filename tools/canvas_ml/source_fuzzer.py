
import sys
import os
import time
import threading
import http.server
import socketserver
import re
import json

# Add the parent directory to sys.path to ensure imports work if run directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from canvas_ml import pipeline, task_registry

PORT = 8003
Handler = http.server.SimpleHTTPRequestHandler

def start_server():
    """Starts a simple HTTP server serving the repository root."""
    repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    os.chdir(repo_root)

    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            # print(f"Serving at port {PORT} from {repo_root}")
            httpd.serve_forever()
    except OSError:
        # print(f"Port {PORT} in use, assuming server is already running.")
        pass

def get_mutations():
    """Returns a list of mutations from the JSON file."""
    mutations_file = os.path.join(os.path.dirname(__file__), "mutations.json")
    if not os.path.exists(mutations_file):
        print(f"Error: Mutations file not found at {mutations_file}")
        return []

    with open(mutations_file, 'r') as f:
        return json.load(f)

def create_setup_script():
    # Setup script to ensure components are active
    return task_registry._create_setup_script("#canvas-environment", """
        if (window.GreenhouseModelsUX) {
            // Activate all components
            window.GreenhouseModelsUX.state.environment.isRunning = true;
            window.GreenhouseModelsUX.state.network.isRunning = true;
            window.GreenhouseModelsUX.state.synaptic.isRunning = true;

            // Set intensities
            window.GreenhouseModelsUX.state.network.intensity = 80;
            window.GreenhouseModelsUX.state.synaptic.intensity = 80;

            // Force Redraw
            window.GreenhouseModelsUI.drawEnvironmentView();
            window.GreenhouseModelsUI.drawNetworkView();
            window.GreenhouseModelsUI.drawSynapticView();

            // Run a simulation step
            window.GreenhouseModelsUX.runSimulation();
        }
    """)

def apply_mutation(mutation):
    with open(mutation['file'], 'r') as f:
        content = f.read()

    new_content = re.sub(mutation['search'], mutation['replace'], content)

    if new_content == content:
        print(f"WARNING: Mutation '{mutation['desc']}' had no effect (search pattern not found).")
        return False

    with open(mutation['file'], 'w') as f:
        f.write(new_content)
    return True

def run_fuzzer():
    print("Starting Source Fuzzer...")

    # Start server
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(2) # Wait for server

    url = f"http://localhost:{PORT}/docs/models.html"
    setup_script = create_setup_script()

    mutations = get_mutations()

    if not mutations:
        print("No mutations found. Exiting.")
        return

    for i, mutation in enumerate(mutations):
        desc = f"mutation_{i+1}_{mutation['desc'].replace(' ', '_').replace(':', '')}"
        print(f"Running {i+1}/{len(mutations)}: {mutation['desc']}")

        # Backup
        with open(mutation['file'], 'r') as f:
            original_content = f.read()

        try:
            success = apply_mutation(mutation)
            if success:
                pipeline.run_pipeline(url=url, output_path=None, setup_script=setup_script, description=desc)
            else:
                print(f"Skipping pipeline for {i+1} due to apply failure.")
        except Exception as e:
            print(f"Error running mutation {i+1}: {e}")
        finally:
            # Revert
            with open(mutation['file'], 'w') as f:
                f.write(original_content)

    print("Fuzzer Run Complete. Check vision_report.csv.")

if __name__ == "__main__":
    run_fuzzer()
