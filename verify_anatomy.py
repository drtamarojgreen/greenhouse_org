import asyncio
from playwright.async_api import async_playwright
import os

async def verify_anatomy():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))
        # page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

        url = "http://localhost:8000/docs/test_models.html"
        print(f"Navigating to {url}")

        try:
            await page.goto(url)
            await page.wait_for_timeout(2000)

            # 1. Verify Genetic Anatomy & Sparking
            print("Testing Genetic Model Anatomy...")
            await page.select_option("#model-selector", "genetic")
            await page.wait_for_selector('button:has-text("Start Simulation")')
            await page.click('button:has-text("Start Simulation")')

            # Wait for neurons to start sparking
            await page.wait_for_timeout(5000)
            await page.screenshot(path="/home/jules/genetic_anatomy_verify.png")
            print("Genetic anatomy screenshot saved.")

            # 2. Verify Neuro Anatomy
            print("Testing Neuro Model Anatomy...")
            await page.select_option("#model-selector", "neuro")
            await page.wait_for_selector('button:has-text("Start Simulation")')
            await page.click('button:has-text("Start Simulation")')

            # Wait for canvas to be populated
            await page.wait_for_timeout(5000)
            await page.screenshot(path="/home/jules/neuro_anatomy_verify.png")
            print("Neuro anatomy screenshot saved.")

        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_anatomy())
