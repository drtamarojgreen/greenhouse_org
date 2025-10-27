# How to Run Tests

This document provides instructions on how to run the various test suites in this repository.

## Modern Python Testing Framework

This is the primary and most structured testing framework, located in the `tests/` directory. It's designed for unit, integration, and end-to-end testing.

### Structure

-   `tests/apps/`: Application-specific tests.
-   `tests/integration/`: End-to-end tests.
-   `tests/unit/`: Unit tests for isolated modules.
-   `tests/pages/`: Page Object Models for UI abstraction.
-   `tests/config/`, `tests/fixtures/`, `tests/mocks/`, `tests/utils/`: Supporting configuration, data, mocks, and utilities.

### Running the Tests

1.  **Prerequisites:**
    *   Python 3
    *   `selenium`, `pyvirtualdisplay` (and other dependencies, check for a `requirements.txt` file)
    *   `geckodriver` for Firefox, installed in your system's PATH.
    *   `xvfb` for headless browsing on Unix-like systems.

2.  **Execution:**
    *   It is recommended to use a test runner like `pytest` for executing these tests.
    *   Run the tests by pointing the runner at the `tests/` directory:
        ```bash
        pytest tests/
        ```
    *   For more detailed information on the architecture, refer to the [Application Testing Guide](app_testing_guide.md).

## Legacy Python Testing Framework

This is the original Selenium-based test suite, located in `tests/python_legacy/`. It is preserved for reference but is considered **deprecated**. New tests should not be added to this suite.

### Running the Tests

-   Execute the following command from the root of the repository:
    ```bash
    python3 tests/python_legacy/run_all_tests.py --suite all
    ```

## JavaScript Testing Framework

This is a newer framework for JavaScript-based integration tests, located in the `test_new/` directory. It is designed to test the client-side logic and component interactions of the static JavaScript applications.

### Structure

-   `test_new/tests/integration_schedule_test.js`: Integration tests for the scheduling application.
-   `test_new/tests/test_assertion_library.js`: A custom assertion library.
-   `test_new/tests/test_test_framework.js`: The core test runner.

### Running the Tests

1.  **Prerequisites:**
    *   Node.js and npm.
    *   Install dependencies from `package.json` (if available):
        ```bash
        npm install
        ```

2.  **Execution:**
    *   Run the tests using a Node.js-based test runner. The exact command will depend on the project's configuration but typically looks like this:
        ```bash
        npm test
        ```

## Backend Testing

Backend testing for this project is conducted using a black-box approach, as the backend is hosted on Wix and the source code is not directly accessible. This strategy involves interacting with the live application's public-facing endpoints to verify functionality, security, and performance.

### Approach

-   **Endpoint Interaction:** Tests are performed by sending requests to the application's API endpoints and validating the responses.
-   **Focus Areas:** Key areas for testing include user authentication, appointment booking, and contact forms.
-   **Security:** The backend is assessed for common web application vulnerabilities.

For a detailed overview of the backend testing strategy, including specific test cases and methodologies, please refer to the [Backend Testing Strategy](backend_testing.md) document.
