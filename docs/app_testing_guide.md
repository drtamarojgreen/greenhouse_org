# Application Testing Guide for Greenhouse Mental Health

This guide provides a comprehensive overview of the testing frameworks and methodologies used to verify the integrity and functionality of the Greenhouse Mental Health website and its associated applications.

## 1. Introduction and Testing Philosophy

The Greenhouse Mental Health platform utilizes a multi-faceted testing strategy to accommodate its diverse technology stack, which includes a Wix Velo frontend, static JavaScript applications, and various backend services. Our approach has evolved from a legacy Selenium-based suite to a more structured and modern framework that combines Python and JavaScript testing.

Our core testing philosophy is to ensure:
- **Structural Integrity:** Custom application components render correctly within the Wix and static HTML environments.
- **Functional Correctness:** User interactions and backend data flows behave as expected.
- **Design Consistency:** UI elements adhere to the established style guide across different browsers and devices.
- **Maintainability:** Tests are organized, readable, and easy to maintain as the platform evolves.

## 2. Testing Frameworks Overview

The repository currently houses three distinct testing setups: a legacy Python/Selenium suite, a modern Python testing framework, and a new JavaScript-based integration test suite.

### 2.1. Modern Python Testing Framework (`tests/`)

This is the primary, most structured testing framework. It is organized into a modular architecture to support different types of testing.

**Directory Structure:**

-   `tests/apps/`: Contains tests specific to individual applications.
-   `tests/integration/`: End-to-end tests that verify the interaction between different components.
-   `tests/unit/`: Focused tests for individual functions or modules in isolation.
-   `tests/pages/`: Page Object Models, which abstract UI components to make tests cleaner and more maintainable. The `schedule_test_page.html` serves as a key harness for testing the scheduler.
-   `tests/python_legacy/`: Contains the original Selenium-based test suite. It is preserved for reference but is considered deprecated for new development. (See memory note: User Instruction: Legacy Python tests must be preserved.)
-   `tests/config/`, `tests/fixtures/`, `tests/mocks/`, `tests/utils/`: Support directories providing configuration, test data, mock objects, and helper utilities.

### 2.2. New JavaScript Testing Framework (`test_new/tests/`)

A newer, emerging framework for running integration tests directly in a JavaScript environment.

**Key Files:**

-   `integration_schedule_test.js`: Integration tests specifically for the scheduling application.
-   `test_assertion_library.js`: A custom library of assertion functions for making verifications.
-   `test_test_framework.js`: The core runner or framework components for these JS-based tests.

This framework is intended for testing the client-side logic and component interactions of our static JavaScript applications.

## 3. Setup and Prerequisites

### For Python Tests (`tests/`):

*   **Python 3:** The test scripts are written in Python.
*   **Dependencies:** Required packages can likely be found in a `requirements.txt` file (if available) and installed via `pip`. Based on legacy code, this includes `selenium` and `pyvirtualdisplay`.
*   **Drivers:** A webdriver such as `geckodriver` for Firefox is required. It should be placed in a directory included in the system's PATH (e.g., `/usr/local/bin/geckodriver`) to ensure the test suite can locate it.
*   **Headless Environment:** Tests are configured to run in a headless environment, requiring `xvfb` (X virtual framebuffer) on Unix-like systems.

### For JavaScript Tests (`test_new/`):

*   **Node.js Environment:** A Node.js runtime is required to execute these tests.
*   **Dependencies:** Check for a `package.json` file to install necessary npm packages.

## 4. Running Tests

Due to the "DO NOT COMPILE" and "DO NOT TEST" directives for the agent, this section provides a general overview for human developers.

### Python Tests:

The legacy Python tests can be run via the `run_all_tests.py` script located in `tests/python_legacy/`.

```bash
python3 tests/python_legacy/run_all_tests.py --suite all
```

For the modern framework, a test runner like `pytest` or Python's built-in `unittest` would typically be used, pointed at the `tests/` directory.

### JavaScript Tests:

A Node.js-based test runner would be used to execute the test files in `test_new/tests/`. The exact command would depend on the specific runner implemented in the project.

## 5. Selector Strategy

A critical aspect of our tests is the selector strategy. We avoid unstable, Wix-generated selectors (e.g., `#comp-xxxxxxxx`). Instead, tests rely on stable, human-readable semantic IDs that are explicitly defined in the application's source code (e.g., `#greenhouse-app-container`, `#booksRepeater`). This ensures our tests are robust and not subject to breaking with minor UI changes made in the Wix editor. This aligns with the "we cannot use computed ids" directive.
