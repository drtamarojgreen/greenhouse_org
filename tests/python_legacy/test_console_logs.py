import unittest
import os
import time
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.common.exceptions import WebDriverException

class TestConsoleLogs(unittest.TestCase):

    def setUp(self):
        # Set up Firefox options for headless browsing
        self.options = Options()
        self.options.add_argument("-headless")
        self.options.add_argument("--disable-gpu")
        self.options.add_argument("--no-sandbox")

        # Path to your geckodriver
        current_dir = os.path.dirname(os.path.abspath(__file__))
        geckodriver_path = os.path.join(current_dir, 'geckodriver')
        self.service = Service(executable_path=geckodriver_path)

        # Initialize the WebDriver
        # Note: With modern W3C compliant drivers, get_log('browser') is not officially supported.
        # We will attempt it as it was specifically requested.
        self.driver = webdriver.Firefox(service=self.service, options=self.options)

        # Get the absolute path to the HTML file
        html_file_path = os.path.join(current_dir, 'console_test.html')
        self.html_file_url = f'file://{html_file_path}'

        print(f"\nAttempting to load: {self.html_file_url}")
        self.driver.get(self.html_file_url)
        # Give the script a moment to execute
        time.sleep(2)

    def test_capture_console_logs(self):
        print("\n--- Testing Console Log Capture ---")
        try:
            # Attempt to retrieve browser console logs
            logs = self.driver.get_log('browser')
            print(f"Captured {len(logs)} log entries.")

            # Process and verify logs
            log_messages = [log['message'] for log in logs]

            # For debugging, print all captured messages
            print("--- All Captured Log Messages ---")
            for msg in log_messages:
                print(msg)
            print("---------------------------------")

            # Check for our specific messages
            self.assertTrue(any("This is a log message." in msg for msg in log_messages), "Standard log message not found.")
            print("SUCCESS: Found standard log message.")

            self.assertTrue(any("This is a warning message." in msg for msg in log_messages), "Warning message not found.")
            print("SUCCESS: Found warning message.")

            self.assertTrue(any("This is an error message." in msg for msg in log_messages), "Error message not found.")
            print("SUCCESS: Found error message.")

            self.assertTrue(any("This is an info message." in msg for msg in log_messages), "Info message not found.")
            print("SUCCESS: Found info message.")

            print("\nTEST PASSED: All expected console logs were captured.")

        except WebDriverException as e:
            # This will happen if get_log('browser') is not supported by the driver
            print(f"\nERROR: Could not retrieve browser logs. The method `get_log('browser')` may not be supported in this Selenium/geckodriver version.")
            print(f"Exception: {e}")
            self.fail("Failed to retrieve browser logs. `get_log('browser')` is likely unsupported.")

    def tearDown(self):
        print("\nClosing browser...")
        self.driver.quit()
        print("Browser closed.")

if __name__ == '__main__':
    unittest.main()
