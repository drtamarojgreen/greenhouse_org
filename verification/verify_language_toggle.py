
from playwright.sync_api import sync_playwright, expect

def verify_translation(page):
    # Navigate to the page
    page.goto("http://localhost:8000/docs/models.html")

    # Wait for the consent screen to load
    page.wait_for_selector("#models-app-container")

    # Wait for the language button to appear on the consent screen
    lang_btn = page.locator("#lang-toggle-consent")
    expect(lang_btn).to_be_visible(timeout=20000)

    # Check initial English text
    expect(page.locator("h1.greenhouse-simulation-title")).to_contain_text("Exploring Neural Plasticity")

    # Click to toggle language to Spanish
    lang_btn.click()

    # Check Spanish text
    expect(page.locator("h1.greenhouse-simulation-title")).to_contain_text("Explorando la Plasticidad Neuronal")
    expect(page.locator(".greenhouse-disclaimer-banner")).to_contain_text("Nota: Esta es una simulación educativa")

    # Accept consent to verify simulation interface
    page.locator("#consent-checkbox").check()

    # Ensure button is enabled before clicking
    launch_btn = page.locator("#start-simulation-btn")
    expect(launch_btn).to_be_enabled()
    launch_btn.click()

    # Wait for simulation interface
    page.wait_for_selector(".simulation-main-container")

    # Verify Spanish text in simulation interface
    expect(page.locator(".greenhouse-disclaimer-banner")).to_contain_text("Para Fines Educativos")
    expect(page.locator("#controls-general h3")).to_contain_text("Controles Generales")
    expect(page.locator("#controls-synaptic label").first).to_contain_text("Intensidad de Práctica")

    # Take screenshot of the Spanish interface
    page.screenshot(path="verification/spanish_simulation.png")

    # Toggle back to English using the general controls button
    page.locator("#language-btn-general").click()

    # Verify English text returns
    expect(page.locator(".greenhouse-disclaimer-banner")).to_contain_text("For Educational Purposes")
    expect(page.locator("#controls-general h3")).to_contain_text("General Controls")

    # Take screenshot of the English interface
    page.screenshot(path="verification/english_simulation.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_translation(page)
            print("Verification successful!")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/failure.png")
        finally:
            browser.close()
