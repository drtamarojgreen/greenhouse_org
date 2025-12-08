from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 800})

        print("Navigating to page...")
        page.goto("http://localhost:8000/docs/models.html")

        # Wait for consent screen
        print("Waiting for consent screen...")
        page.wait_for_selector("#consent-checkbox")

        # Click consent
        print("Clicking consent...")
        page.check("#consent-checkbox")

        # Click start
        print("Clicking start...")
        page.click("#start-simulation-btn")

        # Wait for canvases to be visible
        print("Waiting for canvas...")
        # The canvases are in #models-app-container, likely appended dynamically.
        # We can wait for the reset button which appears after simulation starts
        page.wait_for_selector("#reset-btn-general", timeout=10000)

        # Give it a moment to render
        time.sleep(2)

        # Draw white background to ensure visibility if transparent
        page.evaluate("""() => {
            const canvases = document.querySelectorAll('canvas');
            canvases.forEach(canvas => {
                const ctx = canvas.getContext('2d');
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            });
        }""")

        # Hover over an element to test tooltip (approximate coordinates based on layout)
        # Amygdala is usually central.
        # Let's hover over the network view canvas (bottom right usually, or bottom)
        # Based on code: environmentCanvas, synapseCanvas (top), networkCanvas (bottom?)
        # Let's just screenshot the whole container

        print("Taking screenshot...")
        page.screenshot(path="verification/canvas_verification.png", full_page=True)

        browser.close()
        print("Done.")

if __name__ == "__main__":
    run()
