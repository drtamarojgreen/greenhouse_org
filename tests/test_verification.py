import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Add a listener for console messages
        page.on('console', lambda msg: print(f"Browser Console: {msg.text}"))

        # Navigate to the page
        await page.goto(f"file://{os.getcwd()}/docs/genetic.html")

        # Wait for the start button to be visible and click it
        await page.wait_for_selector('#genetic-start-overlay button', state='visible')
        await page.click('#genetic-start-overlay button')

        # Wait for the 3D visualization to be ready
        await page.wait_for_selector('.simulation-container canvas', state='visible')
        await asyncio.sleep(5)  # Wait for evolution to run a bit

        # Take a screenshot
        output_dir = "tests/output"
        os.makedirs(output_dir, exist_ok=True)
        screenshot_path = os.path.join(output_dir, "verification.png")
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
