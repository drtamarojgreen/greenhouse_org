"""
Utility functions and helpers for Selenium tests in the Greenhouse Mental Health project.
"""

import os
import json
import time
from typing import List, Dict, Any, Optional
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException


class TestDataManager:
    """Manages test data and configuration."""
    
    @staticmethod
    def load_test_config(config_file='test_config.json'):
        """Load test configuration from JSON file."""
        config_path = os.path.join(os.path.dirname(__file__), config_file)
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                return json.load(f)
        return {}
    
    @staticmethod
    def get_test_urls():
        """Get test URLs configuration."""
        return {
            'live_site': 'https://greenhousementalhealth.org',
            'staging': 'https://staging.greenhousementalhealth.org',
            'local': 'http://localhost:3000'
        }
    
    @staticmethod
    def get_test_data_for_app(app_name):
        """Get test data specific to an app."""
        test_data = {
            'books': {
                'expected_elements': ['title', 'author', 'cover_image'],
                'min_items': 1,
                'required_classes': ['book']
            },
            'news': {
                'expected_elements': ['title', 'date', 'description'],
                'min_items': 1,
                'required_classes': ['greenhouse-news-item']
            },
            'videos': {
                'expected_elements': ['title', 'player', 'description'],
                'min_items': 1,
                'required_classes': ['greenhouse-video-item']
            }
        }
        return test_data.get(app_name, {})


class ElementLocators:
    """Common element locators used across tests."""
    
    # Main containers
    APP_CONTAINER = (By.CSS_SELECTOR, '#greenhouse-app-container')
    
    # Navigation elements
    NAV_MENU = (By.CSS_SELECTOR, 'nav')
    NAV_LINKS = (By.CSS_SELECTOR, 'nav a')
    
    # Common form elements
    SUBMIT_BUTTON = (By.CSS_SELECTOR, 'button[type="submit"]')
    CANCEL_BUTTON = (By.CSS_SELECTOR, 'button[type="button"]')
    
    # Calendar elements
    CALENDAR_CONTAINER = (By.ID, 'greenhouse-dashboard-app-calendar-container')
    CALENDAR_TABLE = (By.CSS_SELECTOR, '#greenhouse-dashboard-app-calendar-container table')
    CALENDAR_PREV_BUTTON = (By.CSS_SELECTOR, 'td[data-action="prev-month"]')
    CALENDAR_NEXT_BUTTON = (By.CSS_SELECTOR, 'td[data-action="next-month"]')
    CALENDAR_DAY_CELLS = (By.CLASS_NAME, 'greenhouse-dashboard-app-calendar-day-cell')
    
    # App-specific locators
    @staticmethod
    def get_app_locators(app_name):
        """Get locators specific to an app."""
        locators = {
            'books': {
                'view': (By.CSS_SELECTOR, '.greenhouse-books-view'),
                'content': (By.CSS_SELECTOR, '.greenhouse-books-content'),
                'list': (By.ID, 'books-list'),
                'items': (By.CLASS_NAME, 'book')
            },
            'news': {
                'view': (By.CSS_SELECTOR, '.greenhouse-news-view'),
                'content': (By.CSS_SELECTOR, '.greenhouse-news-content'),
                'list': (By.ID, 'news-list'),
                'items': (By.CLASS_NAME, 'greenhouse-news-item')
            },
            'videos': {
                'view': (By.CSS_SELECTOR, '.greenhouse-videos-view'),
                'content': (By.CSS_SELECTOR, '.greenhouse-videos-content'),
                'list': (By.ID, 'videos-list'),
                'items': (By.CLASS_NAME, 'greenhouse-video-item')
            }
        }
        return locators.get(app_name, {})


