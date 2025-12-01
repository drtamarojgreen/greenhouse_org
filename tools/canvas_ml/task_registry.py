
"""
Registry of Render Tasks for the Greenhouse CanvasML Challenge.
Each task defines the target canvas, the desired state (simulated user input),
and the success criteria (expected visual metrics).
"""

def _create_setup_script(target_canvas_selector, custom_logic):
    """
    Helper to create a robust setup script that handles the consent screen
    and waits for the application to be ready before applying custom logic.
    """
    # Note: The script is returned as a string that evaluates to an async function.
    # Playwright's page.evaluate() handles async functions gracefully.
    return f"""
    async () => {{
        const waitFor = (condition, timeout=30000, desc="condition") => new Promise((resolve, reject) => {{
            const start = Date.now();
            const check = () => {{
                if (condition()) resolve();
                else if (Date.now() - start > timeout) reject(new Error("Timeout waiting for " + desc));
                else setTimeout(check, 100);
            }};
            check();
        }});

        try {{
            console.log("Setup script started...");

            // Wait for body to be populated
            await waitFor(() => document.body.innerText.length > 0, 10000, "body content");
            console.log("Body has content.");

            // 1. Handle Consent Screen if present
            const startBtn = document.getElementById('start-simulation-btn');
            if (startBtn) {{
                console.log("Found start button.");

                const consent = document.getElementById('consent-checkbox');
                if (consent) {{
                    console.log("Checking consent...");
                    consent.checked = true;
                    // Trigger change event to ensure listeners update state
                    consent.dispatchEvent(new Event('change'));
                }} else {{
                    console.log("No consent checkbox found!");
                }}

                // Wait for button to be enabled
                await waitFor(() => !startBtn.disabled, 5000, "start button enabled");
                console.log("Clicking start button...");
                startBtn.click();

                // Wait a moment for transition
                await new Promise(r => setTimeout(r, 2000));
            }} else {{
                console.log("No start button found. Assuming already started or different page.");
            }}

            // 2. Wait for target canvas to exist in DOM
            console.log("Waiting for canvas {target_canvas_selector}...");
            await waitFor(() => document.querySelector('{target_canvas_selector}'), 30000, "canvas element");
            console.log("Canvas found.");

            // 3. Wait for global UX object and initialization
            console.log("Waiting for GreenhouseModelsUX...");
            await waitFor(() => window.GreenhouseModelsUX && window.GreenhouseModelsUX.state && window.GreenhouseModelsUX.state.isInitialized, 30000, "UX initialization");
            console.log("UX Initialized.");

            // 4. Apply Custom Task Logic
            console.log("Applying custom task logic...");
            {custom_logic}

            // 5. Force a final wait to ensure rendering is caught
            await new Promise(r => setTimeout(r, 1000));
            console.log("Setup script completed.");

        }} catch (e) {{
            console.error("Setup script error:", e);
            throw e;
        }}
    }}
    """

TASK_REGISTRY = {
    "environment_stress": {
        "description": "High Stress Environment",
        "canvas_selector": "#canvas-environment",
        "setup_script": _create_setup_script("#canvas-environment", """
            if (window.GreenhouseModelsUX) {
                // Set High Stress
                window.GreenhouseModelsUX.state.environment.stress = 1.0;
                window.GreenhouseModelsUX.state.environment.support = 0.0;
                window.GreenhouseModelsUX.state.environment.type = 'NEGATIVE';
                window.GreenhouseModelsUX.state.environment.isRunning = true;

                // Force Redraw
                window.GreenhouseModelsUI.drawEnvironmentView();
            }
        """),
        "criteria": {
            # Stress usually implies darker or more chaotic visuals.
            "min_contrast": 20.0,
            "min_edge_density": 0.001
        }
    },
    "brain_storm": {
        "description": "High Intensity Network Activity",
        "canvas_selector": "#canvas-network",
        "setup_script": _create_setup_script("#canvas-network", """
            if (window.GreenhouseModelsUX) {
                // Max Intensity
                window.GreenhouseModelsUX.state.network.intensity = 100;
                window.GreenhouseModelsUX.state.network.isRunning = true;

                // Trigger a run simulation step manually to generate activity
                window.GreenhouseModelsUX.runSimulation();

                // Force Redraw
                window.GreenhouseModelsUI.drawNetworkView();
            }
        """),
        "criteria": {
            # High activity = lots of bright spots (action potentials) + edges
            "min_contrast": 30.0,
            # "min_whitespace": 0.01, # Removed as background is dark and colors are not pure white
            "min_feature_density": 0.05
        }
    },
    "synapse_learning": {
        "description": "High Synaptic Plasticity",
        "canvas_selector": "#canvas-synaptic",
        "setup_script": _create_setup_script("#canvas-synaptic", """
            if (window.GreenhouseModelsUX) {
                // High Intensity
                window.GreenhouseModelsUX.state.synaptic.intensity = 100;
                window.GreenhouseModelsUX.state.synaptic.synapticWeight = 1.0;
                window.GreenhouseModelsUX.state.synaptic.neurotransmitters = 100;
                window.GreenhouseModelsUX.state.synaptic.isRunning = true;

                window.GreenhouseModelsUI.drawSynapticView();
            }
        """),
        "criteria": {
            "min_contrast": 10.0,
            "min_edge_density": 0.01
        }
    }
}
