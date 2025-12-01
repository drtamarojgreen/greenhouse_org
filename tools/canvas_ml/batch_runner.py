
import sys
import os
import time
import threading
import http.server
import socketserver
import random
import json

# Add the parent directory to sys.path to ensure imports work if run directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from canvas_ml import pipeline, task_registry

PORT = 8002
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

def generate_configurations(count=50):
    configs = []

    env_types = ['NEUTRAL', 'POSITIVE', 'NEGATIVE']

    for i in range(count):
        # Generate random parameters
        stress = random.random() # 0.0 to 1.0
        support = random.random() # 0.0 to 1.0
        network_intensity = random.randint(0, 100)
        synaptic_intensity = random.randint(0, 100)
        env_type = random.choice(env_types)

        # We can also vary specific brain region activations if we want deeper detail
        pfc = random.random()
        amygdala = random.random()

        config = {
            "id": i,
            "stress": stress,
            "support": support,
            "network_intensity": network_intensity,
            "synaptic_intensity": synaptic_intensity,
            "env_type": env_type,
            "pfc": pfc,
            "amygdala": amygdala
        }
        configs.append(config)

    return configs

def create_setup_script(config):
    custom_logic = f"""
            if (window.GreenhouseModelsUX) {{
                // Set Environment
                window.GreenhouseModelsUX.state.environment.stress = {config['stress']};
                window.GreenhouseModelsUX.state.environment.support = {config['support']};
                window.GreenhouseModelsUX.state.environment.type = '{config['env_type']}';
                window.GreenhouseModelsUX.state.environment.isRunning = true;

                // Set Specific Regions
                window.GreenhouseModelsUX.state.environment.regions.pfc.activation = {config['pfc']};
                window.GreenhouseModelsUX.state.environment.regions.amygdala.activation = {config['amygdala']};

                // Set Network
                window.GreenhouseModelsUX.state.network.intensity = {config['network_intensity']};
                window.GreenhouseModelsUX.state.network.isRunning = true;

                // Set Synaptic
                window.GreenhouseModelsUX.state.synaptic.intensity = {config['synaptic_intensity']};
                window.GreenhouseModelsUX.state.synaptic.isRunning = true;

                // Force Redraw of all views
                window.GreenhouseModelsUI.drawEnvironmentView();
                window.GreenhouseModelsUI.drawNetworkView();
                window.GreenhouseModelsUI.drawSynapticView();

                // Simulate a step to generate activity if needed
                if ({config['network_intensity']} > 20) {{
                     window.GreenhouseModelsUX.runSimulation();
                }}
            }}
    """

    selector = "#canvas-environment"
    return task_registry._create_setup_script(selector, custom_logic)

def run_batch():
    print("Starting Batch Runner...")

    # Start server
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(2) # Wait for server

    url = f"http://localhost:{PORT}/docs/models.html"

    configs = generate_configurations(50)

    # Skip first 45 if already done (simple resume logic)
    start_index = 0

    for config in configs[start_index:]:
        desc = f"batch_{config['id']}_{config['env_type']}_str{config['stress']:.2f}_net{config['network_intensity']}"
        print(f"Running config {config['id'] + 1}/50: {desc}")

        setup_script = create_setup_script(config)

        try:
            pipeline.run_pipeline(url=url, output_path=None, setup_script=setup_script, description=desc)
        except Exception as e:
            print(f"Error running config {config['id']}: {e}")

    print("Batch Run Complete. Check vision_report.csv.")

if __name__ == "__main__":
    run_batch()
