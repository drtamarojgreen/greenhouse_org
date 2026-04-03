from playwright.sync_api import sync_playwright
import time

def verify_models():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Listen for console logs and errors
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err.message}"))

        try:
            print("Navigating to test harness...")
            page.goto("http://127.0.0.1:8000/docs/test_models.html")

            # Wait for loading overlay to disappear
            page.wait_for_selector("#loading-overlay", state="hidden", timeout=10000)

            print("Selecting Genetic Model...")
            page.select_option("#model-selector", "genetic")

            # Wait for some time for the model to load and start
            time.sleep(5)
            page.screenshot(path="/home/jules/genetic_model_check.png")

            print("Selecting Neuro Model...")
            page.select_option("#model-selector", "neuro")

            time.sleep(5)
            page.screenshot(path="/home/jules/neuro_model_check.png")

        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_models()
