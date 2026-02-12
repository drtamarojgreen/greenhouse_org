
import asyncio
from playwright.async_api import async_playwright

async def verify_graph_failure():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Listen for all console messages
        messages = []
        def handle_console(msg):
            messages.append(msg.text)
            print(f"Console: {msg.text}")

        page.on("console", handle_console)

        # Navigate to stress model
        print("Navigating to http://localhost:3000/docs/stress.html ...")
        await page.goto("http://localhost:3000/docs/stress.html")

        # Wait for app to init
        # Increased wait for dependency loading
        await asyncio.sleep(5)

        # Force switch to PATHWAY mode
        print("Forcing PATHWAY mode via JS...")
        try:
            await page.evaluate("window.GreenhouseStressApp.engine.state.factors.viewMode = 1")
        except Exception as e:
            print(f"Evaluate failed: {e}")
            # Try to see what's defined
            defined = await page.evaluate("Object.keys(window).filter(k => k.includes('Greenhouse'))")
            print(f"Defined Greenhouse globals: {defined}")

        # Give it some time to try loading the graph
        await asyncio.sleep(5)

        found = any("GreenhouseGraphParser: Graph data unavailable" in m for m in messages)

        if found:
            print("SUCCESS: Found expected 'unavailable' message in console.")
        else:
            print("FAILURE: Did not find expected 'unavailable' message in console.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_graph_failure())
