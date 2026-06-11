import asyncio
from playwright.async_api import async_playwright
import os

async def verify_labels():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})

        # Verify Genetic Model Labels
        print("Verifying Genetic Model Labels...")
        await page.goto(f'file://{os.getcwd()}/docs/test_models.html')
        await page.select_option('#model-selector', 'genetic')
        await page.wait_for_timeout(5000) # Wait for simulation to start and render

        # Click start button if present in overlay
        try:
            await page.click('button:has-text("Start Simulation")', timeout=2000)
        except:
            pass

        await page.wait_for_timeout(3000)
        await page.screenshot(path='/home/jules/verification/genetic_labels_v5.png')
        print("Genetic Model screenshot captured at /home/jules/verification/genetic_labels_v5.png")

        # Verify Neuro Model Labels
        print("Verifying Neuro Model Labels...")
        await page.select_option('#model-selector', 'neuro')
        await page.wait_for_timeout(5000)

        try:
            await page.click('button:has-text("Start Simulation")', timeout=2000)
        except:
            pass

        await page.wait_for_timeout(3000)
        await page.screenshot(path='/home/jules/verification/neuro_labels_v5.png')
        print("Neuro Model screenshot captured at /home/jules/verification/neuro_labels_v5.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_labels())
