
import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        iphone_12 = p.devices['iPhone 12']
        browser = await p.chromium.launch()
        context = await browser.new_context(
            **iphone_12
        )
        page = await context.new_page()

        print('Navigating to models.html...')
        await page.goto('http://localhost:3000/models.html?mobile=true')

        # Wait for the hub to appear
        print('Waiting for mobile hub...')
        await page.wait_for_selector('.gh-mobile-overlay', timeout=10000)

        # Capture English screenshot
        print('Capturing English screenshot...')
        await page.screenshot(path='hub_en.png')

        # Toggle to Spanish
        print('Toggling language...')
        await page.click('#gh-mobile-lang-btn')

        # Give it a moment to update
        await page.wait_for_timeout(500)

        # Capture Spanish screenshot
        print('Capturing Spanish screenshot...')
        await page.screenshot(path='hub_es.png')

        # Check for specific text to verify
        hub_title = await page.inner_text('.gh-hub-title')
        print(f'Hub Title (ES): {hub_title}')

        lang_btn_text = await page.inner_text('#gh-mobile-lang-btn')
        print(f'Lang Button Text (ES): {lang_btn_text}')

        model_title = await page.inner_text('.gh-model-title')
        print(f'First Model Title (ES): {model_title}')

        select_btn_text = await page.inner_text('.gh-mobile-btn')
        print(f'Select Button Text (ES): {select_btn_text}')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())
