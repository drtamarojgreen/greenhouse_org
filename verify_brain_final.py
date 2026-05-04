import asyncio
from playwright.async_api import async_playwright
import os

async def verify_brain_3d():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 1200})
        page = await context.new_page()

        print("Navigating to http://localhost:8000/docs/models.html")
        await page.goto("http://localhost:8000/docs/models.html")

        # Wait for the loading screen to disappear or consent screen to appear
        print("Waiting for consent screen...")
        await page.wait_for_selector("#consent-checkbox", timeout=30000)

        # 1. Accept Consent
        try:
            await page.click("#consent-checkbox")
            print("Clicked consent checkbox.")

            # Start Simulation
            await page.click("#start-simulation-btn")
            print("Clicked Start Simulation.")
        except Exception as e:
            print(f"Error starting simulation: {e}")

        # 2. Launch 3D View
        print("Waiting for simulation interface...")
        try:
            # Wait for the toggle button
            await page.wait_for_selector("#toggle-3d-btn", timeout=15000)
            await page.click("#toggle-3d-btn")
            print("Clicked Launch 3D View.")
        except Exception as e:
            print(f"Error toggling 3D view: {e}")

        # 3. Verify 3D Canvas
        print("Waiting for 3D canvas...")
        try:
            canvas_selector = "#canvas-3d"
            await page.wait_for_selector(canvas_selector, timeout=15000)
            print("3D Canvas (#canvas-3d) found.")

            # Scroll to the canvas
            await page.locator(canvas_selector).scroll_into_view_if_needed()

            # Wait a bit for the brain to render and rotate slightly
            await page.wait_for_timeout(5000)

            # Capture final screenshot
            await page.screenshot(path="final_brain_verification.png")
            print("Final screenshot saved to final_brain_verification.png")

        except Exception as e:
            print(f"Error verifying 3D canvas: {e}")
            await page.screenshot(path="error_canvas.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_brain_3d())
