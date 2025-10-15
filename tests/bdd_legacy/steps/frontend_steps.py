from tests.bdd_runner import step
from selenium.webdriver.common.by import By

@step(r'I am on the books page')
def i_am_on_books_page(test_case):
    test_case.driver.get('file:///home/tamarojgreen/development/LLM/greenhouse_org/test/books.html')

@step(r'I look at the main content')
def i_look_at_main_content(test_case):
    pass

@step(r'I should see the main books container')
def i_should_see_main_books_container(test_case):
    test_case.driver.find_element(By.ID, 'comp-lkk99t8i')

@step(r'I should see a list of books')
def i_should_see_list_of_books(test_case):
    test_case.driver.find_element(By.ID, 'comp-lkk99t8i1')
