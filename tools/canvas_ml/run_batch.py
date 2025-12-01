
import json
import os
import sys

# Add the parent directory to sys.path to ensure imports work if run directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from canvas_ml import pipeline

def run_batch(changes_file):
    if not os.path.exists(changes_file):
        print(f"Error: {changes_file} not found.")
        return

    with open(changes_file, 'r') as f:
        changes = json.load(f)

    # Use a dummy URL for local testing, or the real file path
    base_url = None # First run triggers server start
    fixed_url = f"http://localhost:{pipeline.PORT}/docs/models.html"

    for i, change in enumerate(changes):
        print(f"\n--- Running Change {i+1}/{len(changes)}: {change['description']} ---")

        patch_json = json.dumps(change['patch'])
        setup_script = f"""
        (function() {{
            console.log("Applying patch: {change['description']}");

            // 1. Patch Config
            window.GreenhouseEnvironmentConfig = window.GreenhouseEnvironmentConfig || {{}};
            const patch = {patch_json};
            Object.assign(window.GreenhouseEnvironmentConfig, patch);

            // 2. Bypass Consent and Start Simulation
            // We need to wait for the DOM to be ready, but this script runs after page load (networkidle).
            const chk = document.getElementById('consent-checkbox');
            const btn = document.getElementById('start-simulation-btn');

            if (chk && btn) {{
                if (!chk.checked) {{
                    chk.click();
                }}
                if (!btn.disabled) {{
                    btn.click();
                }} else {{
                    // Force enable if click didn't work (though it should)
                    btn.disabled = false;
                    btn.click();
                }}
            }} else {{
                console.warn("Start button or checkbox not found. Simulation might not start.");
            }}
        }})();
        """

        try:
            # First run will start server
            pipeline.run_pipeline(url=base_url if i == 0 else fixed_url, setup_script=setup_script, description=change['description'])
        except Exception as e:
            print(f"Failed to run pipeline for change {i}: {e}")

if __name__ == "__main__":
    changes_file = os.path.join(os.path.dirname(__file__), "render_changes.json")
    if len(sys.argv) > 1:
        changes_file = sys.argv[1]

    run_batch(changes_file)
