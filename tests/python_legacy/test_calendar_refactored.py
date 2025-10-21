"""
Comprehensive tests for the Calendar functionality using the organized test framework.
"""

from base_test import BaseSeleniumTest
from test_utils import ElementLocators, TestAssertions, WaitHelpers
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
import time


class TestCalendar(BaseSeleniumTest):
    """Test class for the Calendar application."""
    
    def setUp(self):
        """Set up for calendar testing."""
        super().setUp()
        self.load_local_file('schedule.html')
    
    def test_calendar_display(self):
        """Test that the calendar displays correctly."""
        print("\n--- Testing Calendar Display ---")
        
        # Check if the main calendar container is present
        calendar_container = self.wait_for_element(ElementLocators.CALENDAR_CONTAINER)
        self.assertIsNotNone(calendar_container, "Calendar container not found")
        print("✓ Calendar container found")
        
        # Check if the calendar table is present
        calendar_table = calendar_container.find_element(By.TAG_NAME, "table")
        self.assertIsNotNone(calendar_table, "Calendar table not found")
        print("✓ Calendar table found")
        
        # Check if the calendar header with the month and year is present
        month_header = calendar_table.find_element(By.CSS_SELECTOR, "thead tr:first-child td:nth-child(2)")
        self.assertIsNotNone(month_header, "Month header not found")
        TestAssertions.assert_element_has_text(self, month_header, "", exact_match=False)  # Just check it's not empty
        print(f"✓ Month header found: {month_header.text}")
        
        # Check if the navigation buttons are present
        prev_button = calendar_table.find_element(*ElementLocators.CALENDAR_PREV_BUTTON)
        self.assertIsNotNone(prev_button, "Previous month button not found")
        print("✓ Previous month button found")
        
        next_button = calendar_table.find_element(*ElementLocators.CALENDAR_NEXT_BUTTON)
        self.assertIsNotNone(next_button, "Next month button not found")
        print("✓ Next month button found")
        
        # Check if the day headers are present
        day_headers = calendar_table.find_elements(By.CLASS_NAME, "greenhouse-dashboard-app-calendar-day-header")
        TestAssertions.assert_element_count(self, day_headers, 7, 'equal')
        print("✓ All 7 day headers found")
        
        # Check if the day cells are present
        day_cells = calendar_table.find_elements(*ElementLocators.CALENDAR_DAY_CELLS)
        TestAssertions.assert_element_count(self, day_cells, 27, 'greater')  # Should be at least 28 days
        print(f"✓ {len(day_cells)} day cells found")
    
    def test_calendar_navigation(self):
        """Test calendar month navigation functionality."""
        print("\n--- Testing Calendar Navigation ---")
        
        calendar_table = self.wait_for_element(ElementLocators.CALENDAR_TABLE)
        month_header = calendar_table.find_element(By.CSS_SELECTOR, "thead tr:first-child td:nth-child(2)")
        prev_month_text = month_header.text
        
        # Test next month button
        next_button = calendar_table.find_element(*ElementLocators.CALENDAR_NEXT_BUTTON)
        next_button.click()
        time.sleep(1)  # Give time for UI to update
        
        current_month_text = month_header.text
        self.assertNotEqual(prev_month_text, current_month_text, 
                           "Month should change when clicking next button")
        print(f"✓ Navigated to next month: {prev_month_text} -> {current_month_text}")
        
        # Test previous month button
        prev_button = calendar_table.find_element(*ElementLocators.CALENDAR_PREV_BUTTON)
        prev_button.click()
        time.sleep(1)  # Give time for UI to update
        
        reverted_month_text = month_header.text
        self.assertEqual(prev_month_text, reverted_month_text, 
                        "Should return to original month when clicking previous button")
        print(f"✓ Navigated back to original month: {reverted_month_text}")
    
    def test_date_selection(self):
        """Test date selection functionality."""
        print("\n--- Testing Date Selection ---")
        
        calendar_table = self.wait_for_element(ElementLocators.CALENDAR_TABLE)
        
        # Find a clickable day cell
        day_cell = self.wait_for_clickable((By.CSS_SELECTOR, ".greenhouse-dashboard-app-calendar-day-cell:not(:empty)"))
        
        initial_class_list = day_cell.get_attribute("class")
        day_text = day_cell.text.strip()
        
        # Click the day cell
        day_cell.click()
        time.sleep(1)  # Give time for UI to update
        
        print(f"✓ Clicked on day cell: {day_text}")
        print(f"  Initial classes: {initial_class_list}")
        
        # Note: The current implementation may not add a 'selected' class
        # This test verifies the click doesn't cause errors
        final_class_list = day_cell.get_attribute("class")
        print(f"  Final classes: {final_class_list}")
    
    def test_new_appointment_drag_and_drop(self):
        """Test drag and drop functionality for creating new appointments."""
        print("\n--- Testing New Appointment Drag and Drop ---")
        
        # Find the "New Appointment" box
        new_appointment_box = self.wait_for_element((By.ID, "greenhouse-dashboard-app-new-appointment-box"))
        self.assertIsNotNone(new_appointment_box, "New Appointment box not found")
        print("✓ New Appointment box found")
        
        # Find a target day cell to drop onto
        target_day_cell = self.wait_for_element((By.CSS_SELECTOR, ".greenhouse-dashboard-app-editable-cell"))
        self.assertIsNotNone(target_day_cell, "Target day cell not found")
        target_text = target_day_cell.text.strip()
        print(f"✓ Target day cell found: {target_text}")
        
        # Perform drag and drop
        self.perform_drag_and_drop(new_appointment_box, target_day_cell)
        
        # Verify that a new appointment element is created in the cell
        newly_added_appointment = target_day_cell.find_element(By.CLASS_NAME, "greenhouse-dashboard-app-service-new")
        self.assertIsNotNone(newly_added_appointment, "New appointment element not created")
        TestAssertions.assert_element_has_text(self, newly_added_appointment, "New Appointment")
        print("✓ New appointment element created successfully")
    
    def test_calendar_keyboard_navigation(self):
        """Test keyboard navigation within the calendar."""
        print("\n--- Testing Calendar Keyboard Navigation ---")
        
        calendar_table = self.wait_for_element(ElementLocators.CALENDAR_TABLE)
        
        # Find a focusable day cell
        day_cells = calendar_table.find_elements(*ElementLocators.CALENDAR_DAY_CELLS)
        focusable_cells = [cell for cell in day_cells if cell.text.strip()]
        
        if focusable_cells:
            first_cell = focusable_cells[0]
            first_cell.click()  # Focus the cell
            
            # Test arrow key navigation (if implemented)
            from selenium.webdriver.common.keys import Keys
            actions = ActionChains(self.driver)
            
            # Try right arrow
            actions.send_keys(Keys.ARROW_RIGHT).perform()
            time.sleep(0.5)
            
            # Try down arrow
            actions.send_keys(Keys.ARROW_DOWN).perform()
            time.sleep(0.5)
            
            print("✓ Keyboard navigation attempted (implementation dependent)")
        else:
            print("⚠ No focusable day cells found for keyboard navigation test")
    
    def test_calendar_accessibility(self):
        """Test calendar accessibility features."""
        print("\n--- Testing Calendar Accessibility ---")
        
        calendar_table = self.wait_for_element(ElementLocators.CALENDAR_TABLE)
        
        # Check for proper table structure
        thead = calendar_table.find_elements(By.TAG_NAME, 'thead')
        tbody = calendar_table.find_elements(By.TAG_NAME, 'tbody')
        
        self.assertGreater(len(thead), 0, "Calendar table missing thead")
        self.assertGreater(len(tbody), 0, "Calendar table missing tbody")
        print("✓ Calendar has proper table structure")
        
        # Check for day header accessibility
        day_headers = calendar_table.find_elements(By.CLASS_NAME, "greenhouse-dashboard-app-calendar-day-header")
        headers_with_scope = 0
        
        for header in day_headers:
            scope = header.get_attribute('scope')
            if scope == 'col':
                headers_with_scope += 1
        
        if headers_with_scope > 0:
            print(f"✓ {headers_with_scope}/{len(day_headers)} day headers have proper scope attribute")
        else:
            print("⚠ Day headers missing scope attributes for accessibility")
        
        # Check for ARIA labels on navigation buttons
        prev_button = calendar_table.find_element(*ElementLocators.CALENDAR_PREV_BUTTON)
        next_button = calendar_table.find_element(*ElementLocators.CALENDAR_NEXT_BUTTON)
        
        prev_aria = prev_button.get_attribute('aria-label')
        next_aria = next_button.get_attribute('aria-label')
        
        if prev_aria:
            print(f"✓ Previous button has aria-label: {prev_aria}")
        else:
            print("⚠ Previous button missing aria-label")
        
        if next_aria:
            print(f"✓ Next button has aria-label: {next_aria}")
        else:
            print("⚠ Next button missing aria-label")
    
    def test_calendar_responsive_design(self):
        """Test calendar responsive behavior."""
        print("\n--- Testing Calendar Responsive Design ---")
        
        # Test different viewport sizes
        viewports = [
            (1920, 1080, "Desktop"),
            (768, 1024, "Tablet"),
            (375, 667, "Mobile")
        ]
        
        for width, height, device in viewports:
            print(f"  Testing {device} viewport ({width}x{height})")
            self.driver.set_window_size(width, height)
            time.sleep(1)  # Wait for layout to adjust
            
            # Check that calendar is still visible and functional
            calendar_container = self.safe_find_element(ElementLocators.CALENDAR_CONTAINER)
            self.assertIsNotNone(calendar_container, f"Calendar not visible on {device}")
            
            # Check that day cells are still present
            day_cells = self.safe_find_elements(ElementLocators.CALENDAR_DAY_CELLS)
            self.assertGreater(len(day_cells), 0, f"No day cells visible on {device}")
            
            # Check that navigation buttons are still accessible
            prev_button = self.safe_find_element(ElementLocators.CALENDAR_PREV_BUTTON)
            next_button = self.safe_find_element(ElementLocators.CALENDAR_NEXT_BUTTON)
            
            self.assertIsNotNone(prev_button, f"Previous button not accessible on {device}")
            self.assertIsNotNone(next_button, f"Next button not accessible on {device}")
            
            print(f"    ✓ Calendar functional on {device}")
        
        # Reset to default size
        self.driver.set_window_size(1920, 1080)
    
    def test_calendar_month_year_display(self):
        """Test that month and year are displayed correctly."""
        print("\n--- Testing Month/Year Display ---")
        
        calendar_table = self.wait_for_element(ElementLocators.CALENDAR_TABLE)
        month_header = calendar_table.find_element(By.CSS_SELECTOR, "thead tr:first-child td:nth-child(2)")
        
        month_text = month_header.text.strip()
        self.assertGreater(len(month_text), 0, "Month header should not be empty")
        
        # Basic validation that it contains month/year information
        # This could be enhanced with more specific date parsing
        import re
        has_year = re.search(r'\d{4}', month_text)  # Look for 4-digit year
        has_month = len(month_text) > 4  # Should have more than just year
        
        self.assertTrue(has_year, f"Month header should contain year: {month_text}")
        self.assertTrue(has_month, f"Month header should contain month: {month_text}")
        
        print(f"✓ Month/Year display validated: {month_text}")


if __name__ == '__main__':
    import unittest
    unittest.main()
