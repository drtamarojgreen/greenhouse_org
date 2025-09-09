
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from tests.bdd_runner import step

@step(r'I am on the videos page')
def given_i_am_on_the_videos_page(context):
    context.driver.get('https://greenhousementalhealth.org/videos/')

@step(r'the page has loaded')
def when_the_page_has_loaded(context):
    WebDriverWait(context.driver, 10).until(
        EC.presence_of_element_located((By.TAG_NAME, 'body'))
    )

@step(r'I should see the main video container')
def then_i_should_see_the_main_video_container(context):
    WebDriverWait(context.driver, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, 'greenhouse-videos-view'))
    )

@step(r'I should see the video grid')
def then_i_should_see_the_video_grid(context):
    WebDriverWait(context.driver, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, 'video-grid-container'))
    )
