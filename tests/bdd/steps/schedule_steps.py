from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from tests.bdd_runner import step_decorator
from selenium.common.exceptions import TimeoutException

def register_steps(registry):
    @step_decorator(registry, r'I am on the schedule page')
    def given_i_am_on_the_schedule_page(context):
        context.driver.get('https://greenhousementalhealth.org/schedule/')

    @step_decorator(registry, r'I should see the main schedule container')
    def then_i_should_see_the_main_schedule_container(context):
        try:
            WebDriverWait(context.driver, 60).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, '#greenhouse-app-container-left'))
            )
        except TimeoutException:
            context.fail("Timeout: Main schedule container '#greenhouse-app-container-left' not found.")

    @step_decorator(registry, r'I should see the administrator dashboard title')
    def then_i_should_see_the_administrator_dashboard_title(context):
        try:
            WebDriverWait(context.driver, 60).until(
                EC.text_to_be_present_in_element((By.CSS_SELECTOR, '#greenhouse-app-container-left > h1'), "Administrator Dashboard: Weekly Schedule & Conflict Resolution")
            )
        except TimeoutException:
            context.fail("Timeout: Administrator Dashboard title not found or text incorrect.")

    @step_decorator(registry, r'I should see the new appointment box')
    def then_i_should_see_the_new_appointment_box(context):
        try:
            WebDriverWait(context.driver, 60).until(
                EC.text_to_be_present_in_element((By.CSS_SELECTOR, '#greenhouse-dashboard-app-new-appointment-box'), "New Appointment")
            )
        except TimeoutException:
            context.fail("Timeout: New Appointment box not found or text incorrect.")

    @step_decorator(registry, r'I should see the weekly schedule title')
    def then_i_should_see_the_weekly_schedule_title(context):
        try:
            WebDriverWait(context.driver, 60).until(
                EC.text_to_be_present_in_element((By.CSS_SELECTOR, '#greenhouse-dashboard-app-schedule-container > h2'), "Weekly Schedule")
            )
        except TimeoutException:
            context.fail("Timeout: Weekly Schedule title not found or text incorrect.")

    @step_decorator(registry, r'I should see the time column header')
    def then_i_should_see_the_time_column_header(context):
        try:
            WebDriverWait(context.driver, 120).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, '#greenhouse-dashboard-app-schedule-container > table > thead > tr > th.time-column-header'))
            )
        except TimeoutException:
            context.fail("Timeout: Time column header not found.")

    @step_decorator(registry, r'I should see the Sunday column header')
    def then_i_should_see_the_sunday_column_header(context):
        try:
            WebDriverWait(context.driver, 120).until(
                EC.text_to_be_present_in_element((By.CSS_SELECTOR, '#greenhouse-dashboard-app-schedule-container > table > thead > tr > th:nth-child(2)'), "Sunday")
            )
        except TimeoutException:
            context.fail("Timeout: Sunday column header not found or text incorrect.")

    @step_decorator(registry, r'I should see the site header')
    def then_i_should_see_the_site_header(context):
        try:
            WebDriverWait(context.driver, 60).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, 'header#SITE_HEADER'))
            )
        except TimeoutException:
            context.fail("Timeout: Site header not found.")

    @step_decorator(registry, r'I should see the site footer')
    def then_i_should_see_the_site_footer(context):
        try:
            WebDriverWait(context.driver, 60).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, 'section#comp-mf2vsemf'))
            )
        except TimeoutException:
            context.fail("Timeout: Site footer not found.")

    @step_decorator(registry, r'I should see the main site container')
    def then_i_should_see_the_main_site_container(context):
        try:
            WebDriverWait(context.driver, 60).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, 'div#SITE_CONTAINER'))
            )
        except TimeoutException:
            context.fail("Timeout: Main site container not found.")
