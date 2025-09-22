from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from tests.bdd_runner import step_decorator
from selenium.common.exceptions import TimeoutException

def register_steps(registry):
    @step_decorator(registry, r'I am on the books page')
    def given_i_am_on_the_books_page(context):
        context.driver.get('https://greenhousementalhealth.org/books/')

    @step_decorator(registry, r'I should see the main books container')
    def then_i_should_see_the_main_books_container(context):
        try:
            # Based on Books.js, the main element is the repeater.
            WebDriverWait(context.driver, 10).until(
                EC.presence_of_element_located((By.ID, 'booksRepeater'))
            )
        except TimeoutException:
            context.fail("Timeout: Main books container '#booksRepeater' not found.")

    @step_decorator(registry, r'I should see the book list')
    def then_i_should_see_the_book_list(context):
        try:
            # Based on Books.js, the list of books is a repeater with ID 'booksRepeater'.
            WebDriverWait(context.driver, 10).until(
                EC.presence_of_element_located((By.ID, 'booksRepeater'))
            )
        except TimeoutException:
            context.fail("Timeout: Book list '#booksRepeater' not found.")