from tests.bdd_runner import step_decorator
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def register_steps(registry):
    """
    This function was created to address a syntax error in the original
    projects_steps.py file, which was missing from the repository.
    """
    @step_decorator(registry, r'I should see the project list')
    def then_i_should_see_the_project_list(context):
        """
        This step looks for the project list.
        The original file was missing, but the traceback indicated a syntax
        error in a context.fail() call within this likely step.
        """
        try:
            WebDriverWait(context.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div[data-hook='item-wrapper']"))
            )
        except:
            # The original line had a syntax error. This is the corrected version.
            context.fail("Timeout: Project list 'div[data-hook=\"item-wrapper\"]' not found.")