class TestAssertions:
    """Custom assertion helpers for common test patterns."""
    
    @staticmethod
    def assert_element_has_text(test_case, element, expected_text, exact_match=True):
        """Assert that an element contains expected text."""
        actual_text = element.text.strip()
        if exact_match:
            test_case.assertEqual(actual_text, expected_text,
                                f"Expected '{expected_text}', got '{actual_text}'")
        else:
            test_case.assertIn(expected_text, actual_text,
                             f"Expected '{expected_text}' to be in '{actual_text}'")
    
    @staticmethod
    def assert_element_has_attribute(test_case, element, attribute, expected_value):
        """Assert that an element has a specific attribute value."""
        actual_value = element.get_attribute(attribute)
        test_case.assertEqual(actual_value, expected_value,
                            f"Expected {attribute}='{expected_value}', got '{actual_value}'")
    
    @staticmethod
    def assert_element_is_visible(test_case, element):
        """Assert that an element is visible."""
        test_case.assertTrue(element.is_displayed(), "Element should be visible")
    
    @staticmethod
    def assert_element_count(test_case, elements, expected_count, comparison='equal'):
        """Assert element count with different comparison options."""
        actual_count = len(elements)
        if comparison == 'equal':
            test_case.assertEqual(actual_count, expected_count,
                                f"Expected {expected_count} elements, got {actual_count}")
        elif comparison == 'greater':
            test_case.assertGreater(actual_count, expected_count,
                                  f"Expected more than {expected_count} elements, got {actual_count}")
        elif comparison == 'less':
            test_case.assertLess(actual_count, expected_count,
                               f"Expected less than {expected_count} elements, got {actual_count}")


class WaitHelpers:
    """Helper functions for waiting on various conditions."""
    
    @staticmethod
    def wait_for_page_load(driver, timeout=30):
        """Wait for page to fully load."""
        WebDriverWait(driver, timeout).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
    
    @staticmethod
    def wait_for_ajax_complete(driver, timeout=30):
        """Wait for AJAX requests to complete (jQuery)."""
        try:
            WebDriverWait(driver, timeout).until(
                lambda d: d.execute_script("return jQuery.active == 0")
            )
        except:
            # jQuery might not be available
            pass
    
    @staticmethod
    def wait_for_element_count(driver, locator, expected_count, timeout=30):
        """Wait for a specific number of elements to be present."""
        def check_count(driver):
            elements = driver.find_elements(*locator)
            return len(elements) == expected_count
        
        WebDriverWait(driver, timeout).until(check_count)
    
    @staticmethod
    def wait_for_text_in_element(driver, locator, text, timeout=30):
        """Wait for specific text to appear in an element."""
        WebDriverWait(driver, timeout).until(
            EC.text_to_be_present_in_element(locator, text)
        )


class ScreenshotManager:
    """Manages screenshot capture and organization."""
    
    def __init__(self, base_path=None):
        self.base_path = base_path or os.path.join(os.path.dirname(__file__), 'screenshots')
        os.makedirs(self.base_path, exist_ok=True)
    
    def take_screenshot(self, driver, test_name, step_name=None):
        """Take a screenshot with organized naming."""
        timestamp = int(time.time())
        if step_name:
            filename = f"{test_name}_{step_name}_{timestamp}.png"
        else:
            filename = f"{test_name}_{timestamp}.png"
        
        filepath = os.path.join(self.base_path, filename)
        driver.save_screenshot(filepath)
        return filepath
    
    def take_failure_screenshot(self, driver, test_name):
        """Take a screenshot when a test fails."""
        return self.take_screenshot(driver, test_name, "FAILURE")


class BrowserConsoleHelper:
    """Helper for working with browser console logs."""
    
    @staticmethod
    def get_console_logs(driver):
        """Get browser console logs safely."""
        try:
            return driver.get_log('browser')
        except Exception as e:
            print(f"Warning: Could not retrieve console logs: {e}")
            return []
    
    @staticmethod
    def filter_logs_by_level(logs, level='SEVERE'):
        """Filter logs by severity level."""
        return [log for log in logs if log['level'] == level]
    
    @staticmethod
    def check_for_errors(logs):
        """Check if there are any error-level logs."""
        error_logs = BrowserConsoleHelper.filter_logs_by_level(logs, 'SEVERE')
        return len(error_logs) > 0, error_logs
    
    @staticmethod
    def print_console_logs(logs, max_logs=10):
        """Print console logs in a readable format."""
        print(f"\n--- Console Logs ({len(logs)} total) ---")
        for i, log in enumerate(logs[:max_logs]):
            timestamp = log.get('timestamp', 'N/A')
            level = log.get('level', 'N/A')
            message = log.get('message', 'N/A')
            print(f"{i+1}. [{level}] {message}")
        
        if len(logs) > max_logs:
            print(f"... and {len(logs) - max_logs} more logs")
        print("--- End Console Logs ---\n")


