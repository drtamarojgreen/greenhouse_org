import os
import json
import re
from playwright.sync_api import sync_playwright

DATA_DIR = "tools/canvasml/data"
DOCS_URL = "http://localhost:8000/docs/models.html"

def process_variation(context, i, config):
    """
    Processes a single variation: loads the page with intercepted config,
    handles consent, waits for rendering, and captures pixel data.
    """
    page = context.new_page()

    # Route interception to inject the specific configuration for this variation
    def handle_route(route):
        js_payload = f"window.GreenhouseEnvironmentConfig = {json.dumps(config)};"
        route.fulfill(
            status=200,
            content_type="application/javascript",
            body=js_payload
        )

    page.route(re.compile(r".*/js/environment_config\.js.*"), handle_route)
    page.on("pageerror", lambda exc: print(f"PAGE ERROR (Variation {i}): {exc}"))

    try:
        page.goto(DOCS_URL)

        # 1. Wait for App Initialization
        try:
            page.wait_for_function(
                "() => window.GreenhouseModelsUX && "
                "window.GreenhouseModelsUX.state && "
                "window.GreenhouseModelsUX.state.isInitialized",
                timeout=10000
            )
        except Exception as e:
            print(f"Variation {i}: Error waiting for initialization: {e}")
            return False

        # 2. Handle Consent Screen if necessary
        consent_given = page.evaluate("() => window.GreenhouseModelsUX.state.consentGiven")
        if not consent_given:
            try:
                page.wait_for_selector('#consent-checkbox', state='visible', timeout=5000)
                page.check('#consent-checkbox')
                page.click('#start-simulation-btn')
                # Wait for the consent screen to disappear
                page.wait_for_function("() => !document.querySelector('#consent-checkbox')")
            except Exception as e:
                print(f"Variation {i}: Error handling consent: {e}")
                return False

        # 3. Wait for the Environment Canvas
        target_selector = '#canvas-environment'
        try:
            page.wait_for_selector(target_selector, timeout=5000)
        except Exception:
            # Attempt recovery: Force initialization if stuck
            page.evaluate("""() => {
                    if (window.GreenhouseModelsUX && !window.GreenhouseModelsUX.state.isInitialized) {
                        window.GreenhouseModelsUX.initialize();
                    }
            }""")
            try:
                page.wait_for_selector(target_selector, timeout=3000)
            except Exception:
                print(f"Variation {i}: Canvas {target_selector} not found.")
                return False

        # 4. Wait for Render to Settle
        page.wait_for_timeout(2000)

        # 5. Capture Pixel Data (with retry)
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
            page.wait_for_timeout(1000)

        # 6. Save Data
        if pixel_data:
            out_path = os.path.join(DATA_DIR, f"capture_{i}.json")
            with open(out_path, 'w') as f:
                json.dump(pixel_data, f)

            # Save screenshot for the first few variations for visual verification
            if i < 5:
                screenshot_path = os.path.join(DATA_DIR, f"screenshot_{i}.png")
                page.screenshot(path=screenshot_path)

            return True
        else:
            print(f"Variation {i}: Failed to capture pixel data (all zeros).")
            return False

    except Exception as e:
        print(f"Variation {i}: Unexpected error: {e}")
        return False
    finally:
        page.close()

def harvest():
    print("Starting harvest...")
    with sync_playwright() as p:
        # Launch browser with EGL enabled for headless WebGL support
        browser = p.chromium.launch(headless=True, args=['--use-gl=egl'])
        context = browser.new_context()

        for i in range(50):
            var_path = os.path.join(DATA_DIR, f"variation_{i}.json")
            if not os.path.exists(var_path):
                print(f"Variation {i} not found.")
                continue

            with open(var_path, 'r') as f:
                config = json.load(f)

            success = process_variation(context, i, config)
            if success and i % 10 == 0:
                print(f"Harvested variation {i}")

        browser.close()
    print("Harvest complete.")

if __name__ == "__main__":
    harvest()
