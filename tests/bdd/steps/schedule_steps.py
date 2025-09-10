from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from tests.bdd_runner import step_decorator

def register_steps(registry):
    @step_decorator(registry, r'I am on the schedule page')
    def given_i_am_on_the_schedule_page(context):
        context.driver.get('https://greenhousementalhealth.org/schedule/')

    @step_decorator(registry, r'I should see the scheduling form')
    def then_i_should_see_the_scheduling_form(context):
        WebDriverWait(context.driver, 20).until(
            EC.presence_of_element_located((By.TAG_NAME, 'form'))
        )