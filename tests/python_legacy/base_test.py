"""
Base test class for Selenium tests in the Greenhouse Mental Health project.
Provides common setup, teardown, and utility methods for all test classes.
"""

import unittest
import os
import time
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import WebDriverException, TimeoutException


class BaseSeleniumTest(unittest.TestCase):
    """
    Base class for all Selenium tests providing common functionality.
    """
    
    # Class-level configuration
    DEFAULT_TIMEOUT = 20
    IMPLICIT_WAIT = 10
    
    def setUp(self):
        """Set up the WebDriver with common configuration."""
        self.setup_driver()
        self.setup_test_environment()
    
    def tearDown(self):
        """Clean up after each test."""
        if hasattr(self, 'driver') and self.driver:
            self.driver.quit()
    
    def setup_driver(self):
        """Initialize the Firefox WebDriver with standard options."""
        # Set up Firefox options for headless browsing
        self.firefox_options = Options()
        self.firefox_options.add_argument("--headless")
        self.firefox_options.add_argument("--disable-gpu")
        self.firefox_options.add_argument("--no-sandbox")
        self.firefox_options.add_argument("--window-size=1920,1080")
        
        # Path to geckodriver
        current_dir = os.path.dirname(os.path.abspath(__file__))
        geckodriver_path = os.path.join(current_dir, 'geckodriver')
        
        # Initialize the WebDriver
        service = Service(executable_path=geckodriver_path)
        self.driver = webdriver.Firefox(service=service, options=self.firefox_options)
        self.driver.implicitly_wait(self.IMPLICIT_WAIT)
    
    def setup_test_environment(self):
        """Set up test-specific environment. Override in subclasses."""
        pass
    
    def load_local_file(self, filename):
        """Load a local HTML file for testing."""
        current_dir = os.path.dirname(os.path.abspath(__file__))
        html_file_path = os.path.join(current_dir, filename)
        file_url = f'file://{html_file_path}'
        
        print(f"Loading: {file_url}")
        self.driver.get(file_url)
        return file_url
    
    def load_live_site(self, url="https://greenhousementalhealth.org"):
        """Load the live website for testing."""
        print(f"Loading: {url}")
        self.driver.get(url)
        return url
    
    def wait_for_element(self, locator, timeout=None):
        """Wait for an element to be present."""
        timeout = timeout or self.DEFAULT_TIMEOUT
        return WebDriverWait(self.driver, timeout).until(
            EC.presence_of_element_located(locator)
        )
    
    def wait_for_clickable(self, locator, timeout=None):
        """Wait for an element to be clickable."""
        timeout = timeout or self.DEFAULT_TIMEOUT
        return WebDriverWait(self.driver, timeout).until(
            EC.element_to_be_clickable(locator)
        )
    
    def wait_for_visible(self, locator, timeout=None):
        """Wait for an element to be visible."""
        timeout = timeout or self.DEFAULT_TIMEOUT
        return WebDriverWait(self.driver, timeout).until(
            EC.visibility_of_element_located(locator)
        )
    
    def safe_find_element(self, locator, timeout=None):
        """Safely find an element with timeout, return None if not found."""
        try:
            return self.wait_for_element(locator, timeout)
        except TimeoutException:
            return None
    
    def safe_find_elements(self, locator):
        """Safely find multiple elements, return empty list if none found."""
        try:
            return self.driver.find_elements(*locator)
        except Exception:
            return []
    
    def scroll_to_element(self, element):
        """Scroll to make an element visible."""
        self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
        time.sleep(0.5)  # Brief pause for scroll to complete
    
    def take_screenshot(self, filename=None):
        """Take a screenshot for debugging purposes."""
        if not filename:
            timestamp = int(time.time())
            filename = f"screenshot_{timestamp}.png"
        
        screenshot_path = os.path.join(os.path.dirname(__file__), 'screenshots', filename)
        os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)
        
        self.driver.save_screenshot(screenshot_path)
        print(f"Screenshot saved: {screenshot_path}")
        return screenshot_path
    
    def get_console_logs(self):
        """Attempt to retrieve browser console logs."""
        try:
            return self.driver.get_log('browser')
        except WebDriverException as e:
            print(f"Warning: Could not retrieve console logs: {e}")
            return []
    
    def verify_element_structure(self, parent_element, expected_children):
        """
        Verify that a parent element contains expected child elements.
        
        Args:
            parent_element: The parent WebElement
            expected_children: List of tuples (locator_type, locator_value, description)
        """
        for locator_type, locator_value, description in expected_children:
            try:
                child = parent_element.find_element(locator_type, locator_value)
                self.assertIsNotNone(child, f"{description} not found")
                print(f"✓ {description} found")
            except Exception as e:
                self.fail(f"{description} not found: {e}")
    
    def verify_text_content(self, element, expected_text, exact_match=True):
        """Verify element text content."""
        actual_text = element.text.strip()
        if exact_match:
            self.assertEqual(actual_text, expected_text, 
                           f"Expected '{expected_text}', got '{actual_text}'")
        else:
            self.assertIn(expected_text, actual_text, 
                         f"Expected '{expected_text}' to be in '{actual_text}'")
    
    def verify_attribute(self, element, attribute, expected_value):
        """Verify element attribute value."""
        actual_value = element.get_attribute(attribute)
        self.assertEqual(actual_value, expected_value,
                        f"Expected {attribute}='{expected_value}', got '{actual_value}'")
    
    def perform_drag_and_drop(self, source_element, target_element):
        """Perform drag and drop action."""
        actions = ActionChains(self.driver)
        actions.drag_and_drop(source_element, target_element).perform()
        time.sleep(1)  # Allow time for UI to update


