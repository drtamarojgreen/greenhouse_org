from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from tests.bdd_runner import step_decorator

def register_steps(registry):
    @step_decorator(registry, r'the page has loaded')
    def when_the_page_has_loaded(context):
        WebDriverWait(context.driver, 10).until(
            lambda driver: driver.execute_script('return document.readyState') == 'complete'
        )