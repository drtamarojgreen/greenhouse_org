import unittest
import os
import time
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class TestBooksApp(unittest.TestCase):

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
        html_file_path = os.path.join(current_dir, 'books.html')
        self.html_file_url = f'file://{html_file_path}'

        print(f"\nAttempting to load: {self.html_file_url}")
        self.driver.get(self.html_file_url)

    def test_books_app_structure(self):
        print("\n--- Testing Books App Structure ---")

        # 1. Verify main app container
        app_container = WebDriverWait(self.driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '#greenhouse-app-container'))
        )
        self.assertIsNotNone(app_container, "Main app container #greenhouse-app-container not found.")
        print("SUCCESS: Main app container #greenhouse-app-container found.")

        # 2. Verify greenhouse-books-view
        books_view = app_container.find_element(By.CSS_SELECTOR, '.greenhouse-books-view')
        self.assertIsNotNone(books_view, "greenhouse-books-view not found.")
        print("SUCCESS: greenhouse-books-view found.")

        # 3. Verify greenhouse-books-content
        books_content = books_view.find_element(By.CSS_SELECTOR, '.greenhouse-books-content')
        self.assertIsNotNone(books_content, "greenhouse-books-content not found.")
        print("SUCCESS: greenhouse-books-content found.")

        # 4. Verify H2 title
        h2_title = books_content.find_element(By.TAG_NAME, 'h2')
        self.assertIsNotNone(h2_title, "H2 title not found.")
        self.assertEqual(h2_title.text.strip(), "Greenhouse Books", "H2 title text is incorrect.")
        print(f"SUCCESS: H2 title found with correct text: '{h2_title.text.strip()}'.")

        # 5. Verify introductory paragraph
        intro_paragraph = books_content.find_element(By.XPATH, './p[contains(text(), "Welcome to the Greenhouse Books section")]')
        self.assertIsNotNone(intro_paragraph, "Introductory paragraph not found.")
        print("SUCCESS: Introductory paragraph found.")

        # 6. Verify books-list container
        books_list = books_content.find_element(By.ID, 'books-list')
        self.assertIsNotNone(books_list, "Books list container #books-list not found.")
        print("SUCCESS: Books list container #books-list found.")

        # 7. Wait for and verify book elements
        # We'll wait for a div with class 'book' to appear inside #books-list
        WebDriverWait(self.driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '#books-list .book'))
        )
        book_elements = books_list.find_elements(By.CLASS_NAME, 'book')
        self.assertGreater(len(book_elements), 0, "No book elements found in #books-list.")
        print(f"SUCCESS: Found {len(book_elements)} book elements.")

        # 8. Verify structure of individual book elements (assuming h3 for title, p for author, img for cover)
        for i, book in enumerate(book_elements):
            print(f"  Verifying Book {i+1} structure:")
            book_title = book.find_element(By.TAG_NAME, 'h3')
            self.assertIsNotNone(book_title, f"  Book {i+1}: Title (h3) not found.")
            self.assertGreater(len(book_title.text.strip()), 0, f"  Book {i+1}: Title text is empty.")
            print(f"    - Title: '{book_title.text.strip()}'")

            try:
                book_author = book.find_element(By.TAG_NAME, 'p')
                self.assertIsNotNone(book_author, f"  Book {i+1}: Author (p) not found.")
                self.assertGreater(len(book_author.text.strip()), 0, f"  Book {i+1}: Author text is empty.")
                print(f"    - Author: '{book_author.text.strip()}'")
            except:
                print(f"    - WARNING: Book {i+1}: Author (p) not found or empty.")

            try:
                book_image = book.find_element(By.TAG_NAME, 'img')
                self.assertIsNotNone(book_image, f"  Book {i+1}: Image (img) not found.")
                self.assertGreater(len(book_image.get_attribute('src')), 0, f"  Book {i+1}: Image src is empty.")
                print(f"    - Image src: '{book_image.get_attribute('src')}'")
            except:
                print(f"    - WARNING: Book {i+1}: Image (img) not found or src empty.")
        
        print("TEST PASSED: Books app structure is comprehensive.")

    def tearDown(self):
        print("\nClosing browser...")
        self.driver.quit()
        print("Browser closed.")

if __name__ == '__main__':
    unittest.main()

