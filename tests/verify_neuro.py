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
        await page.goto(f"file://{os.getcwd()}/docs/neuro.html")

        # Wait for the canvas to be ready
        canvas = await page.wait_for_selector('#neuro-app-container canvas', state='visible')
        box = await canvas.bounding_box()

        # We need to click relative to the canvas.
        # But handleMouseDown uses the event's clientX/clientY.
        # Playwright's mouse.click uses viewport coordinates.

        async def click_canvas(x, y):
            # Map canvas-internal coordinates back to viewport
            # canvas internal is 1200x600 (approx)
            # but wait, it might be 1000x750.
            # Let's check the console logs for initialization.
            await page.mouse.click(box['x'] + x * (box['width']/1000), box['y'] + y * (box['height']/750))

        # Wait for some generations to pass
        await asyncio.sleep(5)

        # 1. Take initial screenshot (Simulation Tab)
        await page.screenshot(path='/home/jules/verification/neuro_sim_tab.png')
        print("Simulation Tab screenshot saved.")

        # 2. Switch to ADHD Tab (x ~ 160, y ~ 45)
        await click_canvas(160, 45)
        await asyncio.sleep(1)
        await page.screenshot(path='/home/jules/verification/neuro_adhd_tab.png')
        print("ADHD Tab screenshot saved.")

        # 3. Open Category Dropdown (x ~ 100, y ~ 125)
        await click_canvas(100, 125)
        await asyncio.sleep(1)
        await page.screenshot(path='/home/jules/verification/neuro_adhd_dropdown.png')
        print("ADHD Dropdown screenshot saved.")

        # 4. Select Research Category (Option 7, y ~ 290)
        await click_canvas(100, 290)
        await asyncio.sleep(1)
        await page.screenshot(path='/home/jules/verification/neuro_research_category.png')
        print("Research Category screenshot saved.")

        # 5. Enable Analytics Mode (ID 202, y ~ 195)
        await click_canvas(100, 195)
        await asyncio.sleep(1)
        await page.screenshot(path='/home/jules/verification/neuro_analytics_active.png')
        print("Analytics Overlay screenshot saved.")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
