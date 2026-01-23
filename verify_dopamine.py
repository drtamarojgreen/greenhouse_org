import asyncio
from playwright.async_api import async_playwright
import os
import subprocess
import time

async def run_verification():
    # Kill any existing server on 8080
    subprocess.run("kill $(lsof -t -i :8080) 2>/dev/null || true", shell=True)
    # Start the server
    server_process = subprocess.Popen(["python3", "-m", "http.server", "8080"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(2) # Give it a moment to start

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page(viewport={'width': 1280, 'height': 800})

            # Go to the dopamine page
            print("Navigating to page...")
            await page.goto("http://localhost:8080/docs/dopamine.html")

            # Wait for the application to initialize
            print("Waiting for container...")
            await page.wait_for_selector(".dopamine-simulation-container", timeout=60000)
            print("Container found.")

            # 1. Capture the Welcome Modal
            await asyncio.sleep(2)
            await page.screenshot(path="welcome_modal_sanitized.png")
            print("Captured welcome_modal_sanitized.png")

            # Dismiss modal
            try:
                await page.click("#close-welcome", timeout=5000)
                print("Dismissed modal using #close-welcome.")
            except:
                print("Failed to dismiss modal using #close-welcome.")

            # 2. Capture the main simulation (Intracellular focus)
            await asyncio.sleep(2)
            await page.screenshot(path="simulation_intracellular.png")
            print("Captured simulation_intracellular.png")

            # 3. Capture the Scientific Dashboard
            try:
                print("Opening Scientific Report using 'S' key...")
                await page.keyboard.press("s")
                await page.wait_for_selector("#scientific-dashboard-modal", timeout=10000)
                await asyncio.sleep(2)
                await page.screenshot(path="scientific_dashboard_sanitized.png")
                print("Captured scientific_dashboard_sanitized.png")
            except Exception as e:
                print(f"Failed to capture Scientific Dashboard: {e}")

            await browser.close()
    finally:
        server_process.terminate()

if __name__ == "__main__":
    asyncio.run(run_verification())
