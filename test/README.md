# Greenhouse Mental Health - Selenium Test Suite

This directory contains a comprehensive, organized test suite for the Greenhouse Mental Health project using Selenium WebDriver. The tests are structured using modern testing patterns and best practices.

## 📁 Test Structure

### Core Framework Files

- **`base_test.py`** - Base classes providing common functionality for all tests
- **`test_utils.py`** - Utility functions, helpers, and common test patterns
- **`run_all_tests.py`** - Test suite runner with reporting capabilities

### Test Files

#### Refactored Tests (Recommended)
- **`test_books_app_refactored.py`** - Comprehensive tests for the Books application
- **`test_news_app_refactored.py`** - Comprehensive tests for the News application  
- **`test_videos_app_refactored.py`** - Comprehensive tests for the Videos application
- **`test_calendar_refactored.py`** - Comprehensive tests for the Calendar functionality
- **`test_frontend_refactored.py`** - Tests for the live website and offline functionality

#### Legacy Tests (Original)
- `test_frontend.py` - Original simple frontend test (used as reference)
- `test_books_app.py` - Original books app test
- `test_news_app.py` - Original news app test
- `test_videos_app.py` - Original videos app test
- `test_calendar.py` - Original calendar test
- `test_console_logs.py` - Console logging test
- `test_column_layout.py` - Layout testing script
- `test_scheduler_backend_flow.py` - Backend API testing script

## 🏗️ Architecture

### Base Classes

#### `BaseSeleniumTest`
The foundation class providing:
- WebDriver setup and teardown
- Common wait methods and element finding
- Screenshot capabilities
- Console log retrieval
- Utility methods for common operations

#### `BaseAppTest`
Extends `BaseSeleniumTest` for testing app components:
- Standardized app structure verification
- Configurable app-specific settings
- Common item structure validation patterns

#### `BaseLiveTest`
Extends `BaseSeleniumTest` for live website testing:
- Automatic live site loading
- Performance testing capabilities
- Real-world scenario testing

### Utility Classes

#### `TestDataManager`
- Configuration management
- Test data provisioning
- URL management for different environments

#### `ElementLocators`
- Centralized element selectors
- App-specific locator management
- Reusable locator patterns

#### `TestAssertions`
- Custom assertion helpers
- Common validation patterns
- Enhanced error messages

#### `WaitHelpers`
- Advanced waiting strategies
- AJAX completion detection
- Custom wait conditions

#### `ScreenshotManager`
- Organized screenshot capture
- Failure screenshot automation
- Test step documentation

#### `BrowserConsoleHelper`
- Console log analysis
- Error detection and filtering
- Log formatting and reporting

#### `TestReporter`
- HTML report generation
- Test result aggregation
- Performance metrics tracking

## 🚀 Getting Started

### Prerequisites

1. **Python 3.7+**
2. **Firefox Browser**
3. **GeckoDriver** (place in the `test/` directory)
4. **Required Python packages:**
   ```bash
   pip install selenium
   ```

### Running Tests

#### Using the Test Runner (Recommended)

```bash
# Run all offline tests
python run_all_tests.py --suite all

# Run specific test suites
python run_all_tests.py --suite apps
python run_all_tests.py --suite calendar
python run_all_tests.py --suite frontend
python run_all_tests.py --suite offline

# Generate HTML report
python run_all_tests.py --suite all --report

# Verbose output
python run_all_tests.py --suite all --verbose
```

#### Running Individual Tests

```bash
# Run a specific test file
python test_books_app_refactored.py
python test_news_app_refactored.py
python test_videos_app_refactored.py
python test_calendar_refactored.py
python test_frontend_refactored.py
```

#### Using unittest directly

```bash
# Run all tests in a file
python -m unittest test_books_app_refactored.TestBooksApp

# Run a specific test method
python -m unittest test_books_app_refactored.TestBooksApp.test_app_structure
```

## 📋 Test Categories

### App Component Tests
Test individual application components (Books, News, Videos):
- **Structure Validation** - Verify proper HTML structure and CSS classes
- **Content Quality** - Check for meaningful content and proper formatting
- **Accessibility** - Test alt text, ARIA labels, and keyboard navigation
- **Responsive Design** - Verify functionality across different screen sizes
- **Link Validation** - Ensure all links are functional and properly formatted

### Calendar Tests
Test calendar functionality:
- **Display Verification** - Check calendar rendering and navigation
- **Interaction Testing** - Test date selection and navigation
- **Drag & Drop** - Verify appointment creation functionality
- **Keyboard Navigation** - Test accessibility features
- **Responsive Behavior** - Ensure mobile compatibility

### Frontend Tests
Test the live website:
- **Performance Testing** - Measure load times and performance metrics
- **Console Error Detection** - Identify JavaScript errors
- **Structure Validation** - Verify basic page elements
- **Accessibility Testing** - Check for basic accessibility compliance
- **Form Testing** - Validate form functionality
- **Image Testing** - Verify image loading and alt text