class TestReporter:
    """Generates test reports and summaries."""
    
    def __init__(self, output_dir=None):
        self.output_dir = output_dir or os.path.join(os.path.dirname(__file__), 'reports')
        os.makedirs(self.output_dir, exist_ok=True)
        self.test_results = []
    
    def add_test_result(self, test_name, status, duration, details=None):
        """Add a test result to the report."""
        result = {
            'test_name': test_name,
            'status': status,
            'duration': duration,
            'timestamp': time.time(),
            'details': details or {}
        }
        self.test_results.append(result)
    
    def generate_html_report(self, filename='test_report.html'):
        """Generate an HTML test report."""
        html_content = self._generate_html_content()
        report_path = os.path.join(self.output_dir, filename)
        
        with open(report_path, 'w') as f:
            f.write(html_content)
        
        return report_path
    
    def _generate_html_content(self):
        """Generate HTML content for the report."""
        passed = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed = len([r for r in self.test_results if r['status'] == 'FAIL'])
        total = len(self.test_results)
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Greenhouse Test Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .summary {{ background: #f5f5f5; padding: 15px; border-radius: 5px; }}
                .pass {{ color: green; }}
                .fail {{ color: red; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
            </style>
        </head>
        <body>
            <h1>Greenhouse Mental Health - Test Report</h1>
            <div class="summary">
                <h2>Summary</h2>
                <p>Total Tests: {total}</p>
                <p class="pass">Passed: {passed}</p>
                <p class="fail">Failed: {failed}</p>
                <p>Success Rate: {(passed/total*100) if total > 0 else 0:.1f}%</p>
            </div>
            
            <h2>Test Results</h2>
            <table>
                <tr>
                    <th>Test Name</th>
                    <th>Status</th>
                    <th>Duration (s)</th>
                    <th>Timestamp</th>
                </tr>
        """
        
        for result in self.test_results:
            status_class = 'pass' if result['status'] == 'PASS' else 'fail'
            timestamp = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(result['timestamp']))
            html += f"""
                <tr>
                    <td>{result['test_name']}</td>
                    <td class="{status_class}">{result['status']}</td>
                    <td>{result['duration']:.2f}</td>
                    <td>{timestamp}</td>
                </tr>
            """
        
        html += """
            </table>
        </body>
        </html>
        """
        
        return html


class PerformanceHelper:
    """Helper for performance testing and monitoring."""
    
    @staticmethod
    def measure_page_load_time(driver, url):
        """Measure page load time."""
        start_time = time.time()
        driver.get(url)
        WaitHelpers.wait_for_page_load(driver)
        end_time = time.time()
        return end_time - start_time
    
    @staticmethod
    def get_page_performance_metrics(driver):
        """Get performance metrics from the browser."""
        try:
            navigation_timing = driver.execute_script("""
                var timing = window.performance.timing;
                return {
                    'navigationStart': timing.navigationStart,
                    'domContentLoadedEventEnd': timing.domContentLoadedEventEnd,
                    'loadEventEnd': timing.loadEventEnd
                };
            """)
            
            if navigation_timing['loadEventEnd'] > 0:
                dom_ready_time = navigation_timing['domContentLoadedEventEnd'] - navigation_timing['navigationStart']
                page_load_time = navigation_timing['loadEventEnd'] - navigation_timing['navigationStart']
                
                return {
                    'dom_ready_time': dom_ready_time / 1000,  # Convert to seconds
                    'page_load_time': page_load_time / 1000
                }
        except Exception as e:
            print(f"Could not get performance metrics: {e}")
        
        return None
