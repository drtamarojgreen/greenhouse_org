import argparse
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os

def run_test(url):
    # Set up Firefox options for headless browsing
    firefox_options = Options()
    firefox_options.add_argument("--headless")
    firefox_options.add_argument("--disable-gpu")
    firefox_options.add_argument("--no-sandbox")

    # Path to your geckodriver
    current_dir = os.path.dirname(os.path.abspath(__file__))
    geckodriver_path = os.path.join(current_dir, 'geckodriver')

    driver = None
    try:
        # Initialize the WebDriver
        service = Service(executable_path=geckodriver_path)
        driver = webdriver.Firefox(service=service, options=firefox_options)
        driver.get(url)

        print(f"Navigated to: {driver.current_url}")
        print(f"Page Title: {driver.title}")

        # --- Helper Functions ---
        def check_element_presence(name, by, selector):
            try:
                WebDriverWait(driver, 5).until(EC.presence_of_element_located((by, selector)))
                print(f"SUCCESS: Found '{name}' using selector: {by}='{selector}'")
                return True
            except:
                print(f"FAILURE: Could not find '{name}' using selector: {by}='{selector}'")
                return False

        def check_element_layout(name, by, selector, prev_layout=None):
            print(f"\n-- Checking layout for: {name} ({selector}) --")
            try:
                element = WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((by, selector))
                )
                loc = element.location
                size = element.size
                print(f"  - Location (x, y): {loc['x']}, {loc['y']}")
                print(f"  - Size (w, h): {size['width']}, {size['height']}")

                if size['width'] > 0 and size['height'] > 0:
                    print("  - PASSED: Element has valid dimensions (width > 0, height > 0).")
                else:
                    print("  - FAILED: Element has invalid dimensions.")

                if prev_layout:
                    if loc['y'] > prev_layout['y']:
                        print(f"  - PASSED: Element is vertically below '{prev_layout['name']}'.")
                    else:
                        print(f"  - FAILED: Element is NOT vertically below '{prev_layout['name']}'.")

                return {'name': name, 'x': loc['x'], 'y': loc['y'], 'width': size['width'], 'height': size['height']}
            except Exception as e:
                print(f"  - FAILED: Could not find or analyze element '{name}'.")
                return None

        print("\n--- Debugging Page Layout (using specific component IDs) ---")
        # IDs discovered from the HTML source provided by the user
        header_logo_layout = check_element_layout("Header Logo Container", By.ID, "comp-lkaj99qf")
        main_heading_layout = check_element_layout("Main Heading Container", By.ID, "comp-lkai77mt", prev_layout=header_logo_layout)
        login_bar_layout = check_element_layout("Login Bar Container", By.ID, "comp-lkajvm3a", prev_layout=header_logo_layout)
        footer_copyright_layout = check_element_layout("Footer Copyright Text", By.ID, "comp-lkai781s1")


        print("\n\n--- Debugging Element Presence (using specific component IDs) ---")
        check_element_presence("Main Navigation Menu", By.ID, "comp-lkai77z1")
        check_element_presence("Footer Navigation Menu", By.ID, "comp-lzo75jvj")
        check_element_presence("'Our Story' Section", By.ID, "comp-mfn2ep6t")
        check_element_presence("'Item List' Section", By.ID, "comp-mf2vsemq")


        print("\n--- Debugging Scheduler Rendering (Legacy Checks) ---")
        print("NOTE: The following checks are for scheduler components that are NOT on the live page.")
        print("These tests are expected to FAIL, highlighting a discrepancy with the application design.")

        check_element_presence("Main scheduler container", By.ID, "greenhouse-app-container")
        scheduler_elements = {
            "Calendar Container": "greenhouse-dashboard-app-calendar-container",
            "Schedule Container": "greenhouse-dashboard-app-schedule-container",
            "Conflict Resolution Area": "greenhouse-dashboard-app-conflict-resolution-area"
        }
        for name, element_id in scheduler_elements.items():
            check_element_presence(name, By.ID, element_id)
        
        print("\n-------------------------------------")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Debug the rendering of the scheduler application.')
    parser.add_argument('url', type=str, help='The URL of the page to scan.')
    args = parser.parse_args()

    run_test(args.url)
