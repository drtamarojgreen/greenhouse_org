import unittest
import os
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class TestFrontend(unittest.TestCase):
    def setUp(self):
        # Set up Firefox options for headless browsing
        self.firefox_options = Options()
        self.firefox_options.add_argument("--headless")
        self.firefox_options.add_argument("--disable-gpu")
        self.firefox_options.add_argument("--no-sandbox")

        current_dir = os.path.dirname(os.path.abspath(__file__))
        geckodriver_path = os.path.join(current_dir, 'geckodriver')
        
        service = Service(executable_path=geckodriver_path)
        self.driver = webdriver.Firefox(service=service, options=self.firefox_options)
        self.driver.get("https://greenhousementalhealth.org")

    def tearDown(self):
        self.driver.quit()

    def test_homepage_title(self):
        """Test that the homepage has the correct title."""
        self.assertEqual(self.driver.title, "Greenhouse for Mental Health | Psychiatrist")

if __name__ == "__main__":
    unittest.main()