import asyncio
from playwright.async_api import async_playwright
import os
import sys

async def test_js_integration_page(page, base_url):
    print("\n--- Testing JS Integration Page ---")

    # Add console listener
    page.on('console', lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
    page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))
    page.on("requestfailed", lambda request: print(f"REQUEST FAILED: {request.url} {request.failure}"))

    await page.goto(f"{base_url}/tests/pages/schedule_test_page.html")

    # 1. Load Scheduler
    print("Loading Scheduler...")
    await page.click('button:has-text("Load Scheduler")')
    await page.wait_for_selector('#appointment-form', state='visible')
    print("  ✓ Scheduler loaded")

    # 2. Run Tests
    print("Running Tests...")

    suite_count = await page.evaluate("window.TestFramework.suites.length")
    print(f"  ✓ Suite count: {suite_count}")

    await page.click('button:has-text("Run Tests")')

    # Wait for the console output to show completion
    try:
        # We check both the #console-output and we can also check for an alert if it was a real test
        # but here the TestFramework prints to console.
        await page.wait_for_function(
            "document.querySelector('#console-output').textContent.includes('All tests passed') || "
            "document.querySelector('#console-output').textContent.includes('Tests failed')",
            timeout=20000
        )

        console_text = await page.inner_text('#console-output')
        if "All tests passed" in console_text:
            print("  ✓ All JS tests passed in browser")
            return True
        else:
            print("  ✗ Some JS tests failed in browser")
            # Log failure details
            print(f"Console Output Snippet:\n{console_text[-500:]}")
            return False
    except Exception as e:
        print(f"  ✗ Timeout waiting for JS tests: {str(e)}")
        console_text = await page.inner_text('#console-output')
        print(f"Last Console Output:\n{console_text[-500:]}")
        return False

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Start local server
        print("Starting local server...")
        server_process = await asyncio.create_subprocess_exec(
            'python3', '-m', 'http.server', '8010',
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.DEVNULL
        )
        await asyncio.sleep(2)

        base_url = "http://localhost:8010"

        try:
            ok = await test_js_integration_page(page, base_url)
            if ok:
                print("\n✅ JS INTEGRATION TESTS PASSED")
            else:
                print("\n❌ JS INTEGRATION TESTS FAILED")
                sys.exit(1)
        except Exception as e:
            print(f"\n❌ ERROR DURING TESTING: {str(e)}")
            sys.exit(1)
        finally:
            server_process.kill()
            await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
