import os
import json
import time
import re
from playwright.sync_api import sync_playwright

DATA_DIR = "tools/canvasml/data"
DOCS_URL = "http://localhost:8000/docs/models.html"

def harvest():
    with sync_playwright() as p:
        # Launch options
        browser = p.chromium.launch(headless=True, args=['--use-gl=egl'])
        context = browser.new_context()

        # Define route handler factory
        current_config = {}

        def handle_route(route):
            # print("Intercepting config request...")
            js_payload = f"window.GreenhouseEnvironmentConfig = {json.dumps(current_config)};"
            route.fulfill(
                status=200,
                content_type="application/javascript",
                body=js_payload
            )

        # Ensure output dir exists
        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR)

        # Iterate
        for i in range(50):
            var_path = os.path.join(DATA_DIR, f"variation_{i}.json")
            if not os.path.exists(var_path):
                continue

            with open(var_path, 'r') as f:
                current_config = json.load(f)

            page = context.new_page()

            # Route interception
            page.route(re.compile(r".*/js/environment_config\.js.*"), handle_route)

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

                # Wait for app initialization
                try:
                    page.wait_for_function("() => window.GreenhouseModelsUX && window.GreenhouseModelsUX.state && window.GreenhouseModelsUX.state.isInitialized", timeout=10000)
                except Exception as e:
                    print(f"Error waiting for initialization: {e}")

                target_selector = '#canvas-environment'
                # Check if canvas exists, if not try to force init
                if not page.query_selector(target_selector):
                    print(f"Canvas {target_selector} missing for {i}. Force-starting...")
                    page.evaluate("""() => {
                         if (window.GreenhouseModelsUX && !window.GreenhouseModelsUX.state.isInitialized) {
                             console.log("Force initializing...");
                             window.GreenhouseModelsUX.initialize();
                         }
                    }""")

                try:
                    page.wait_for_selector(target_selector, timeout=5000)
                except:
                    print(f"Still no canvas for {i}. Skipping.")
                    page.close()
                    continue

                # Wait for render to settle
                page.wait_for_timeout(2000)

                # Capture with retry
                pixel_data = None
                for attempt in range(3):
                    pixel_data = page.evaluate(f"""() => {{
                        const target = document.querySelector('{target_selector}');
                        if (!target) return null;

                        const temp = document.createElement('canvas');
                        temp.width = 64;
                        temp.height = 64;
                        const ctx = temp.getContext('2d');

                        // Fill white background first to avoid transparent zeros
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, 64, 64);

                        ctx.drawImage(target, 0, 0, 64, 64);
                        const data = Array.from(ctx.getImageData(0,0,64,64).data);

                        // Check if empty (sum of all bytes)
                        const sum = data.reduce((a, b) => a + b, 0);
                        if (sum === 0) return null;

                        return data;
                    }}""")

                    if pixel_data:
                        break

                    print(f"Attempt {attempt+1}: Empty capture for {i}. Waiting...")
                    page.wait_for_timeout(1000)

                if pixel_data:
                    out_path = os.path.join(DATA_DIR, f"capture_{i}.json")
                    with open(out_path, 'w') as f:
                        json.dump(pixel_data, f)

                    if i < 5:
                        page.screenshot(path=os.path.join(DATA_DIR, f"screenshot_{i}.png"))

                    if i % 10 == 0:
                        print(f"Harvested {i}")
                else:
                    print(f"Failed to capture data for {i} (all zeros or null)")

            except Exception as e:
                print(f"Error {i}: {e}")

            page.close()

        browser.close()

if __name__ == "__main__":
    harvest()
