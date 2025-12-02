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

        # Define route handler factory
        current_config = {}

        def handle_route(route):
            print(f"Intercepting config request: {route.request.url}")
            js_payload = f"window.GreenhouseEnvironmentConfig = {json.dumps(current_config)}; console.log('Config injected via interception');"
            route.fulfill(
                status=200,
                content_type="application/javascript",
                body=js_payload
            )

        # Iterate - Using 50 iterations as requested, but monitoring success
        for i in range(50):
            var_path = os.path.join(DATA_DIR, f"variation_{i}.json")
            if not os.path.exists(var_path):
                print(f"Variation {i} not found.")
                continue

            with open(var_path, 'r') as f:
                current_config = json.load(f)

            page = context.new_page()

            # Attach console listeners for debugging
            # page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
            page.on("pageerror", lambda exc: print(f"Browser Error: {exc}"))

            # Route interception with Regex
            page.route(re.compile(r".*/js/environment_config\.js.*"), handle_route)

            try:
                # print(f"Processing {i}...")
                page.goto(DOCS_URL)

                # Wait for potential consent screen
                try:
                    page.wait_for_selector('#consent-checkbox', state='visible', timeout=5000)
                    page.check('#consent-checkbox')
                    page.click('#start-simulation-btn')
                except:
                    # Consent might not appear or already handled
                    pass

                # Wait for canvas
                try:
                    page.wait_for_selector('canvas', timeout=10000)
                except:
                    # Try to force start via console
                    page.evaluate("""() => {
                         if (window.GreenhouseModelsUX && !window.GreenhouseModelsUX.state.isInitialized) {
                             console.log("Force initializing...");
                             window.GreenhouseModelsUX.initialize();
                         }
                    }""")
                    # Wait again
                    try:
                        page.wait_for_selector('canvas', timeout=5000)
                    except:
                        print(f"Still no canvas for {i}. Skipping.")
                        page.close()
                        continue

                # Wait for render
                page.wait_for_timeout(1000)

                # Capture
                pixel_data = page.evaluate("""() => {
                    const canvases = document.querySelectorAll('canvas');
                    if (canvases.length === 0) return null;
                    // Grab the 3rd one (Environment) or just the biggest
                    const target = canvases[canvases.length - 1];

                    const temp = document.createElement('canvas');
                    temp.width = 64;
                    temp.height = 64;
                    const ctx = temp.getContext('2d');
                    ctx.drawImage(target, 0, 0, 64, 64);
                    const data = ctx.getImageData(0,0,64,64).data;

                    // Check if data is all zeros (transparent/empty)
                    let hasData = false;
                    for(let i=0; i<data.length; i+=4) {
                        if(data[i+3] !== 0) { // Check alpha
                            hasData = true;
                            break;
                        }
                    }
                    if (!hasData) return null;

                    return Array.from(data);
                }""")

                if pixel_data:
                    out_path = os.path.join(DATA_DIR, f"capture_{i}.json")
                    with open(out_path, 'w') as f:
                        json.dump(pixel_data, f)

                    if i < 5: # Save first 5 screenshots
                        page.screenshot(path=os.path.join(DATA_DIR, f"screenshot_{i}.png"))

                    if i % 10 == 0:
                        print(f"Harvested {i}")
                else:
                    print(f"No pixel data for {i}")

            except Exception as e:
                print(f"Error {i}: {e}")

            page.close()

        browser.close()

if __name__ == "__main__":
    harvest()
