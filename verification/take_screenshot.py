import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        # Use force_toc=true as per memory
        await page.goto('http://localhost:3000/models.html?force_toc=true')

        # Wait for simulation to load and consent screen to appear
        await page.wait_for_selector('#start-simulation-btn')

        # Click consent checkbox and start button
        await page.click('#consent-checkbox')
        await page.click('#start-simulation-btn')

        # Wait for simulation UI to render
        await page.wait_for_selector('.simulation-main-container')

        # Wait a bit for canvases to be drawn
        await asyncio.sleep(2)

        # Take screenshot
        await page.screenshot(path='verification/simulation_ui.png', full_page=True)
        print("Screenshot saved to verification/simulation_ui.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
