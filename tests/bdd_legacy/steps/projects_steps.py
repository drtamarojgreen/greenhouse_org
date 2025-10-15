from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from tests.bdd_runner import step_decorator
from selenium.common.exceptions import TimeoutException

def register_steps(registry):
    @step_decorator(registry, r'I am on the projects page')
    def given_i_am_on_the_projects_page(context):
        context.driver.get('https://greenhousementalhealth.org/projects/')

    @step_decorator(registry, r'I should see the main projects container')
    def then_i_should_see_the_main_projects_container(context):
        try:
            WebDriverWait(context.driver, 30).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, 'div#comp-meyk99t4'))
            )
        except TimeoutException:
            context.fail("Timeout: Main projects container 'div#comp-meyk99t4' not found.")

    @step_decorator(registry, r'I should see the projects title')
    def then_i_should_see_the_projects_title(context):
        try:
            WebDriverWait(context.driver, 30).until(
                EC.text_to_be_present_in_element((By.TAG_NAME, 'h1'), "Projects!")
            )
        except TimeoutException:
            context.fail("Timeout: Projects title not found or text incorrect.")

    @step_decorator(registry, r'I should see the project list')
    def then_i_should_see_the_project_list(context):
        try:
            WebDriverWait(context.driver, 30).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, 'div[data-hook="item-wrapper"]'))
            )
        except TimeoutException:
            context.fail("""Timeout: Project list 'div[data-hook="item-wrapper"]' not found.""")

