import os
from selenium.webdriver.common.by import By
from base_test import BaseSeleniumTest

class TestSchedulerRendering(BaseSeleniumTest):
    """
    Tests the rendering of the static JavaScript scheduler component.
    """

    def setUp(self):
        """
        Set up the test environment by loading the test page
        and injecting the necessary configuration.
        """
        super().setUp()

        # Construct a robust path to the test HTML file, relative to this script's location
        current_script_path = os.path.abspath(__file__)
        legacy_test_dir = os.path.dirname(current_script_path)
        tests_dir = os.path.dirname(legacy_test_dir)
        repo_root = os.path.dirname(tests_dir)
        html_file_path = os.path.join(repo_root, 'docs', 'test_dependency_loading.html')

        # Check if the file exists before attempting to load
        if not os.path.exists(html_file_path):
            self.fail(f"Test file not found at: {html_file_path}")

        file_url = f'file://{html_file_path}'
        self.driver.get(file_url)

        # Use execute_async_script to load the scheduler and wait for its initialization promise to resolve.
        self.driver.execute_async_script("""
            const callback = arguments[arguments.length - 1];

            window._greenhouseScriptAttributes = {
                "schedulerSelectors": {
                    "dashboardLeft": "#dashboard-left",
                    "dashboardRight": "#dashboard-right",
                    "repeaterLeft": "#repeater-left",
                    "repeaterRight": "#repeater-right"
                },
                "baseUrl": "../../docs/"
            };

            const schedulerScript = document.createElement('script');
            schedulerScript.src = 'js/scheduler.js';
            schedulerScript.onload = () => {
                // Now that the script is loaded, wait for the promise it exposes
                window.schedulerPromise.then(() => {
                    callback(); // Signal to Selenium that initialization is complete
                }).catch(err => {
                    console.error("Error during scheduler initialization:", err);
                    callback({error: err.toString()});
                });
            };
            document.body.appendChild(schedulerScript);
        """)

    def test_scheduler_renders_calendar_grid(self):
        """
        Verify that the scheduler correctly renders the main container
        and the calendar grid with day cells.
        """
        print("\\n--- Testing Scheduler Rendering ---")

        # 1. Wait for the main scheduler container to be present
        scheduler_container = self.wait_for_visible(
            (By.ID, "greenhouse-patient-app-calendar-container"),
            timeout=15
        )
        self.assertIsNotNone(scheduler_container, "Scheduler container did not render.")
        print("SUCCESS: Scheduler container is visible.")

        # 2. Verify the calendar table is rendered within the container
        calendar_table = scheduler_container.find_element(By.TAG_NAME, "table")
        self.assertIsNotNone(calendar_table, "Calendar table not found within the scheduler container.")
        print("SUCCESS: Calendar table found.")

        # 3. Verify that the calendar has day headers
        day_headers = calendar_table.find_elements(By.CLASS_NAME, "greenhouse-dashboard-app-calendar-day-header")
        self.assertEqual(len(day_headers), 7, f"Expected 7 day headers, but found {len(day_headers)}.")
        print("SUCCESS: Found 7 day headers.")

        # 4. Verify that the calendar has day cells
        day_cells = calendar_table.find_elements(By.CLASS_NAME, "greenhouse-dashboard-app-calendar-day-cell")
        self.assertGreater(len(day_cells), 27, f"Expected at least 28 day cells, but found {len(day_cells)}.")
        print(f"SUCCESS: Found {len(day_cells)} day cells.")

        # 5. Take a screenshot for visual confirmation
        self.take_screenshot("scheduler_rendering_test.png")
        print("SUCCESS: Screenshot taken for visual verification.")

if __name__ == '__main__':
    import unittest
    unittest.main()