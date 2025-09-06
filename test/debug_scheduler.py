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

        print("\n--- Debugging Scheduler Rendering ---")

        # Check for the main scheduler container
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "greenhouse-app-container"))
            )
            print("SUCCESS: Main scheduler container (#greenhouse-app-container) found.")
        except:
            print("FAILURE: Main scheduler container (#greenhouse-app-container) NOT found.")

        # Check for key scheduler elements
        scheduler_elements = {
            "Calendar Container": "greenhouse-dashboard-app-calendar-container",
            "Schedule Container": "greenhouse-dashboard-app-schedule-container",
            "Conflict Resolution Area": "greenhouse-dashboard-app-conflict-resolution-area"
        }

        for name, element_id in scheduler_elements.items():
            try:
                driver.find_element(By.ID, element_id)
                print(f"SUCCESS: {name} (#{element_id}) found.")
            except:
                print(f"FAILURE: {name} (#{element_id}) NOT found.")
        
        print("-------------------------------------")

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
