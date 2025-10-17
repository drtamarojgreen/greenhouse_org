
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os

def run_test():
    # Set up Firefox options for headless browsing
    firefox_options = Options()
    firefox_options.add_argument("--headless")
    firefox_options.add_argument("--disable-gpu")
    firefox_options.add_argument("--no-sandbox")

    # Path to your mainpage.html file and geckodriver
    current_dir = os.path.dirname(os.path.abspath(__file__))
    html_file_path = os.path.abspath(os.path.join(current_dir, 'mainpage.html'))
    file_url = f'file://{html_file_path}'
    geckodriver_path = os.path.join(current_dir, 'geckodriver')

    driver = None
    try:
        # Initialize the WebDriver
        service = Service(executable_path=geckodriver_path)
        driver = webdriver.Firefox(service=service, options=firefox_options)
        driver.get(file_url)

        print(f"Navigated to: {driver.current_url}")

        # Find all column strips
        column_strips = driver.find_elements(By.CSS_SELECTOR, "section.wixui-column-strip")
        
        two_column_layout_found = False
        for strip in column_strips:
            columns_container = strip.find_element(By.CSS_SELECTOR, 'div[data-testid="columns"]')
            columns = columns_container.find_elements(By.XPATH, "./div[contains(@class, 'wixui-column-strip__column')]")
            if len(columns) == 2:
                print("Found a two-column layout section.")
                two_column_layout_found = True
                break
        
        if not two_column_layout_found:
            print("Could not find a two-column layout section.")

        print("Test completed successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    run_test()
