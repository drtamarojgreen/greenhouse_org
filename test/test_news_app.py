import unittest
import os
import time
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class TestNewsApp(unittest.TestCase):

    def setUp(self):
        # Set up Firefox options for headless browsing
        self.options = Options()
        self.options.add_argument("-headless")
        self.options.add_argument("--disable-gpu") # Recommended for headless
        self.options.add_argument("--no-sandbox") # Recommended for headless

        # Path to your geckodriver
        current_dir = os.path.dirname(os.path.abspath(__file__))
        geckodriver_path = os.path.join(current_dir, 'geckodriver')
        self.service = Service(executable_path=geckodriver_path)

        # Initialize the WebDriver
        self.driver = webdriver.Firefox(service=self.service, options=self.options)

        # Get the absolute path to the HTML file
        html_file_path = os.path.join(current_dir, 'news.html')
        self.html_file_url = f'file://{html_file_path}'

        print(f"\nAttempting to load: {self.html_file_url}")
        self.driver.get(self.html_file_url)

    def test_news_app_structure(self):
        print("\n--- Testing News App Structure ---")

        # 1. Verify main app container
        app_container = WebDriverWait(self.driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '#greenhouse-app-container'))
        )
        self.assertIsNotNone(app_container, "Main app container #greenhouse-app-container not found.")
        print("SUCCESS: Main app container #greenhouse-app-container found.")

        # 2. Verify greenhouse-news-view
        news_view = app_container.find_element(By.CSS_SELECTOR, '.greenhouse-news-view')
        self.assertIsNotNone(news_view, "greenhouse-news-view not found.")
        print("SUCCESS: greenhouse-news-view found.")

        # 3. Verify greenhouse-news-content
        news_content = news_view.find_element(By.CSS_SELECTOR, '.greenhouse-news-content')
        self.assertIsNotNone(news_content, "greenhouse-news-content not found.")
        print("SUCCESS: greenhouse-news-content found.")

        # 4. Verify H2 title
        h2_title = news_content.find_element(By.TAG_NAME, 'h2')
        self.assertIsNotNone(h2_title, "H2 title not found.")
        self.assertEqual(h2_title.text.strip(), "Greenhouse News", "H2 title text is incorrect.")
        print(f"SUCCESS: H2 title found with correct text: '{h2_title.text.strip()}'.")

        # 5. Verify introductory paragraph
        intro_paragraph = news_content.find_element(By.XPATH, './p[contains(text(), "Stay up-to-date with the latest news from Greenhouse Mental Health!")]')
        self.assertIsNotNone(intro_paragraph, "Introductory paragraph not found.")
        print("SUCCESS: Introductory paragraph found.")

        # 6. Verify news-list container
        news_list = news_content.find_element(By.ID, 'news-list')
        self.assertIsNotNone(news_list, "News list container #news-list not found.")
        self.assertTrue(news_list.get_attribute('class').find('greenhouse-layout-container') != -1, "News list container missing greenhouse-layout-container class.")
        print("SUCCESS: News list container #news-list found with correct class.")

        # 7. Wait for and verify news elements
        # We'll wait for a div with class 'greenhouse-news-item' to appear inside #news-list
        WebDriverWait(self.driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '#news-list .greenhouse-news-item'))
        )
        news_elements = news_list.find_elements(By.CLASS_NAME, 'greenhouse-news-item')
        self.assertGreater(len(news_elements), 0, "No news elements found in #news-list.")
        print(f"SUCCESS: Found {len(news_elements)} news elements.")

        # 8. Verify structure of individual news elements
        for i, news_item in enumerate(news_elements):
            print(f"  Verifying News Item {i+1} structure:")
            
            # Verify title
            news_title = news_item.find_element(By.CSS_SELECTOR, 'h3.greenhouse-news-title')
            self.assertIsNotNone(news_title, f"  News Item {i+1}: Title (h3.greenhouse-news-title) not found.")
            self.assertGreater(len(news_title.text.strip()), 0, f"  News Item {i+1}: Title text is empty.")
            print(f"    - Title: '{news_title.text.strip()}'")

            # Verify date
            news_date = news_item.find_element(By.CSS_SELECTOR, 'p.greenhouse-news-date')
            self.assertIsNotNone(news_date, f"  News Item {i+1}: Date (p.greenhouse-news-date) not found.")
            self.assertGreater(len(news_date.text.strip()), 0, f"  News Item {i+1}: Date text is empty.")
            print(f"    - Date: '{news_date.text.strip()}'")

            # Verify description
            news_description = news_item.find_element(By.XPATH, './p[not(@class)]') # Selects p without a class
            self.assertIsNotNone(news_description, f"  News Item {i+1}: Description (p) not found.")
            self.assertGreater(len(news_description.text.strip()), 0, f"  News Item {i+1}: Description text is empty.")
            print(f"    - Description: '{news_description.text.strip()}'")

            # Verify optional "Read More" link
            try:
                read_more_link = news_item.find_element(By.TAG_NAME, 'a')
                self.assertIsNotNone(read_more_link, f"  News Item {i+1}: 'Read More' link (a) not found.")
                self.assertGreater(len(read_more_link.get_attribute('href')), 0, f"  News Item {i+1}: 'Read More' link href is empty.")
                print(f"    - Read More Link: '{read_more_link.get_attribute('href')}'")
            except:
                print(f"    - INFO: News Item {i+1}: 'Read More' link not found (optional).")
        
        print("TEST PASSED: News app structure is comprehensive.")

    def tearDown(self):
        print("\nClosing browser...")
        self.driver.quit()
        print("Browser closed.")

if __name__ == '__main__':
    unittest.main()
