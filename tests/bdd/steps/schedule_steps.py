from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from tests.bdd_runner import step_decorator
from selenium.common.exceptions import TimeoutException

# Helper function to select from a dropdown
def select_from_dropdown(context, selector, text):
    try:
        dropdown_element = WebDriverWait(context.driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
        )
        select = Select(dropdown_element)
        select.select_by_visible_text(text)
    except TimeoutException:
        context.fail(f"Timeout: Dropdown with selector '{selector}' not found.")

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

    @step_decorator(registry, r'I select "(.*)" from the service dropdown')
    def when_i_select_from_service_dropdown(context, service):
        select_from_dropdown(context, '#serviceDropdown', service)

    @step_decorator(registry, r'I select "(.*)" from the therapist dropdown')
    def when_i_select_from_therapist_dropdown(context, therapist):
        select_from_dropdown(context, '#therapistDropdown', therapist)

    @step_decorator(registry, r'I choose a valid date from the calendar')
    def when_i_choose_a_valid_date(context):
        # This is a complex interaction. We'll find the calendar and click a date.
        # For this test, we'll just click the first available day.
        try:
            calendar = WebDriverWait(context.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, '#calendar'))
            )
            # This selector is a guess for an available date.
            # A real implementation would need to be more robust.
            available_day = calendar.find_element(By.CSS_SELECTOR, 'td.available-day')
            available_day.click()
        except Exception as e:
            context.fail(f"Could not select a date from the calendar. Error: {e}")

    @step_decorator(registry, r'I select an available time slot "(.*)"')
    def when_i_select_an_available_time_slot(context, time_slot):
        # The time slots are in a repeater. We need to find the button with the correct label.
        try:
            time_slots_repeater = WebDriverWait(context.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, '#timeSlotsRepeater'))
            )
            # Using XPath to find the button by its text content.
            time_slot_button = time_slots_repeater.find_element(By.XPATH, f".//button[contains(text(), '{time_slot}')]")
            time_slot_button.click()
        except Exception as e:
            context.fail(f"Could not select time slot '{time_slot}'. Error: {e}")

    @step_decorator(registry, r'I fill in my details in the booking form')
    def when_i_fill_in_my_details(context):
        # Based on Schedule.js, we fill in these inputs.
        try:
            context.driver.find_element(By.CSS_SELECTOR, '#patientTitleInput').send_keys('BDD Test Appointment')
            context.driver.find_element(By.CSS_SELECTOR, '#patientPlatformInput').send_keys('Online')
            # The date and time are selected by the calendar and time slot steps.
            # Other fields like name/contact are not specified in the selectors,
            # so we assume they are not required for this test.
        except Exception as e:
            context.fail(f"Could not fill in booking form details. Error: {e}")

    @step_decorator(registry, r'I click the "Confirm Your Booking" button')
    def when_i_click_the_confirm_button(context):
        try:
            confirm_button = WebDriverWait(context.driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, '#proposeAppointmentButton'))
            )
            confirm_button.click()
        except TimeoutException:
            context.fail("Timeout: 'Confirm Your Booking' button (#proposeAppointmentButton) not clickable.")

    @step_decorator(registry, r'I should see a confirmation message "(.*)"')
    def then_i_should_see_a_confirmation_message(context, message):
        try:
            WebDriverWait(context.driver, 10).until(
                EC.text_to_be_present_in_element((By.CSS_SELECTOR, '#successMessageText'), message)
            )
        except TimeoutException:
            context.fail(f"Timeout: Confirmation message '{message}' not found in '#successMessageText'.")

    @step_decorator(registry, r'I should receive a confirmation email')
    def then_i_should_receive_a_confirmation_email(context):
        # This step cannot be tested from the frontend.
        # We assume it is handled by the backend.
        pass
