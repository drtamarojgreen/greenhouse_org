import argparse
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.common.by import By
import os

def get_wix_classes(element):
    classes = element.get_attribute("class").split()
    return [c for c in classes if c.startswith("wix")]

def get_column_layout(element):
    try:
        columns_container = element.find_element(By.CSS_SELECTOR, ':scope > div[data-testid="columns"]')
        columns = columns_container.find_elements(By.XPATH, "./div[contains(@class, 'wixui-column-strip__column')]")
        return f"{len(columns)} columns"
    except:
        return "N/A"

def print_section_tree(element, indent=0):
    if element.tag_name == "section":
        section_id = element.get_attribute("id")
        wix_classes = ", ".join(get_wix_classes(element))
        column_layout = get_column_layout(element)
        parent = element.find_element(By.XPATH, "..")
        parent_info = f"{parent.tag_name}#{parent.get_attribute('id')}"
        print("  " * indent + f"- Section ID: {section_id}, Parent: {parent_info}, Wix Classes: {wix_classes}, Layout: {column_layout}")

    for child in element.find_elements(By.XPATH, "./*"):
        print_section_tree(child, indent + 1)

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

        print("\n--- Wix Section Tree ---")
        body = driver.find_element(By.TAG_NAME, "body")
        print_section_tree(body)
        print("----------------------")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Show the structure of Wix sections on a given page.')
    parser.add_argument('url', type=str, help='The URL of the page to scan.')
    args = parser.parse_args()

    run_test(args.url)
