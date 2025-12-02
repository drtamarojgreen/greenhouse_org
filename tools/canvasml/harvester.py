import os
import json
import time
import re
from playwright.sync_api import sync_playwright

DATA_DIR = "tools/canvasml/data"
DOCS_URL = "http://localhost:8000/docs/models.html"

def harvest():
    print("Starting harvest...")
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True, args=['--use-gl=egl'])
        context = browser.new_context()

        # Define route handler factory
        current_config = {}

        def handle_route(route):
            # print(f"Intercepting config request: {route.request.url}")
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
                print(f"Variation {i} not found.")
                continue

            with open(var_path, 'r') as f:
                current_config = json.load(f)

            page = context.new_page()

            # Console logging
            # page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
            page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

            # Route interception
            page.route(re.compile(r".*/js/environment_config\.js.*"), handle_route)

            try:
                # print(f"Processing {i}...")
                page.goto(DOCS_URL)

                # Wait for app initialization
                try:
                    page.wait_for_function("() => window.GreenhouseModelsUX && window.GreenhouseModelsUX.state && window.GreenhouseModelsUX.state.isInitialized", timeout=10000)
                except Exception as e:
                    print(f"Error waiting for initialization: {e}")
                    page.close()
                    continue

                # Check if consent is needed
                consent_given = page.evaluate("() => window.GreenhouseModelsUX.state.consentGiven")
                if not consent_given:
                     # Wait for consent screen
                    try:
                        page.wait_for_selector('#consent-checkbox', state='visible', timeout=5000)
                        page.check('#consent-checkbox')
                        page.click('#start-simulation-btn')
                        # Wait for consent to be registered in state or UI update
                        page.wait_for_function("() => !document.querySelector('#consent-checkbox')")
                    except Exception as e:
                        print(f"Error handling consent: {e}")
                        page.close()
                        continue

                # Wait for canvas
                target_selector = '#canvas-environment'
                try:
                    page.wait_for_selector(target_selector, timeout=5000)
                except:
                    print(f"Canvas {target_selector} missing for {i}. Force-starting...")
                    # Try to force start via console
                    page.evaluate("""() => {
                         if (window.GreenhouseModelsUX && !window.GreenhouseModelsUX.state.isInitialized) {
                             window.GreenhouseModelsUX.initialize();
                         }
                    }""")
                    # Wait again
                    try:
                        page.wait_for_selector(target_selector, timeout=3000)
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
                        ctx.drawImage(target, 0, 0, 64, 64);
                        const data = Array.from(ctx.getImageData(0,0,64,64).data);

                        // Check if empty (all zeros)
                        const sum = data.reduce((a, b) => a + b, 0);
                        if (sum === 0) return null;

                        return data;
                    }}""")

                    if pixel_data:
                        break

                    # print(f"Attempt {attempt+1}: Empty capture for {i}. Waiting...")
                    page.wait_for_timeout(1000)

                if pixel_data:
                    out_path = os.path.join(DATA_DIR, f"capture_{i}.json")
                    with open(out_path, 'w') as f:
                        json.dump(pixel_data, f)

                    if i < 5:
                        screenshot_path = os.path.join(DATA_DIR, f"screenshot_{i}.png")
                        page.screenshot(path=screenshot_path)
                        # print(f"Screenshot saved to {screenshot_path}")

                    if i % 10 == 0:
                        print(f"Harvested {i}")
                else:
                    print(f"Failed to capture data for {i} (all zeros)")
                    # Debug screenshot
                    debug_path = os.path.join(DATA_DIR, f"debug_fail_{i}.png")
                    page.screenshot(path=debug_path)
                    print(f"Debug screenshot saved to {debug_path}")

            except Exception as e:
                print(f"Error {i}: {e}")

            page.close()

        browser.close()

if __name__ == "__main__":
    harvest()
