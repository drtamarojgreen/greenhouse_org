# Visual Regression Testing Guide

This document outlines the process for running visual regression tests for the static scheduler component. These tests are designed to catch unintended visual changes to the UI by comparing screenshots against a "golden" baseline image.

## Overview

The visual regression test suite uses **Selenium** to:
1.  Launch a headless browser.
2.  Load the scheduler component in a dedicated test harness (`docs/test_dependency_loading.html`).
3.  Take a screenshot of the rendered component.
4.  Compare this new screenshot against a baseline image stored in the repository.

If the new screenshot does not match the baseline, the test will fail, alerting the developer to a potential visual regression.

## Running the Tests

To run the visual regression tests, execute the following command from the root of the repository:

```bash
./tests/visual/run_visual_tests.sh
```

This script will handle installing dependencies and running the test.

### Test Outcomes

-   **First Run:** If no baseline screenshot exists, the test will automatically create one in the `tests/visual/golden_screenshots/` directory. This initial run will always pass.
-   **Successful Run:** If the new screenshot matches the baseline image, the test will pass, and no output will be generated.
-   **Failed Run:** If there is a mismatch between the new screenshot and the baseline, the test will fail. A `test-output` directory will be created containing the new screenshot, the baseline screenshot, and a diff image that highlights the differences.

## Updating Baseline Screenshots

If a UI change is intentional (e.g., a planned redesign), the baseline screenshot will need to be updated. To do this, you must first delete the old baseline image:

```bash
rm tests/visual/golden_screenshots/scheduler_calendar.png
```

Then, re-run the test script:

```bash
./tests/visual/run_visual_tests.sh
```

This will generate a new baseline screenshot with the updated UI. Be sure to visually inspect the new baseline to ensure it is correct before committing it to the repository.