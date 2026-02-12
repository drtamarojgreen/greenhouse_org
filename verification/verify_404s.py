import asyncio
import sys
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Track 404s
        errors = []
        page.on("response", lambda response: errors.append(response.url) if response.status == 404 else None)

        test_url = "http://localhost:3001/docs/stress.html"
        print(f"Navigating to {test_url}...")

        try:
            await page.goto(test_url)
            # Wait for some time for scripts to load and fetch data
            await asyncio.sleep(5)

            # Take a screenshot
            screenshot_path = "/home/jules/verification/stress_verification.png"
            await page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

            # Check for 404s in the endpoints directory
            endpoint_404s = [url for url in errors if "endpoints/" in url]

            if endpoint_404s:
                print("FAILED: 404 errors detected for endpoints:")
                for url in endpoint_404s:
                    print(f"  - {url}")
                sys.exit(1)
            else:
                print("SUCCESS: No 404 errors detected for endpoints.")

        except Exception as e:
            print(f"Error during verification: {e}")
            sys.exit(1)
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
