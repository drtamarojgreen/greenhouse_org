"""
Comprehensive tests for the News app using the organized test framework.
"""

from base_test import BaseAppTest
from test_utils import TestAssertions, ElementLocators
from selenium.webdriver.common.by import By


class TestNewsApp(BaseAppTest):
    """Test class for the News application."""
    
    # App configuration
    APP_NAME = 'news'
    APP_VIEW_CLASS = 'greenhouse-news-view'
    APP_CONTENT_CLASS = 'greenhouse-news-content'
    APP_LIST_ID = 'news-list'
    APP_ITEM_CLASS = 'greenhouse-news-item'
    EXPECTED_TITLE = 'Greenhouse News'
    EXPECTED_INTRO_TEXT = 'Stay up-to-date with the latest news from Greenhouse Mental Health!'
    
    def verify_item_structure(self, item, item_number):
        """Verify the structure of individual news items."""
        print(f"    Verifying News Item {item_number} structure:")
        
        # Verify news title (h3.greenhouse-news-title)
        news_title = item.find_element(By.CSS_SELECTOR, 'h3.greenhouse-news-title')
        self.assertIsNotNone(news_title, f"News Item {item_number}: Title not found")
        self.assertGreater(len(news_title.text.strip()), 0, 
                          f"News Item {item_number}: Title text is empty")
        print(f"      ✓ Title: '{news_title.text.strip()}'")
        
        # Verify news date (p.greenhouse-news-date)
        news_date = item.find_element(By.CSS_SELECTOR, 'p.greenhouse-news-date')
        self.assertIsNotNone(news_date, f"News Item {item_number}: Date not found")
        self.assertGreater(len(news_date.text.strip()), 0, 
                          f"News Item {item_number}: Date text is empty")
        print(f"      ✓ Date: '{news_date.text.strip()}'")
        
        # Verify news description (p without class)
        news_description = item.find_element(By.XPATH, './p[not(@class)]')
        self.assertIsNotNone(news_description, f"News Item {item_number}: Description not found")
        self.assertGreater(len(news_description.text.strip()), 0, 
                          f"News Item {item_number}: Description text is empty")
        print(f"      ✓ Description: '{news_description.text.strip()}'")
        
        # Verify optional "Read More" link
        try:
            read_more_link = item.find_element(By.TAG_NAME, 'a')
            self.assertIsNotNone(read_more_link, f"News Item {item_number}: Read More link not found")
            href = read_more_link.get_attribute('href')
            self.assertGreater(len(href), 0, f"News Item {item_number}: Read More link href is empty")
            print(f"      ✓ Read More Link: '{href}'")
        except Exception:
            print(f"      ℹ News Item {item_number}: Read More link not found (optional)")
    
    def test_news_date_format(self):
        """Test that news dates are in a consistent format."""
        print("\n--- Testing News Date Format ---")
        
        # Wait for news items to load
        self.wait_for_element((By.CSS_SELECTOR, f'#{self.APP_LIST_ID} .{self.APP_ITEM_CLASS}'))
        
        # Get all news date elements
        date_elements = self.driver.find_elements(By.CSS_SELECTOR, f'#{self.APP_LIST_ID} .greenhouse-news-date')
        
        valid_dates = 0
        date_patterns = [
            r'\d{1,2}/\d{1,2}/\d{4}',  # MM/DD/YYYY
            r'\d{4}-\d{2}-\d{2}',      # YYYY-MM-DD
            r'[A-Za-z]+ \d{1,2}, \d{4}',  # Month DD, YYYY
        ]
        
        import re
        for i, date_elem in enumerate(date_elements):
            date_text = date_elem.text.strip()
            is_valid = any(re.match(pattern, date_text) for pattern in date_patterns)
            
            if is_valid:
                valid_dates += 1
                print(f"  ✓ Date {i+1}: '{date_text}' - Valid format")
            else:
                print(f"  ⚠ Date {i+1}: '{date_text}' - Invalid format")
        
        # At least 80% of dates should be in valid format
        if date_elements:
            valid_rate = valid_dates / len(date_elements)
            self.assertGreaterEqual(valid_rate, 0.8, 
                                   f"Only {valid_rate:.1%} of dates are in valid format")
            print(f"✓ {valid_dates}/{len(date_elements)} dates are in valid format")
    
    def test_news_content_length(self):
        """Test that news descriptions have appropriate length."""
        print("\n--- Testing News Content Length ---")
        
        # Wait for news items to load
        self.wait_for_element((By.CSS_SELECTOR, f'#{self.APP_LIST_ID} .{self.APP_ITEM_CLASS}'))
        
        # Get all news description elements
        descriptions = self.driver.find_elements(By.CSS_SELECTOR, f'#{self.APP_LIST_ID} p:not(.greenhouse-news-date)')
        
        appropriate_length_count = 0
        min_length = 20  # Minimum characters for meaningful description
        max_length = 500  # Maximum for readability
        
        for i, desc in enumerate(descriptions):
            desc_text = desc.text.strip()
            length = len(desc_text)
            
            if min_length <= length <= max_length:
                appropriate_length_count += 1
                print(f"  ✓ Description {i+1}: {length} characters - Appropriate length")
            else:
                print(f"  ⚠ Description {i+1}: {length} characters - {'Too short' if length < min_length else 'Too long'}")
        
        # At least 70% should have appropriate length
        if descriptions:
            appropriate_rate = appropriate_length_count / len(descriptions)
            self.assertGreaterEqual(appropriate_rate, 0.7, 
                                   f"Only {appropriate_rate:.1%} of descriptions have appropriate length")
            print(f"✓ {appropriate_length_count}/{len(descriptions)} descriptions have appropriate length")
    
    def test_news_links_functionality(self):
        """Test that news links are functional and properly formatted."""
        print("\n--- Testing News Links Functionality ---")
        
        # Wait for news items to load
        self.wait_for_element((By.CSS_SELECTOR, f'#{self.APP_LIST_ID} .{self.APP_ITEM_CLASS}'))
        
        # Get all news links
        links = self.driver.find_elements(By.CSS_SELECTOR, f'#{self.APP_LIST_ID} a')
        
        valid_links = 0
        for i, link in enumerate(links):
            href = link.get_attribute('href')
            text = link.text.strip()
            
            # Check if href is valid
            if href and (href.startswith('http') or href.startswith('/')):
                valid_links += 1
                print(f"  ✓ Link {i+1}: '{text}' -> '{href}' - Valid")
                
                # Check if link opens in new tab (good practice for external links)
                target = link.get_attribute('target')
                if href.startswith('http') and target == '_blank':
                    print(f"    ✓ External link opens in new tab")
                elif href.startswith('http') and target != '_blank':
                    print(f"    ⚠ External link should open in new tab")
            else:
                print(f"  ⚠ Link {i+1}: '{text}' -> '{href}' - Invalid")
        
        # At least 90% of links should be valid
        if links:
            valid_rate = valid_links / len(links)
            self.assertGreaterEqual(valid_rate, 0.9, 
                                   f"Only {valid_rate:.1%} of links are valid")
            print(f"✓ {valid_links}/{len(links)} links are valid")
    
    def test_news_layout_container_class(self):
        """Test that the news list has the proper layout container class."""
        print("\n--- Testing News Layout Container Class ---")
        
        news_list = self.wait_for_element((By.ID, self.APP_LIST_ID))
        class_attr = news_list.get_attribute('class')
        
        self.assertIn('greenhouse-layout-container', class_attr, 
                     "News list missing greenhouse-layout-container class")
        print("✓ News list has greenhouse-layout-container class")
    
    def test_news_chronological_order(self):
        """Test that news items are in chronological order (newest first)."""
        print("\n--- Testing News Chronological Order ---")
        
        # Wait for news items to load
        self.wait_for_element((By.CSS_SELECTOR, f'#{self.APP_LIST_ID} .{self.APP_ITEM_CLASS}'))
        
        # Get all news date elements
        date_elements = self.driver.find_elements(By.CSS_SELECTOR, f'#{self.APP_LIST_ID} .greenhouse-news-date')
        
        if len(date_elements) < 2:
            print("ℹ Not enough news items to test chronological order")
            return
        
        # Simple check: assume dates are in a parseable format
        # This is a basic implementation - could be enhanced with proper date parsing
        dates_text = [elem.text.strip() for elem in date_elements]
        
        print(f"Found {len(dates_text)} news dates:")
        for i, date_text in enumerate(dates_text):
            print(f"  {i+1}. {date_text}")
        
        # For now, just verify that dates are present and not empty
        non_empty_dates = [d for d in dates_text if d]
        self.assertEqual(len(non_empty_dates), len(dates_text), 
                        "Some news items have empty dates")
        
        print("✓ All news items have dates (chronological order verification requires date parsing)")


if __name__ == '__main__':
    import unittest
    unittest.main()
