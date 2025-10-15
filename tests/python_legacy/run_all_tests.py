"""
Test suite runner for all Selenium tests in the Greenhouse Mental Health project.
Provides organized test execution with reporting and configuration options.
"""

import unittest
import sys
import os
import time
from test_utils import TestReporter, ScreenshotManager

# Add the test directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import all test classes
from test_books_app_refactored import TestBooksApp
from test_news_app_refactored import TestNewsApp
from test_videos_app_refactored import TestVideosApp
from test_calendar_refactored import TestCalendar
from test_frontend_refactored import TestFrontendLive, TestFrontendOffline


class TestSuiteRunner:
    """Manages and executes test suites with reporting."""
    
    def __init__(self):
        self.reporter = TestReporter()
        self.screenshot_manager = ScreenshotManager()
        self.test_results = []
    
    def create_app_test_suite(self):
        """Create test suite for app components."""
        suite = unittest.TestSuite()
        
        # Add app tests
        suite.addTest(unittest.makeSuite(TestBooksApp))
        suite.addTest(unittest.makeSuite(TestNewsApp))
        suite.addTest(unittest.makeSuite(TestVideosApp))
        
        return suite
    
    def create_calendar_test_suite(self):
        """Create test suite for calendar functionality."""
        suite = unittest.TestSuite()
        suite.addTest(unittest.makeSuite(TestCalendar))
        return suite
    
    def create_frontend_test_suite(self):
        """Create test suite for frontend/live site testing."""
        suite = unittest.TestSuite()
        suite.addTest(unittest.makeSuite(TestFrontendLive))
        return suite
    
    def create_offline_test_suite(self):
        """Create test suite for offline/local testing."""
        suite = unittest.TestSuite()
        suite.addTest(unittest.makeSuite(TestFrontendOffline))
        return suite
    
    def create_full_test_suite(self):
        """Create comprehensive test suite with all tests."""
        suite = unittest.TestSuite()
        
        # Add all test suites
        suite.addTest(self.create_app_test_suite())
        suite.addTest(self.create_calendar_test_suite())
        suite.addTest(self.create_offline_test_suite())
        # Note: Frontend live tests are separate due to network dependency
        
        return suite
    
    def run_test_suite(self, suite, suite_name="Test Suite"):
        """Run a test suite with custom result handling."""
        print(f"\n{'='*60}")
        print(f"Running {suite_name}")
        print(f"{'='*60}")
        
        # Create custom test result handler
        result = unittest.TestResult()
        
        start_time = time.time()
        suite.run(result)
        end_time = time.time()
        
        duration = end_time - start_time
        
        # Process results
        total_tests = result.testsRun
        failures = len(result.failures)
        errors = len(result.errors)
        passed = total_tests - failures - errors
        
        print(f"\n{suite_name} Results:")
        print(f"  Total Tests: {total_tests}")
        print(f"  Passed: {passed}")
        print(f"  Failed: {failures}")
        print(f"  Errors: {errors}")
        print(f"  Duration: {duration:.2f} seconds")
        
        # Add to reporter
        status = "PASS" if failures == 0 and errors == 0 else "FAIL"
        self.reporter.add_test_result(suite_name, status, duration, {
            'total': total_tests,
            'passed': passed,
            'failed': failures,
            'errors': errors
        })
        
        # Print failure details
        if result.failures:
            print(f"\nFailures ({len(result.failures)}):")
            for test, traceback in result.failures:
                print(f"  - {test}: {traceback.split('AssertionError:')[-1].strip()}")
        
        if result.errors:
            print(f"\nErrors ({len(result.errors)}):")
            for test, traceback in result.errors:
                print(f"  - {test}: {traceback.split('Exception:')[-1].strip()}")
        
        return result
    
    def run_apps_tests(self):
        """Run all app component tests."""
        suite = self.create_app_test_suite()
        return self.run_test_suite(suite, "App Components Tests")
    
    def run_calendar_tests(self):
        """Run calendar functionality tests."""
        suite = self.create_calendar_test_suite()
        return self.run_test_suite(suite, "Calendar Tests")
    
    def run_frontend_tests(self):
        """Run frontend/live site tests."""
        suite = self.create_frontend_test_suite()
        return self.run_test_suite(suite, "Frontend Live Tests")
    
    def run_offline_tests(self):
        """Run offline/local tests."""
        suite = self.create_offline_test_suite()
        return self.run_test_suite(suite, "Offline Tests")
    
    def run_all_tests(self):
        """Run all tests except live frontend tests."""
        suite = self.create_full_test_suite()
        return self.run_test_suite(suite, "All Tests (Offline)")
    
    def generate_report(self):
        """Generate HTML test report."""
        report_path = self.reporter.generate_html_report()
        print(f"\nTest report generated: {report_path}")
        return report_path


def main():
    """Main function to run tests based on command line arguments."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Run Greenhouse Mental Health Selenium Tests')
    parser.add_argument('--suite', choices=['apps', 'calendar', 'frontend', 'offline', 'all'], 
                       default='all', help='Test suite to run')
    parser.add_argument('--report', action='store_true', 
                       help='Generate HTML report after tests')
    parser.add_argument('--verbose', '-v', action='store_true', 
                       help='Verbose output')
    
    args = parser.parse_args()
    
    # Set verbosity
    if args.verbose:
        unittest.TestLoader.testMethodPrefix = 'test'
    
    runner = TestSuiteRunner()
    
    print("Greenhouse Mental Health - Selenium Test Suite")
    print("=" * 50)
    
    # Run selected test suite
    if args.suite == 'apps':
        result = runner.run_apps_tests()
    elif args.suite == 'calendar':
        result = runner.run_calendar_tests()
    elif args.suite == 'frontend':
        result = runner.run_frontend_tests()
    elif args.suite == 'offline':
        result = runner.run_offline_tests()
    elif args.suite == 'all':
        result = runner.run_all_tests()
    
    # Generate report if requested
    if args.report:
        runner.generate_report()
    
    # Print summary
    print(f"\n{'='*60}")
    print("Test Execution Summary")
    print(f"{'='*60}")
    
    total_failures = len(result.failures)
    total_errors = len(result.errors)
    
    if total_failures == 0 and total_errors == 0:
        print("✓ All tests passed successfully!")
        sys.exit(0)
    else:
        print(f"✗ Tests completed with {total_failures} failures and {total_errors} errors")
        sys.exit(1)


if __name__ == '__main__':
    main()
