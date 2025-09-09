
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from tests.bdd_runner import step

@step(r'I am on the news page')
def given_i_am_on_the_news_page(context):
    context.driver.get('https://greenhousementalhealth.org/news/')

@step(r'I should see the main news container')
def then_i_should_see_the_main_news_container(context):
    WebDriverWait(context.driver, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, 'greenhouse-news-view'))
    )

@step(r'I should see the news list')
def then_i_should_see_the_news_list(context):
    WebDriverWait(context.driver, 10).until(
        EC.presence_of_element_located((By.ID, 'news-list'))
    )
