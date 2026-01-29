import asyncio
from playwright.async_api import async_playwright
import os
import sys

async def test_mobile_hub(page, base_url):
    print("\n--- Testing Mobile Hub ---")
    pages = [
        "docs/genetic.html", "docs/neuro.html", "docs/pathway.html", "docs/synapse.html",
        "docs/dopamine.html", "docs/serotonin.html", "docs/dna.html", "docs/rna.html",
        "docs/emotion.html", "docs/cognition.html", "docs/models.html"
    ]

    for page_path in pages:
        print(f"Checking {page_path}...")
        await page.goto(f"{base_url}/{page_path}")

        # Wait for mobile hub
        try:
            await page.wait_for_selector('#greenhouse-mobile-viewer', state='visible', timeout=10000)
            print(f"  ✓ Mobile hub detected on {page_path}")

            cards = await page.query_selector_all('.gh-mobile-card')
            if len(cards) == 10:
                print(f"  ✓ Found 10 models in hub.")
            else:
                print(f"  ✗ Expected 10 models, found {len(cards)}")
                return False
        except Exception as e:
            print(f"  ✗ Mobile hub NOT detected on {page_path}: {str(e)}")
            return False

    return True

async def test_meditation_app(page, base_url):
    print("\n--- Testing Meditation App ---")
    await page.goto(f"{base_url}/mobile/app/index.html")

    # Check login page
    await page.wait_for_selector('#auth-page', state='visible')
    print("  ✓ Auth page visible")

    # Simulate login
    await page.click('#login-button')

    # Check main page
    await page.wait_for_selector('#meditation-page', state='visible')
    print("  ✓ Meditation page visible after login")

    # Check navigation
    await page.click('button[data-target="schedule-page"]')
    await page.wait_for_selector('#schedule-page', state='visible')
    print("  ✓ Navigation to scheduler works")

    return True

async def main():
    async with async_playwright() as p:
        device = p.devices['iPhone 12']
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(**device)
        page = await context.new_page()

        # Start local server from root
        print("Starting local server from root...")
        server_process = await asyncio.create_subprocess_exec(
            'python3', '-m', 'http.server', '8008',
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.DEVNULL
        )
        await asyncio.sleep(2)

        base_url = "http://localhost:8008"

        try:
            hub_ok = await test_mobile_hub(page, base_url)
            app_ok = await test_meditation_app(page, base_url)

            if hub_ok and app_ok:
                print("\n✅ ALL INTEGRATION TESTS PASSED")
            else:
                print("\n❌ SOME INTEGRATION TESTS FAILED")
                sys.exit(1)

        finally:
            server_process.kill()
            await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
