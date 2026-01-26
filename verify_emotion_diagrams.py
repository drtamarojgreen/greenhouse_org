import asyncio
from playwright.async_api import async_playwright
import os

async def verify_diagrams():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Using the live preview server started in pre-commit
        await page.goto("http://localhost:3000/emotion.html")
        await page.wait_for_selector("#emotion-app-container canvas")

        # 1. Test PFC-Amygdala Circuit (Regulation Category, First Button)
        await page.click("button:has-text('Regulation')")
        await page.click("button:has-text('PFC-Amygdala Inhibitory Circuit')")
        await asyncio.sleep(1)
        await page.screenshot(path="/home/jules/verification/emotion_diagram_circuit.png")
        print("Captured Circuit Diagram")

        # 2. Test HUD Gauge (Regulation, ID 8: Glutamate/GABA)
        await page.click("button:has-text('Glutamate/GABA Balance Meter')")
        await asyncio.sleep(1)
        await page.screenshot(path="/home/jules/verification/emotion_diagram_hud.png")
        print("Captured HUD Diagram")

        # 3. Test Breath Pacer (Therapeutic, ID 28: Zen Breath Counting)
        await page.click("button:has-text('Therapeutic')")
        await page.click("button:has-text('Zen Breath Counting')")
        await asyncio.sleep(2) # Wait for animation
        await page.screenshot(path="/home/jules/verification/emotion_diagram_pacer.png")
        print("Captured Pacer Diagram")

        # 4. Test TMS (Medication, ID 67: Transcranial Magnetic Stimulation)
        await page.click("button:has-text('Medication')")
        await page.click("button:has-text('Transcranial Magnetic Stimulation (TMS)')")
        await asyncio.sleep(1)
        await page.screenshot(path="/home/jules/verification/emotion_diagram_tms.png")
        print("Captured TMS Diagram")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_diagrams())
