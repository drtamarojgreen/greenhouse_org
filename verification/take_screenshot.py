import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto('http://localhost:3000/models.html?force_toc=true')

        # Handle consent
        await page.wait_for_selector('#consent-checkbox')
        await page.check('#consent-checkbox')
        await page.click('#start-simulation-btn')

        # Wait for simulation to load
        await page.wait_for_selector('#controls-synaptic', timeout=10000)

        # Scroll to environment controls to see the new sliders
        await page.evaluate("document.getElementById('controls-environment').scrollIntoView()")
        await page.screenshot(path='verification/simulation_ui.png', full_page=True)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
