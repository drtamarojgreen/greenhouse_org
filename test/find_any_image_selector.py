
import argparse
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.common.by import By
import os

def get_selector(element):
    # Prioritize attributes for selector generation
    if element.get_attribute("alt"):
        return f'img[alt="{element.get_attribute("alt")}"]'
    if element.get_attribute("data-testid"):
        return f'img[data-testid="{element.get_attribute("data-testid")}"]'
    if element.get_attribute("src"):
        # Use a portion of the src to keep it manageable
        src_parts = element.get_attribute("src").split('/')[-2:]
        src_selector = 'img[src*="' + '/'.join(src_parts) + '"]'
        return src_selector
    # Fallback to a more generic selector if no good attributes are found
    return f"img[class='{element.get_attribute('class')}']"

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

        # Find all images on the page
        images = driver.find_elements(By.TAG_NAME, "img")
        print(f"Found {len(images)} images on the page.")

        print("\n--- Image Selectors ---")
        for image in images:
            selector = get_selector(image)
            print(selector)
        print("-----------------------")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Find all image selectors on a given page.')
    parser.add_argument('url', type=str, help='The URL of the page to scan.')
    args = parser.parse_args()

    run_test(args.url)
