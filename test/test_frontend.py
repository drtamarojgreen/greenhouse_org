from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os

def run_test():
    # Set up Chrome options for headless browsing
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")

    # Path to your demo.html file
    # Assuming the script is run from the project root or 'test' directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    html_file_path = os.path.abspath(os.path.join(current_dir, '..', 'docs', 'demo.html'))
    file_url = f'file://{html_file_path}'

    driver = None
    try:
        # Initialize the WebDriver
        driver = webdriver.Firefox(options=chrome_options, executable_path=os.path.join(current_dir, 'geckodriver'))
        driver.get(file_url)

        print(f"Navigated to: {driver.current_url}")

        # Wait for the admin-container to be present
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "admin-container"))
        )
        print("Admin container found.")

        # Wait for the dashboard-container to be present
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "dashboard-container"))
        )
        print("Dashboard container found.")

        # You can add more assertions here, e.g., check content
        admin_content = driver.find_element(By.ID, "admin-container").text
        dashboard_content = driver.find_element(By.ID, "dashboard-container").text

        print(f"Admin Content:\n{admin_content[:200]}...") # Print first 200 chars
        print(f"Dashboard Content:\n{dashboard_content[:200]}...") # Print first 200 chars

        # Example: Check if a specific element from dashboard is present
        # try:
        #     driver.find_element(By.ID, "new-appointment-box")
        #     print("New appointment box found.")
        # except:
        #     print("New appointment box NOT found.")

        print("Test completed successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    run_test()
