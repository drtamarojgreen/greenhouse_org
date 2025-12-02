import os
import json
import time
import re
from playwright.sync_api import sync_playwright

DATA_DIR = "tools/canvasml/data"
DOCS_URL = "http://localhost:8000/docs/models.html"

def harvest():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        # Define route handler factory (keeping it for robustness, though add_init_script is main)
        current_config = {}

        def handle_route(route):
            # print("Intercepting config...")
            js_payload = f"window.GreenhouseEnvironmentConfig = {json.dumps(current_config)};"
            route.fulfill(
                status=200,
                content_type="application/javascript",
                body=js_payload
            )

        # Iterate
        for i in range(50):
            var_path = os.path.join(DATA_DIR, f"variation_{i}.json")
            if not os.path.exists(var_path):
                continue

            with open(var_path, 'r') as f:
                current_config = json.load(f)

            page = context.new_page()

            # Subscribe to console events to debug JS errors
            page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}") if msg.type == "error" else None)
            page.on("pageerror", lambda exc: print(f"BROWSER ERROR: {exc}"))

            # Route interception (Backup)
            page.route(re.compile(r".*/js/environment_config\.js.*"), handle_route)

            # Init script injection (Primary) - Ensures config is set before any script runs
            # We use a checking mechanism to ensure we don't get overwritten if possible,
            # but since the app loads a file that sets this, the file interception is also crucial.
            # However, initializing it here ensures it exists if the file fails or is slow.
            page.add_init_script(f"window.GreenhouseEnvironmentConfig = {json.dumps(current_config)};")

            try:
                # print(f"Processing {i}...")
                page.goto(DOCS_URL)

                # Wait for potential consent screen
                try:
                    consent_checkbox = page.wait_for_selector('#consent-checkbox', state='visible', timeout=5000)
                    if consent_checkbox:
                        page.check('#consent-checkbox')
                        page.click('#start-simulation-btn')
                except:
                    # print("No consent screen found or failed to click.")
                    pass

                # Wait for canvas - Prioritize #canvas-environment
                try:
                    # Wait for either specific ID or generic canvas
                    page.wait_for_selector('#canvas-environment, canvas', state='visible', timeout=10000)
                except:
                    # print(f"Canvas missing for {i}. Force-starting...")
                    # Try to force start via console
                    page.evaluate("""() => {
                         if (window.GreenhouseModelsUX && !window.GreenhouseModelsUX.state.isInitialized) {
                             console.log("Force initializing...");
                             window.GreenhouseModelsUX.initialize();
                         }
                    }""")
                    # Wait again
                    try:
                        page.wait_for_selector('#canvas-environment, canvas', state='visible', timeout=5000)
                    except:
                        print(f"Still no canvas for {i}. Skipping.")
                        page.close()
                        continue

                # Wait for render (stabilization)
                page.wait_for_timeout(2000)

                # Capture
                pixel_data = page.evaluate("""() => {
                    // Try to find the specific environment canvas first
                    let target = document.getElementById('canvas-environment');

                    if (!target) {
                        const canvases = document.querySelectorAll('canvas');
                        if (canvases.length === 0) return null;
                        // Grab the last one as fallback
                        target = canvases[canvases.length - 1];
                    }

                    if (!target) return null;

                    const temp = document.createElement('canvas');
                    temp.width = 64;
                    temp.height = 64;
                    const ctx = temp.getContext('2d');
                    ctx.drawImage(target, 0, 0, 64, 64);
                    return Array.from(ctx.getImageData(0,0,64,64).data);
                }""")

                if pixel_data:
                    # Check if pixel data is all zeros (transparent/black)
                    non_zero = any(x != 0 for x in pixel_data)
                    if not non_zero:
                        print(f"Warning: Captured all-zero data for {i}")

                    out_path = os.path.join(DATA_DIR, f"capture_{i}.json")
                    with open(out_path, 'w') as f:
                        json.dump(pixel_data, f)

                    if i < 5:
                        page.screenshot(path=os.path.join(DATA_DIR, f"screenshot_{i}.png"))

                    if i % 10 == 0:
                        print(f"Harvested {i}")
                else:
                    print(f"No pixel data returned for {i}")

            except Exception as e:
                print(f"Error {i}: {e}")

            page.close()

        browser.close()

if __name__ == "__main__":
    harvest()
