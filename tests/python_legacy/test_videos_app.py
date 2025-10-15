import unittest
import os
import time
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class TestVideosApp(unittest.TestCase):

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
        html_file_path = os.path.join(current_dir, 'videos.html')
        self.html_file_url = f'file://{html_file_path}'

        print(f"\nAttempting to load: {self.html_file_url}")
        self.driver.get(self.html_file_url)

    def test_videos_app_structure(self):
        print("\n--- Testing Videos App Structure ---")

        # 1. Verify main app container
        app_container = WebDriverWait(self.driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '#greenhouse-app-container'))
        )
        self.assertIsNotNone(app_container, "Main app container #greenhouse-app-container not found.")
        print("SUCCESS: Main app container #greenhouse-app-container found.")

        # 2. Verify greenhouse-videos-view
        videos_view = app_container.find_element(By.CSS_SELECTOR, '.greenhouse-videos-view')
        self.assertIsNotNone(videos_view, "greenhouse-videos-view not found.")
        print("SUCCESS: greenhouse-videos-view found.")

        # 3. Verify greenhouse-videos-content
        videos_content = videos_view.find_element(By.CSS_SELECTOR, '.greenhouse-videos-content')
        self.assertIsNotNone(videos_content, "greenhouse-videos-content not found.")
        print("SUCCESS: greenhouse-videos-content found.")

        # 4. Verify H2 title
        h2_title = videos_content.find_element(By.TAG_NAME, 'h2')
        self.assertIsNotNone(h2_title, "H2 title not found.")
        self.assertEqual(h2_title.text.strip(), "Greenhouse Shorts", "H2 title text is incorrect.")
        print(f"SUCCESS: H2 title found with correct text: '{h2_title.text.strip()}'.")

        # 5. Verify introductory paragraph
        intro_paragraph = videos_content.find_element(By.XPATH, './p[contains(text(), "Check out the latest short videos from @greenhousemhd!")]')
        self.assertIsNotNone(intro_paragraph, "Introductory paragraph not found.")
        print("SUCCESS: Introductory paragraph found.")

        # 6. Verify videos-list container
        videos_list = videos_content.find_element(By.ID, 'videos-list')
        self.assertIsNotNone(videos_list, "Videos list container #videos-list not found.")
        self.assertTrue(videos_list.get_attribute('class').find('greenhouse-layout-container') != -1, "Videos list container missing greenhouse-layout-container class.")
        print("SUCCESS: Videos list container #videos-list found with correct class.")

        # 7. Wait for and verify video elements
        # We'll wait for a div with class 'greenhouse-video-item' to appear inside #videos-list
        WebDriverWait(self.driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '#videos-list .greenhouse-video-item'))
        )
        video_elements = videos_list.find_elements(By.CLASS_NAME, 'greenhouse-video-item')
        self.assertGreater(len(video_elements), 0, "No video elements found in #videos-list.")
        print(f"SUCCESS: Found {len(video_elements)} video elements.")

        # 8. Verify structure of individual video elements
        for i, video_item in enumerate(video_elements):
            print(f"  Verifying Video Item {i+1} structure:")
            
            # Verify title
            video_title = video_item.find_element(By.CSS_SELECTOR, 'h3.greenhouse-video-title')
            self.assertIsNotNone(video_title, f"  Video Item {i+1}: Title (h3.greenhouse-video-title) not found.")
            self.assertGreater(len(video_title.text.strip()), 0, f"  Video Item {i+1}: Title text is empty.")
            print(f"    - Title: '{video_title.text.strip()}'")

            # Verify iframe player
            video_player = video_item.find_element(By.CSS_SELECTOR, 'iframe.greenhouse-video-player')
            self.assertIsNotNone(video_player, f"  Video Item {i+1}: Video player (iframe.greenhouse-video-player) not found.")
            self.assertGreater(len(video_player.get_attribute('src')), 0, f"  Video Item {i+1}: Video player src is empty.")
            print(f"    - Player src: '{video_player.get_attribute('src')}'")

            # Verify description
            video_description = video_item.find_element(By.XPATH, './p[not(@class)]') # Selects p without a class
            self.assertIsNotNone(video_description, f"  Video Item {i+1}: Description (p) not found.")
            self.assertGreater(len(video_description.text.strip()), 0, f"  Video Item {i+1}: Description text is empty.")
            print(f"    - Description: '{video_description.text.strip()}'")
        
        print("TEST PASSED: Videos app structure is comprehensive.")

    def tearDown(self):
        print("\nClosing browser...")
        self.driver.quit()
        print("Browser closed.")

if __name__ == '__main__':
    unittest.main()
