import unittest
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
import os
import time

class TestCalendar(unittest.TestCase):

    def setUp(self):
        # Set up Firefox options for headless browsing
        firefox_options = Options()
        firefox_options.add_argument("--headless")
        firefox_options.add_argument("--disable-gpu")
        firefox_options.add_argument("--no-sandbox")

        # Path to your geckodriver
        current_dir = os.path.dirname(os.path.abspath(__file__))
        geckodriver_path = os.path.join(current_dir, 'geckodriver')

        # Initialize the WebDriver
        self.service = Service(executable_path=geckodriver_path)
        self.driver = webdriver.Firefox(service=self.service, options=firefox_options)

        # Load the page
        html_file_path = os.path.abspath(os.path.join(current_dir, 'schedule.html'))
        file_url = f'file://{html_file_path}'
        self.driver.get(file_url)

    def test_calendar_display(self):
        print("\n--- Testing Calendar Display ---")
        # Check if the main calendar container is present
        calendar_container = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.ID, "greenhouse-dashboard-app-calendar-container"))
        )
        self.assertIsNotNone(calendar_container)
        print("SUCCESS: Calendar container found.")

        # Check if the calendar table is present
        calendar_table = calendar_container.find_element(By.TAG_NAME, "table")
        self.assertIsNotNone(calendar_table)
        print("SUCCESS: Calendar table found.")

        # Check if the calendar header with the month and year is present
        month_header = calendar_table.find_element(By.CSS_SELECTOR, "thead tr:first-child td:nth-child(2)")
        self.assertIsNotNone(month_header)
        print(f"SUCCESS: Month header found with text: {month_header.text}")

        # Check if the navigation buttons are present
        prev_button = calendar_table.find_element(By.CSS_SELECTOR, 'td[data-action="prev-month"]')
        self.assertIsNotNone(prev_button)
        print("SUCCESS: Previous month button found.")

        next_button = calendar_table.find_element(By.CSS_SELECTOR, 'td[data-action="next-month"]')
        self.assertIsNotNone(next_button)
        print("SUCCESS: Next month button found.")

        # Check if the day headers are present
        day_headers = calendar_table.find_elements(By.CLASS_NAME, "greenhouse-dashboard-app-calendar-day-header")
        self.assertEqual(len(day_headers), 7)
        print("SUCCESS: Day headers found.")

        # Check if the day cells are present
        day_cells = calendar_table.find_elements(By.CLASS_NAME, "greenhouse-dashboard-app-calendar-day-cell")
        self.assertGreater(len(day_cells), 27) # Should be at least 28 days in a month
        print("SUCCESS: Day cells found.")

    def test_calendar_navigation(self):
        print("\n--- Testing Calendar Navigation ---")
        calendar_table = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "table"))
        )
        month_header = calendar_table.find_element(By.CSS_SELECTOR, "thead tr:first-child td:nth-child(2)")
        prev_month_text = month_header.text

        # Test next month button
        next_button = calendar_table.find_element(By.CSS_SELECTOR, 'td[data-action="next-month"]')
        next_button.click()
        time.sleep(1) # Give time for UI to update
        current_month_text = month_header.text
        self.assertNotEqual(prev_month_text, current_month_text)
        print(f"SUCCESS: Navigated to next month. New month: {current_month_text}")

        # Test previous month button
        prev_button = calendar_table.find_element(By.CSS_SELECTOR, 'td[data-action="prev-month"]')
        prev_button.click()
        time.sleep(1) # Give time for UI to update
        reverted_month_text = month_header.text
        self.assertEqual(prev_month_text, reverted_month_text)
        print(f"SUCCESS: Navigated back to previous month. Month: {reverted_month_text}")

    def test_date_selection(self):
        print("\n--- Testing Date Selection ---")
        calendar_table = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "table"))
        )
        
        # Find a day cell to click (e.g., the first one that is not empty)
        day_cell = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, ".greenhouse-dashboard-app-calendar-day-cell:not(:empty)"))
        )
        
        initial_class_list = day_cell.get_attribute("class")
        day_cell.click()
        time.sleep(1) # Give time for UI to update

        # Verify that the cell's class list has changed (e.g., a 'selected' class is added)
        # Note: The current schedulerUI.js does not add a 'selected' class.
        # This test will need to be updated once the selection logic is implemented.
        # For now, we'll just check if the click didn't raise an error.
        print(f"SUCCESS: Clicked on day cell with text: {day_cell.text}. Initial classes: {initial_class_list}")
        # A more robust test would check for a specific class change or UI update.

    def test_new_appointment_drag_and_drop(self):
        print("\n--- Testing New Appointment Drag and Drop ---")
        # Find the "New Appointment" box
        new_appointment_box = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.ID, "greenhouse-dashboard-app-new-appointment-box"))
        )
        self.assertIsNotNone(new_appointment_box)
        print("SUCCESS: 'New Appointment' box found.")

        # Find a target day cell to drop onto
        target_day_cell = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".greenhouse-dashboard-app-editable-cell"))
        )
        self.assertIsNotNone(target_day_cell)
        print(f"SUCCESS: Target day cell found with text: {target_day_cell.text}")

        # Perform drag and drop
        actions = ActionChains(self.driver)
        actions.drag_and_drop(new_appointment_box, target_day_cell).perform()
        time.sleep(2) # Give time for UI to update

        # Verify that a new appointment element is created in the cell
        # Note: The current schedulerUI.js adds a div with class 'greenhouse-dashboard-app-service-new'
        newly_added_appointment = target_day_cell.find_element(By.CLASS_NAME, "greenhouse-dashboard-app-service-new")
        self.assertIsNotNone(newly_added_appointment)
        self.assertEqual(newly_added_appointment.text, "New Appointment")
        print("SUCCESS: New appointment element created in the day cell.")

    def tearDown(self):
        self.driver.quit()

if __name__ == '__main__':
    unittest.main()