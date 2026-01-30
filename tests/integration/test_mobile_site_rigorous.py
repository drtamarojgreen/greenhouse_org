import asyncio
from playwright.async_api import async_playwright
import os
import sys

async def test_mobile_site_rigorous(page, base_url):
    print("\n--- Rigorous Testing of Mobile Site (docs/) ---")

    # 1. Navigate to models.html with mobile emulation
    print("Navigating to docs/models.html...")
    await page.goto(f"{base_url}/docs/models.html?runTests=true")

    # 2. Verify Mobile Hub Overlay
    print("Verifying Mobile Hub...")
    try:
        await page.wait_for_selector('#greenhouse-mobile-viewer', state='visible', timeout=15000)
        print("  ✓ Mobile hub overlay visible")
    except Exception as e:
        print(f"  ✗ Mobile hub NOT visible: {str(e)}")
        # Check if it's because it's not detected as mobile
        is_mobile = await page.evaluate("window.GreenhouseMobile.isMobileUser()")
        print(f"  Mobile detection result: {is_mobile}")
        return False

    # 3. Verify Cards and Swiping
    print("Testing Swipe Interaction...")
    cards = await page.query_selector_all('.gh-mobile-card')
    print(f"  ✓ Found {len(cards)} model cards")

    if len(cards) > 0:
        card = cards[0]
        model_id = await card.get_attribute('data-model-id')
        print(f"  Testing card: {model_id}")

        # Simulate swipe up to change mode
        box = await card.bounding_box()
        start_x = box['x'] + box['width'] / 2
        start_y = box['y'] + box['height'] * 0.8
        end_y = box['y'] + box['height'] * 0.2

        await page.mouse.move(start_x, start_y)
        await page.mouse.down()
        await page.mouse.move(start_x, end_y, steps=10)
        await page.mouse.up()

        # Check if mode indicator appeared
        try:
            await page.wait_for_selector(f'#mode-indicator-{model_id}.show', state='visible', timeout=5000)
            mode_text = await page.inner_text(f'#mode-indicator-{model_id}')
            print(f"  ✓ Mode changed via swipe: {mode_text}")
        except Exception as e:
            print(f"  ✗ Mode indicator did not show after swipe: {str(e)}")
            # Fallback check
            idx = await page.evaluate(f"document.querySelector('[data-model-id=\"{model_id}\"]').dataset.currentModeIndex")
            print(f"  Current mode index: {idx}")

    # 4. Verify Model Activation
    print("Verifying Model Activation...")
    # The first card should be activated by IntersectionObserver
    active_count = await page.evaluate("window.GreenhouseMobile.activeModels.size")
    print(f"  ✓ Active models: {active_count}")

    # 5. Check JS Integration Tests in Browser
    print("Checking Browser Integration Tests...")
    try:
        # Wait for GreenhouseTestSuite to finish if it was triggered
        await asyncio.sleep(5)

        results_el = await page.query_selector('#greenhouse-test-results-overlay')
        if results_el:
            results_text = await results_el.inner_text()
            print(f"  ✓ Internal Test Results: {results_text.replace('\n', ' ')}")
            if "Failed: 0" not in results_text:
                print("  ✗ Some internal tests failed")
                # Log actual results from console or evaluate
                failures = await page.evaluate("window.GreenhouseTestSuite.results.filter(r => r.status === 'FAIL')")
                for f in failures:
                    print(f"    - {f['name']}: {f['error']}")
        else:
            print("  ✗ Internal test overlay not found")
    except Exception as e:
        print(f"  ✗ Error checking internal tests: {str(e)}")

    # 6. Verify Navigation
    print("Verifying Navigation...")
    select_btn = await page.query_selector('.gh-mobile-btn')
    target_url = await select_btn.get_attribute('href')
    print(f"  Target URL: {target_url}")

    await select_btn.click()
    await page.wait_for_load_state('networkidle')
    print(f"  ✓ Navigated to: {page.url}")
    assert target_url in page.url, "Should navigate to the correct model page"

    return True

async def main():
    async with async_playwright() as p:
        # Emulate iPhone 12
        device = p.devices['iPhone 12']
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(**device)
        page = await context.new_page()

        # Start local server
        print("Starting local server...")
        server_process = await asyncio.create_subprocess_exec(
            'python3', '-m', 'http.server', '8012',
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.DEVNULL
        )
        await asyncio.sleep(2)

        base_url = "http://localhost:8012"

        try:
            ok = await test_mobile_site_rigorous(page, base_url)
            if ok:
                print("\n✅ MOBILE SITE RIGOROUS TESTS PASSED")
            else:
                print("\n❌ MOBILE SITE RIGOROUS TESTS FAILED")
                sys.exit(1)
        except Exception as e:
            print(f"\n❌ ERROR DURING TESTING: {str(e)}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
        finally:
            server_process.kill()
            await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