class BaseAppTest(BaseSeleniumTest):
    """
    Base class for testing individual app components.
    Provides common patterns for app structure verification.
    """
    
    # Override these in subclasses
    APP_NAME = None
    APP_VIEW_CLASS = None
    APP_CONTENT_CLASS = None
    APP_LIST_ID = None
    APP_ITEM_CLASS = None
    EXPECTED_TITLE = None
    EXPECTED_INTRO_TEXT = None
    
    def setUp(self):
        """Set up for app testing."""
        super().setUp()
        if self.APP_NAME:
            self.load_local_file(f'{self.APP_NAME}.html')
    
    def test_app_structure(self):
        """Test the basic structure of the app."""
        print(f"\n--- Testing {self.APP_NAME or 'App'} Structure ---")
        
        # Verify main app container
        app_container = self.wait_for_element((By.CSS_SELECTOR, '#greenhouse-app-container'))
        self.assertIsNotNone(app_container, "Main app container not found")
        print("✓ Main app container found")
        
        # Verify app view
        if self.APP_VIEW_CLASS:
            app_view = app_container.find_element(By.CSS_SELECTOR, f'.{self.APP_VIEW_CLASS}')
            self.assertIsNotNone(app_view, f"{self.APP_VIEW_CLASS} not found")
            print(f"✓ {self.APP_VIEW_CLASS} found")
        
        # Verify app content
        if self.APP_CONTENT_CLASS:
            app_content = app_view.find_element(By.CSS_SELECTOR, f'.{self.APP_CONTENT_CLASS}')
            self.assertIsNotNone(app_content, f"{self.APP_CONTENT_CLASS} not found")
            print(f"✓ {self.APP_CONTENT_CLASS} found")
        
        # Verify title
        if self.EXPECTED_TITLE:
            h2_title = app_content.find_element(By.TAG_NAME, 'h2')
            self.verify_text_content(h2_title, self.EXPECTED_TITLE)
            print(f"✓ Title verified: '{self.EXPECTED_TITLE}'")
        
        # Verify intro text
        if self.EXPECTED_INTRO_TEXT:
            intro_paragraph = app_content.find_element(
                By.XPATH, f'./p[contains(text(), "{self.EXPECTED_INTRO_TEXT}")]'
            )
            self.assertIsNotNone(intro_paragraph, "Introductory paragraph not found")
            print("✓ Introductory paragraph found")
        
        # Verify list container
        if self.APP_LIST_ID:
            list_container = app_content.find_element(By.ID, self.APP_LIST_ID)
            self.assertIsNotNone(list_container, f"List container #{self.APP_LIST_ID} not found")
            print(f"✓ List container #{self.APP_LIST_ID} found")
        
        print(f"✓ {self.APP_NAME or 'App'} structure verification complete")
    
    def test_app_items(self):
        """Test the items within the app."""
        if not (self.APP_LIST_ID and self.APP_ITEM_CLASS):
            self.skipTest("App items test not configured")
        
        print(f"\n--- Testing {self.APP_NAME or 'App'} Items ---")
        
        # Wait for items to load
        self.wait_for_element((By.CSS_SELECTOR, f'#{self.APP_LIST_ID} .{self.APP_ITEM_CLASS}'))
        
        # Get all items
        list_container = self.driver.find_element(By.ID, self.APP_LIST_ID)
        items = list_container.find_elements(By.CLASS_NAME, self.APP_ITEM_CLASS)
        
        self.assertGreater(len(items), 0, f"No {self.APP_ITEM_CLASS} elements found")
        print(f"✓ Found {len(items)} {self.APP_ITEM_CLASS} elements")
        
        # Verify each item structure
        for i, item in enumerate(items):
            print(f"  Verifying Item {i+1} structure:")
            self.verify_item_structure(item, i+1)
        
        print(f"✓ All {self.APP_NAME or 'App'} items verified")
    
    def verify_item_structure(self, item, item_number):
        """Override this method in subclasses to verify specific item structure."""
        pass


class BaseLiveTest(BaseSeleniumTest):
    """
    Base class for testing the live website.
    """
    
    def setUp(self):
        """Set up for live site testing."""
        super().setUp()
        self.load_live_site()
    
    def test_page_load(self):
        """Test that the page loads successfully."""
        self.assertIn("Greenhouse", self.driver.title)
        print(f"✓ Page loaded successfully: {self.driver.title}")
