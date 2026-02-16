import asyncio
from playwright.async_api import async_playwright
import os
import subprocess
import time

async def verify():
    # Start server
    server = subprocess.Popen(["python3", "-m", "http.server", "8000", "--directory", "docs"])
    time.sleep(2)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        # Test with a common desktop resolution
        await page.set_viewport_size({"width": 1440, "height": 900})

        await page.goto("http://localhost:8000/stress.html")
        await asyncio.sleep(5) # Wait for animation and assets

        # Click SYSTEMIC button
        # btn_mode_systemic: x: 175, y: 70, w: 70, h: 22
        await page.mouse.click(175 + 35, 70 + 11)
        await asyncio.sleep(2)

        # Open Clinical Interventions (Col 2)
        # In 1440 viewport, col2X = 1440 - 405 = 1035
        # Positions: brainstem (280), research (315), interv (350)
        await page.mouse.click(1035 + 90, 350 + 12)
        await asyncio.sleep(1)

        os.makedirs("verification", exist_ok=True)
        await page.screenshot(path="verification/stress_systemic_overlap_test.png")
        print("Screenshot saved to verification/stress_systemic_overlap_test.png")

        await browser.close()

    server.terminate()

if __name__ == "__main__":
    asyncio.run(verify())
