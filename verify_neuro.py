import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Get absolute path
        abs_path = os.path.abspath('docs/test_models.html')
        url = f'file://{abs_path}'
        print(f"Navigating to {url}")

        await page.goto(url)

        # Wait for the page to load
        await page.wait_for_timeout(3000)

        # Select "neuro" from the dropdown
        print("Selecting Neuro Model from dropdown")
        await page.select_option('#model-selector', 'neuro')

        # Wait for the model to load and render
        print("Waiting for model to render...")
        await page.wait_for_timeout(8000)

        # Ensure verification dir exists
        os.makedirs('/home/jules/verification', exist_ok=True)

        screenshot_path = '/home/jules/verification/neuro_brain_realistic_v4.png'
        await page.screenshot(path=screenshot_path)
        print(f"Neuro Model screenshot captured at {screenshot_path}")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())
