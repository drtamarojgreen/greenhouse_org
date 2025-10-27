# Running the BDD Test Suites

This document provides instructions on how to run the Behavior-Driven Development (BDD) test suites for this project.

## Prerequisites

- Python 3
- Selenium WebDriver for Chrome (chromedriver)

## Test Runner

The BDD tests are executed using a custom Python script located at `tests/bdd_legacy/bdd_runner.py`. This script discovers and runs all feature tests defined in the `tests/bdd_legacy/features` directory.

## Execution

To run the BDD test suite, execute the following command from the root directory of the repository:

```bash
python3 tests/bdd_legacy/bdd_runner.py
```

The test runner will output the results of the tests to the console, including a summary of passed, failed, and skipped tests.
