
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from tests.bdd_runner import step_decorator
from selenium.common.exceptions import TimeoutException

def register_steps(registry):
    @step_decorator(registry, r'I am on the videos page')
    def given_i_am_on_the_videos_page(context):
        context.driver.get('https://greenhousementalhealth.org/videos/')

    @step_decorator(registry, r'the page has loaded')
    def when_the_page_has_loaded(context):
        WebDriverWait(context.driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, 'body'))
        )

    @step_decorator(registry, r'I should see the main video container')
    def then_i_should_see_the_main_video_container(context):
        try:
            WebDriverWait(context.driver, 30).until(
                EC.presence_of_element_located((By.CLASS_NAME, 'greenhouse-videos-view'))
            )
        except TimeoutException:
            context.fail("Timeout: Main video container 'greenhouse-videos-view' not found.")

    @step_decorator(registry, r'I should see the video grid')
    def then_i_should_see_the_video_grid(context):
        WebDriverWait(context.driver, 20).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'video-grid-container'))
        )
