import os
import json
import time
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

            # Route interception
            page.route("**/js/environment_config.js", handle_route)

            try:
                # print(f"Processing {i}...")
                page.goto(DOCS_URL)

                # Wait for potential consent screen
                try:
                    page.wait_for_selector('#consent-checkbox', state='visible', timeout=5000)
                    page.check('#consent-checkbox')
                    page.click('#start-simulation-btn')
                except:
                    # print("No consent screen found. Checking if app is already running or broken.")
                    # Try to force init if broken
                    pass

                # Wait for canvas
                try:
                    page.wait_for_selector('canvas', timeout=5000)
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
                        page.wait_for_selector('canvas', timeout=3000)
                    except:
                        # print(f"Still no canvas for {i}. Skipping.")
                        # print("Body:", page.inner_html('body')[:200])
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
                    return Array.from(ctx.getImageData(0,0,64,64).data);
                }""")

                if pixel_data:
                    out_path = os.path.join(DATA_DIR, f"capture_{i}.json")
                    with open(out_path, 'w') as f:
                        json.dump(pixel_data, f)

                    if i < 5:
                        page.screenshot(path=os.path.join(DATA_DIR, f"screenshot_{i}.png"))

                    if i % 10 == 0:
                        print(f"Harvested {i}")

            except Exception as e:
                print(f"Error {i}: {e}")

            page.close()

        browser.close()

if __name__ == "__main__":
    harvest()
