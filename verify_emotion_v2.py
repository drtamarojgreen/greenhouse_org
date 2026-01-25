import asyncio
from playwright.async_api import async_playwright
import os

async def verify_emotion():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        # Go to the emotion page
        await page.goto('http://localhost:3000/docs/emotion.html')

        # Wait for app to initialize
        await page.wait_for_selector('canvas')

        # Take initial screenshot
        await page.screenshot(path='/home/jules/verification/emotion_v2_initial.png')

        # Click on 'Medication' category
        await page.click('button:has-text("Medication")')
        await asyncio.sleep(0.5)

        # Click on 'SSRI Synaptic Simulation'
        await page.click('button:has-text("SSRI Synaptic Simulation")')
        await asyncio.sleep(0.5)

        # Verify info panel updated
        title = await page.inner_text('h3')
        print(f"Active Theory: {title}")

        # Take screenshot of selected enhancement
        await page.screenshot(path='/home/jules/verification/emotion_v2_medication.png')

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_emotion())
