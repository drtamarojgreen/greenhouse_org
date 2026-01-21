import asyncio
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})

        # Go to the local server
        print("Navigating to http://localhost:8081/docs/dopamine.html")
        await page.goto('http://localhost:8081/docs/dopamine.html')

        # Wait for the simulation to initialize
        await asyncio.sleep(5)

        # Take a screenshot of the enhanced visuals
        await page.screenshot(path='/home/jules/verification/dopamine_enhanced_visuals.png')
        print("Enhanced visuals screenshot saved")

        # Open Pharmacology and select a drug to see if labels and analytics work
        await page.click('text=Pharmacology')
        await asyncio.sleep(1)
        # Try to find a drug link
        drug_item = page.locator('.dropdown-content >> text=Drug: SKF-38393')
        if await drug_item.count() > 0:
            await drug_item.click()
            print("Selected drug: SKF-38393")

        await asyncio.sleep(2)
        await page.screenshot(path='/home/jules/verification/dopamine_drug_selected.png')
        print("Drug selection screenshot saved")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(verify())
