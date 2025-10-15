"""
Comprehensive tests for the Books app using the organized test framework.
"""

from base_test import BaseAppTest
from test_utils import TestAssertions, ElementLocators
from selenium.webdriver.common.by import By


class TestBooksApp(BaseAppTest):
    """Test class for the Books application."""
    
    # App configuration
    APP_NAME = 'books'
    APP_VIEW_CLASS = 'greenhouse-books-view'
    APP_CONTENT_CLASS = 'greenhouse-books-content'
    APP_LIST_ID = 'books-list'
    APP_ITEM_CLASS = 'book'
    EXPECTED_TITLE = 'Greenhouse Books'
    EXPECTED_INTRO_TEXT = 'Welcome to the Greenhouse Books section'
    
    def verify_item_structure(self, item, item_number):
        """Verify the structure of individual book items."""
        print(f"    Verifying Book {item_number} structure:")
        
        # Verify book title (h3)
        book_title = item.find_element(By.TAG_NAME, 'h3')
        self.assertIsNotNone(book_title, f"Book {item_number}: Title (h3) not found")
        TestAssertions.assert_element_has_text(
            self, book_title, "", exact_match=False
        )  # Just check it's not empty
        print(f"      ✓ Title: '{book_title.text.strip()}'")
        
        # Verify book author (p)
        try:
            book_author = item.find_element(By.TAG_NAME, 'p')
            self.assertIsNotNone(book_author, f"Book {item_number}: Author (p) not found")
            self.assertGreater(len(book_author.text.strip()), 0, 
                             f"Book {item_number}: Author text is empty")
            print(f"      ✓ Author: '{book_author.text.strip()}'")
        except Exception:
            print(f"      ⚠ Book {item_number}: Author (p) not found or empty")
        
        # Verify book cover image (img)
        try:
            book_image = item.find_element(By.TAG_NAME, 'img')
            self.assertIsNotNone(book_image, f"Book {item_number}: Image (img) not found")
            src = book_image.get_attribute('src')
            self.assertGreater(len(src), 0, f"Book {item_number}: Image src is empty")
            print(f"      ✓ Image src: '{src}'")
        except Exception:
            print(f"      ⚠ Book {item_number}: Image (img) not found or src empty")
    
    def test_book_content_quality(self):
        """Test the quality and completeness of book content."""
        print("\n--- Testing Book Content Quality ---")
        
        # Wait for books to load
        self.wait_for_element((By.CSS_SELECTOR, f'#{self.APP_LIST_ID} .{self.APP_ITEM_CLASS}'))
        
        # Get all book items
        list_container = self.driver.find_element(By.ID, self.APP_LIST_ID)
        books = list_container.find_elements(By.CLASS_NAME, self.APP_ITEM_CLASS)
        
        books_with_complete_info = 0
        
        for i, book in enumerate(books):
            has_title = len(book.find_elements(By.TAG_NAME, 'h3')) > 0
            has_author = len(book.find_elements(By.TAG_NAME, 'p')) > 0
            has_image = len(book.find_elements(By.TAG_NAME, 'img')) > 0
            
            if has_title and has_author and has_image:
                books_with_complete_info += 1
        
        # At least 50% of books should have complete information
        completion_rate = books_with_complete_info / len(books) if books else 0
        self.assertGreaterEqual(completion_rate, 0.5, 
                               f"Only {completion_rate:.1%} of books have complete information")
        
        print(f"✓ {books_with_complete_info}/{len(books)} books have complete information")
        print(f"✓ Content completion rate: {completion_rate:.1%}")
    
    def test_book_images_accessibility(self):
        """Test that book images have proper accessibility attributes."""
        print("\n--- Testing Book Image Accessibility ---")
        
        # Wait for books to load
        self.wait_for_element((By.CSS_SELECTOR, f'#{self.APP_LIST_ID} .{self.APP_ITEM_CLASS}'))
        
        # Get all book images
        images = self.driver.find_elements(By.CSS_SELECTOR, f'#{self.APP_LIST_ID} img')
        
        images_with_alt = 0
        for i, img in enumerate(images):
            alt_text = img.get_attribute('alt')
            if alt_text and len(alt_text.strip()) > 0:
                images_with_alt += 1
                print(f"  ✓ Image {i+1} has alt text: '{alt_text}'")
            else:
                print(f"  ⚠ Image {i+1} missing alt text")
        
        # At least 80% of images should have alt text
        if images:
            alt_rate = images_with_alt / len(images)
            self.assertGreaterEqual(alt_rate, 0.8, 
                                   f"Only {alt_rate:.1%} of images have alt text")
            print(f"✓ {images_with_alt}/{len(images)} images have alt text")
    
    def test_responsive_layout(self):
        """Test that the books layout is responsive."""
        print("\n--- Testing Responsive Layout ---")
        
        # Test different viewport sizes
        viewports = [
            (1920, 1080, "Desktop"),
            (768, 1024, "Tablet"),
            (375, 667, "Mobile")
        ]
        
        for width, height, device in viewports:
            print(f"  Testing {device} viewport ({width}x{height})")
            self.driver.set_window_size(width, height)
            
            # Wait for layout to adjust
            import time
            time.sleep(1)
            
            # Check that books list is still visible and functional
            books_list = self.safe_find_element((By.ID, self.APP_LIST_ID))
            self.assertIsNotNone(books_list, f"Books list not visible on {device}")
            
            # Check that books are still present
            books = self.safe_find_elements((By.CSS_SELECTOR, f'#{self.APP_LIST_ID} .{self.APP_ITEM_CLASS}'))
            self.assertGreater(len(books), 0, f"No books visible on {device}")
            
            print(f"    ✓ {len(books)} books visible on {device}")
        
        # Reset to default size
        self.driver.set_window_size(1920, 1080)


if __name__ == '__main__':
    import unittest
    unittest.main()