## 🔧 Configuration

### Test Configuration
Create a `test_config.json` file in the test directory:

```json
{
  "default_timeout": 20,
  "implicit_wait": 10,
  "screenshot_on_failure": true,
  "headless_mode": true,
  "test_urls": {
    "live": "https://greenhousementalhealth.org",
    "staging": "https://staging.greenhousementalhealth.org",
    "local": "http://localhost:3000"
  }
}
```

### Browser Configuration
The tests are configured for Firefox with headless mode by default. To modify:

1. Edit `base_test.py` in the `setup_driver()` method
2. Change browser options or switch to Chrome/Edge
3. Update the driver path accordingly

## 📊 Test Reports

### HTML Reports
Generated reports include:
- Test execution summary
- Pass/fail statistics
- Execution duration
- Detailed test results
- Timestamp information

Reports are saved to `test/reports/test_report.html`

### Screenshots
Failure screenshots are automatically captured and saved to `test/screenshots/`

## 🎯 Best Practices

### Writing New Tests

1. **Extend Base Classes**: Use `BaseSeleniumTest`, `BaseAppTest`, or `BaseLiveTest`
2. **Use Utility Functions**: Leverage helpers from `test_utils.py`
3. **Follow Naming Conventions**: Use descriptive test method names starting with `test_`
4. **Add Documentation**: Include docstrings explaining test purpose
5. **Use Assertions Helpers**: Utilize custom assertions for better error messages

### Example Test Structure

```python
from base_test import BaseAppTest
from test_utils import TestAssertions

class TestMyApp(BaseAppTest):
    APP_NAME = 'myapp'
    APP_VIEW_CLASS = 'my-app-view'
    EXPECTED_TITLE = 'My App Title'
    
    def test_specific_functionality(self):
        """Test specific functionality with clear description."""
        print("\n--- Testing Specific Functionality ---")
        
        # Use base class methods
        element = self.wait_for_element((By.ID, 'my-element'))
        
        # Use utility assertions
        TestAssertions.assert_element_has_text(self, element, 'Expected Text')
        
        print("✓ Functionality verified")
```

### Debugging Tests

1. **Screenshots**: Automatic failure screenshots are captured
2. **Console Logs**: Use `self.get_console_logs()` to check for errors
3. **Verbose Output**: Run with `--verbose` flag for detailed output
4. **Manual Screenshots**: Use `self.take_screenshot('debug.png')`

## 🔍 Troubleshooting

### Common Issues

#### GeckoDriver Not Found
```
selenium.common.exceptions.WebDriverException: 'geckodriver' executable needs to be in PATH
```
**Solution**: Download geckodriver and place it in the `test/` directory

#### Element Not Found
```
selenium.common.exceptions.NoSuchElementException: Unable to locate element
```
**Solutions**:
- Check if element selector is correct
- Use `wait_for_element()` instead of `find_element()`
- Verify the page has loaded completely
- Check if element is in an iframe

#### Timeout Errors
```
selenium.common.exceptions.TimeoutException: Message: 
```
**Solutions**:
- Increase timeout values in test configuration
- Check network connectivity for live tests
- Verify the application is running for local tests

#### Headless Mode Issues
Some tests may behave differently in headless mode.
**Solution**: Temporarily disable headless mode in `base_test.py`:
```python
# Comment out this line:
# self.firefox_options.add_argument("--headless")
```

## 📈 Extending the Framework

### Adding New Test Types

1. Create new base class in `base_test.py` if needed
2. Add utility functions to `test_utils.py`
3. Create test file following naming convention
4. Update `run_all_tests.py` to include new tests

### Adding New Assertions

Add custom assertions to `TestAssertions` class in `test_utils.py`:

```python
@staticmethod
def assert_custom_condition(test_case, element, expected_value):
    """Custom assertion with descriptive error message."""
    actual_value = element.get_custom_property()
    test_case.assertEqual(actual_value, expected_value,
                         f"Custom assertion failed: expected {expected_value}, got {actual_value}")
```

### Performance Testing

Use `PerformanceHelper` for performance-related tests:

```python
from test_utils import PerformanceHelper

# Measure page load time
load_time = PerformanceHelper.measure_page_load_time(self.driver, url)

# Get detailed metrics
metrics = PerformanceHelper.get_page_performance_metrics(self.driver)
```

## 📝 Contributing

When contributing new tests:

1. Follow the established patterns and structure
2. Add comprehensive documentation
3. Include both positive and negative test cases
4. Test across different screen sizes when relevant
5. Add appropriate assertions and error messages
6. Update this README if adding new functionality

## 🔗 Related Documentation

- [Selenium WebDriver Documentation](https://selenium-python.readthedocs.io/)
- [Python unittest Documentation](https://docs.python.org/3/library/unittest.html)
- [Greenhouse Mental Health Project Documentation](../docs/)

---

*This test suite was organized and refactored to provide comprehensive coverage while maintaining clean, maintainable code structure following modern testing best practices.*
