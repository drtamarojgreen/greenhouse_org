import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Adjust viewport to match typical canvas size
        await page.set_viewport_size({"width": 1280, "height": 800})

        # Navigate to the stress app
        # Assuming the server is running on port 8000
        url = "http://localhost:8000/stress.html"
        print(f"Navigating to {url}")
        await page.goto(url)

        # Wait for app to initialize
        await page.wait_for_timeout(3000)

        # Take Macro Screenshot (Default)
        print("Capturing Macro view...")
        await page.screenshot(path="/home/jules/verification/stress_macro_v3.png")

        # Switch to Systemic View
        print("Switching to Systemic view...")
        # Search for "SYSTEMIC" button and click it
        # It's drawn on canvas, so we need to click by coordinate or use a button if it exists in DOM.
        # But GreenhouseStressApp draws buttons on canvas.
        # MACRO: 40, 70, 60, 22
        # PATHWAY: 105, 70, 65, 22
        # SYSTEMIC: 175, 70, 70, 22
        # Canvas starts at (0,0) in its container.
        # Need to find the canvas position.

        canvas_handle = await page.query_selector("canvas")
        box = await canvas_handle.bounding_box()

        # Click SYSTEMIC button (at 175 + 35, 70 + 11 relative to canvas)
        await page.mouse.click(box['x'] + 175 + 35, box['y'] + 70 + 11)

        # Wait for transition
        await page.wait_for_timeout(2000)

        print("Capturing Systemic view...")
        await page.screenshot(path="/home/jules/verification/stress_systemic_v3.png")

        # Optional: Open an accordion to check for label overlap
        print("Opening Clinical Interventions accordion...")
        # Col 2, X = Math.max(400, width - 630). Width is 1280? No, canvas width is container width.
        # Let's check canvas width in console
        canvas_width = await page.evaluate("() => window.GreenhouseStressApp.canvas.width")
        col2X = max(400, canvas_width - 630)
        # Clinical Interventions is the 3rd in Col 2 (brainstem, research, interv...)
        # Header heights are 25 + 10 gap.
        # y starts at 280.
        # interv y = 280 + (25+10)*2 = 350
        await page.mouse.click(box['x'] + col2X + 90, box['y'] + 350 + 12)
        await page.wait_for_timeout(1000)

        print("Capturing Systemic view with open accordion...")
        await page.screenshot(path="/home/jules/verification/stress_systemic_open_v3.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
