import argparse
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.common.by import By
import os
import time

def run_test(url):
    # Set up Firefox options for headless browsing and logging
    firefox_options = Options()
    firefox_options.add_argument("--headless")
    firefox_options.add_argument("--disable-gpu")
    firefox_options.add_argument("--no-sandbox")
    firefox_options.set_preference("devtools.console.stdout.content", "true")

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

        # Wait for javascript to execute
        time.sleep(5)

        # Get console logs
        logs = driver.get_log("browser")

        print("\n--- Browser Console Logs ---")
        for log in logs:
            if "greenhouse" in log['message'].lower() or "scheduler" in log['message'].lower():
                print(f"{log['level']}: {log['message']}")
        print("--------------------------")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Debug the Greenhouse loader script.')
    parser.add_argument('url', type=str, help='The URL of the page to scan.')
    args = parser.parse_args()

    run_test(args.url)
