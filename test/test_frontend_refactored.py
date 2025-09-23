"""
Comprehensive tests for the live frontend website using the organized test framework.
"""

from base_test import BaseLiveTest
from test_utils import TestAssertions, PerformanceHelper, BrowserConsoleHelper
from selenium.webdriver.common.by import By
import time


class TestFrontendLive(BaseLiveTest):
    """Test class for the live frontend website."""
    
    def test_homepage_title(self):
        """Test that the homepage has the correct title."""
        print("\n--- Testing Homepage Title ---")
        
        expected_title = "Greenhouse for Mental Health | Psychiatrist"
        actual_title = self.driver.title
        
        self.assertEqual(actual_title, expected_title, 
                        f"Expected title '{expected_title}', got '{actual_title}'")
        print(f"✓ Homepage title verified: '{actual_title}'")
    
    def test_homepage_load_performance(self):
        """Test homepage loading performance."""
        print("\n--- Testing Homepage Load Performance ---")
        
        # Measure page load time
        load_time = PerformanceHelper.measure_page_load_time(
            self.driver, "https://greenhousementalhealth.org"
        )
        
        # Page should load within 10 seconds
        self.assertLess(load_time, 10.0, f"Page took too long to load: {load_time:.2f}s")
        print(f"✓ Page loaded in {load_time:.2f} seconds")
        
        # Get performance metrics
        metrics = PerformanceHelper.get_page_performance_metrics(self.driver)
        if metrics:
            print(f"✓ DOM ready time: {metrics['dom_ready_time']:.2f}s")
            print(f"✓ Full page load time: {metrics['page_load_time']:.2f}s")
    
    def test_homepage_console_errors(self):
        """Test that there are no critical console errors."""
        print("\n--- Testing Console Errors ---")
        
        # Wait a moment for any async scripts to load
        time.sleep(3)
        
        logs = BrowserConsoleHelper.get_console_logs(self.driver)
        has_errors, error_logs = BrowserConsoleHelper.check_for_errors(logs)
        
        if has_errors:
            print(f"⚠ Found {len(error_logs)} console errors:")
            for error in error_logs[:5]:  # Show first 5 errors
                print(f"  - {error.get('message', 'Unknown error')}")
            
            # Allow some errors but not too many
            self.assertLess(len(error_logs), 5, 
                           f"Too many console errors: {len(error_logs)}")
        else:
            print("✓ No critical console errors found")
    
    def test_homepage_basic_structure(self):
        """Test basic homepage structure elements."""
        print("\n--- Testing Homepage Basic Structure ---")
        
        # Check for common page elements
        elements_to_check = [
            ('header', 'Header section'),
            ('nav', 'Navigation menu'),
            ('main', 'Main content area'),
            ('footer', 'Footer section')
        ]
        
        found_elements = 0
        for selector, description in elements_to_check:
            element = self.safe_find_element((By.TAG_NAME, selector))
            if element:
                found_elements += 1
                print(f"✓ {description} found")
            else:
                print(f"⚠ {description} not found")
        
        # At least 2 basic elements should be present
        self.assertGreaterEqual(found_elements, 2, 
                               "Homepage missing basic structural elements")
    
    def test_homepage_navigation_links(self):
        """Test that navigation links are present and functional."""
        print("\n--- Testing Navigation Links ---")
        
        # Find navigation links
        nav_links = self.safe_find_elements((By.CSS_SELECTOR, 'nav a, header a'))
        
        if not nav_links:
            # Try alternative selectors
            nav_links = self.safe_find_elements((By.CSS_SELECTOR, 'a[href]'))
        
        self.assertGreater(len(nav_links), 0, "No navigation links found")
        print(f"✓ Found {len(nav_links)} navigation links")
        
        # Check link validity
        valid_links = 0
        for i, link in enumerate(nav_links[:10]):  # Check first 10 links
            href = link.get_attribute('href')
            text = link.text.strip()
            
            if href and (href.startswith('http') or href.startswith('/')):
                valid_links += 1
                print(f"  ✓ Link {i+1}: '{text}' -> Valid")
            else:
                print(f"  ⚠ Link {i+1}: '{text}' -> Invalid href: {href}")
        
        # At least 80% of links should be valid
        if nav_links:
            valid_rate = valid_links / min(len(nav_links), 10)
            self.assertGreaterEqual(valid_rate, 0.8, 
                                   f"Only {valid_rate:.1%} of links are valid")
    
    def test_homepage_images(self):
        """Test that images load properly and have alt text."""
        print("\n--- Testing Homepage Images ---")
        
        # Find all images
        images = self.safe_find_elements((By.TAG_NAME, 'img'))
        
        if not images:
            print("ℹ No images found on homepage")
            return
        
        print(f"Found {len(images)} images")
        
        images_with_alt = 0
        images_with_src = 0
        
        for i, img in enumerate(images):
            # Check src attribute
            src = img.get_attribute('src')
            if src and len(src) > 0:
                images_with_src += 1
            
            # Check alt attribute
            alt = img.get_attribute('alt')
            if alt and len(alt.strip()) > 0:
                images_with_alt += 1
                print(f"  ✓ Image {i+1} has alt text: '{alt[:50]}...'")
            else:
                print(f"  ⚠ Image {i+1} missing alt text")
        
        # All images should have src
        self.assertEqual(images_with_src, len(images), 
                        "Some images missing src attribute")
        
        # At least 70% should have alt text
        alt_rate = images_with_alt / len(images) if images else 0
        self.assertGreaterEqual(alt_rate, 0.7, 
                               f"Only {alt_rate:.1%} of images have alt text")
        
        print(f"✓ {images_with_src}/{len(images)} images have src")
        print(f"✓ {images_with_alt}/{len(images)} images have alt text")
    
    def test_homepage_responsive_design(self):
        """Test homepage responsive design."""
        print("\n--- Testing Responsive Design ---")
        
        # Test different viewport sizes
        viewports = [
            (1920, 1080, "Desktop"),
            (768, 1024, "Tablet"),
            (375, 667, "Mobile")
        ]
        
        for width, height, device in viewports:
            print(f"  Testing {device} viewport ({width}x{height})")
            self.driver.set_window_size(width, height)
            time.sleep(2)  # Wait for layout to adjust
            
            # Check that page is still functional
            body = self.safe_find_element((By.TAG_NAME, 'body'))
            self.assertIsNotNone(body, f"Page not rendering on {device}")
            
            # Check that content is visible (not hidden by overflow)
            body_rect = body.rect
            self.assertGreater(body_rect['height'], 100, 
                             f"Page content too short on {device}")
            
            print(f"    ✓ Page functional on {device}")
        
        # Reset to default size
        self.driver.set_window_size(1920, 1080)
    
    def test_homepage_forms(self):
        """Test any forms present on the homepage."""
        print("\n--- Testing Homepage Forms ---")
        
        # Find forms
        forms = self.safe_find_elements((By.TAG_NAME, 'form'))
        
        if not forms:
            print("ℹ No forms found on homepage")
            return
        
        print(f"Found {len(forms)} forms")
        
        for i, form in enumerate(forms):
            print(f"  Testing Form {i+1}:")
            
            # Check for action attribute
            action = form.get_attribute('action')
            if action:
                print(f"    ✓ Has action: {action}")
            else:
                print(f"    ⚠ Missing action attribute")
            
            # Check for method attribute
            method = form.get_attribute('method')
            if method:
                print(f"    ✓ Has method: {method}")
            else:
                print(f"    ℹ Using default method (GET)")
            
            # Check for input fields
            inputs = form.find_elements(By.TAG_NAME, 'input')
            textareas = form.find_elements(By.TAG_NAME, 'textarea')
            selects = form.find_elements(By.TAG_NAME, 'select')
            
            total_fields = len(inputs) + len(textareas) + len(selects)
            print(f"    ✓ Has {total_fields} form fields")
            
            # Check for submit button
            submit_buttons = form.find_elements(By.CSS_SELECTOR, 'input[type="submit"], button[type="submit"], button:not([type])')
            if submit_buttons:
                print(f"    ✓ Has submit button")
            else:
                print(f"    ⚠ No submit button found")
    
    def test_homepage_accessibility_basics(self):
        """Test basic accessibility features."""
        print("\n--- Testing Basic Accessibility ---")
        
        # Check for page language
        html_element = self.safe_find_element((By.TAG_NAME, 'html'))
        if html_element:
            lang = html_element.get_attribute('lang')
            if lang:
                print(f"✓ Page language set: {lang}")
            else:
                print("⚠ Page language not set")
        
        # Check for skip links
        skip_links = self.safe_find_elements((By.CSS_SELECTOR, 'a[href^="#"]'))
        skip_link_texts = [link.text.lower() for link in skip_links]
        has_skip_link = any('skip' in text for text in skip_link_texts)
        
        if has_skip_link:
            print("✓ Skip navigation link found")
        else:
            print("⚠ No skip navigation link found")
        
        # Check for headings hierarchy
        headings = self.safe_find_elements((By.CSS_SELECTOR, 'h1, h2, h3, h4, h5, h6'))
        if headings:
            h1_count = len([h for h in headings if h.tag_name.lower() == 'h1'])
            print(f"✓ Found {len(headings)} headings ({h1_count} h1 elements)")
            
            # Should have exactly one h1
            if h1_count == 1:
                print("✓ Proper h1 usage (exactly one)")
            else:
                print(f"⚠ Improper h1 usage: {h1_count} h1 elements")
        else:
            print("⚠ No headings found")


class TestFrontendOffline(BaseLiveTest):
    """Test class for offline/local frontend testing."""
    
    def setUp(self):
        """Set up for offline testing."""
        # Override parent setUp to not load live site
        from base_test import BaseSeleniumTest
        BaseSeleniumTest.setUp(self)
        # Don't load any site initially
    
    def test_local_file_loading(self):
        """Test that local HTML files can be loaded."""
        print("\n--- Testing Local File Loading ---")
        
        # Test loading a simple HTML file
        test_files = ['books.html', 'news.html', 'videos.html', 'schedule.html']
        
        for filename in test_files:
            try:
                self.load_local_file(filename)
                title = self.driver.title
                print(f"✓ {filename} loaded successfully (title: '{title}')")
            except Exception as e:
                print(f"⚠ {filename} failed to load: {e}")


if __name__ == '__main__':
    import unittest
    unittest.main()
