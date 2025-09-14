from playwright.sync_api import sync_playwright, expect

def create_screenshots():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Set a longer default timeout for the page
        page.set_default_timeout(60000) # 60 seconds

        # Navigate to the homepage and take a screenshot
        print("Navigating to homepage...")
        # Changed wait_until to 'load'
        page.goto("https://greenhousementalhealth.org/", wait_until="load")
        print("Homepage navigation complete. Capturing screenshot...")
        page.screenshot(path="docs/images/screenshot_homepage.png", full_page=True)
        print("Homepage screenshot captured.")

        # Navigate to the services page
        print("Navigating to services page...")
        services_link = page.get_by_role("link", name="Services", exact=True)

        services_link.click()

        # Wait for the page to load completely using 'load' state
        page.wait_for_load_state("load")
        print("Services page navigation complete. Capturing screenshot...")

        # Take a screenshot of the services page
        page.screenshot(path="docs/images/screenshot_services.png", full_page=True)
        print("Services page screenshot captured.")

        browser.close()

if __name__ == "__main__":
    create_screenshots()
