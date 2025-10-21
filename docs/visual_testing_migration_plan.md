# Plan: Migrating from Playwright to Selenium for Visual Testing

## 1. Introduction & Goal

This document outlines the plan to formally deprecate and remove the Playwright testing framework from this repository and replace it with a unified, Selenium-based solution for all browser-based testing, including visual regression testing.

The primary goal is to consolidate our testing stack, leveraging the existing Python environment to create a robust and maintainable framework for verifying both the functionality and the visual integrity of the web application's components.

## 2. Proposed Technical Solution

The new visual testing framework will be built using the following components:

*   **Browser Automation:** **Selenium**. We will extend the existing `BaseSeleniumTest` framework located in `tests/python_legacy/base_test.py` to include visual testing capabilities.
*   **Image Comparison:** **Pillow**. We will use the `Pillow` library, the de-facto standard for image manipulation in Python, to perform pixel-level comparisons between screenshots.
*   **Workflow:** The testing process will be as follows:
    1.  A developer runs a test that includes a visual assertion for a specific component (e.g., the scheduler calendar).
    2.  The test invokes a new `assertVisualMatch` method, which takes a screenshot of the target element.
    3.  The method compares this screenshot against a pre-approved "baseline" image stored in the repository.
    4.  If the visual differences are within an acceptable threshold, the test passes.
    5.  If the differences are significant, the test fails. The framework will automatically save the "actual" (failed) screenshot and a "diff" image highlighting the changes, allowing for easy review.

## 3. Implementation Plan

The migration will be executed in the following phases:

### Phase 1: Foundation and Utilities

1.  **Environment Setup**:
    *   Install the `Pillow` library via `pip install Pillow`.

2.  **Enhance Test Infrastructure**:
    *   Create new directories for visual testing assets:
        *   `tests/visual/baseline/`: To store the approved, "golden" screenshots.
        *   `tests/visual/actual/`: To store the screenshots from the latest test run that failed comparison.
        *   `tests/visual/diff/`: To store the generated images that highlight the differences between baseline and actual screenshots.
    *   Add these directories to the `.gitignore` file to prevent test outputs from being committed.

3.  **Implement Core Comparison Logic**:
    *   Create a new helper function in `tests/python_legacy/test_utils.py` named `compare_images`.
    *   This function will take two image paths as input and use `Pillow`'s `ImageChops` module to calculate the difference, returning a metric (e.g., the root-mean-square difference) and a visual diff image.

### Phase 2: Test Framework Integration

1.  **Create a New Assertion Method**:
    *   Add a new method to the `BaseSeleniumTest` class in `tests/python_legacy/base_test.py` called `assertVisualMatch(self, element, baseline_name, threshold=0.1)`.
    *   This method will perform the following steps:
        a. Take a screenshot of the provided `element`.
        b. Construct the path to the baseline image using `baseline_name`.
        c. **If a baseline image does not exist**: Save the new screenshot as the baseline for future runs and pass the test. This is the "baseline generation" step.
        d. **If a baseline image exists**: Call the `compare_images` utility.
        e. If the difference is below the `threshold`, the test passes.
        f. If the difference exceeds the `threshold`, save the new screenshot to `tests/visual/actual/` and the diff image to `tests/visual/diff/`, then fail the test with a descriptive error message.

### Phase 3: Implementation and Deprecation

1.  **Create a Pilot Visual Test**:
    *   Create a new test file, `tests/python_legacy/test_visual_scheduler.py`.
    *   This test will navigate to the scheduler page and use `assertVisualMatch` to verify the visual appearance of the rendered calendar grid. This will validate the entire framework.

2.  **Remove Playwright Dependencies**:
    *   Once the Selenium-based solution is confirmed to be working, perform a full audit of the repository.
    *   Identify and remove any Playwright-related packages, configuration files, and test scripts. This includes any `npm` dependencies if found.

3.  **Update Documentation**:
    *   Update the `README.md` and any other testing-related documents to remove references to Playwright and describe the new Selenium-based visual testing workflow.

This structured approach ensures a smooth transition, resulting in a single, unified testing framework that is easier to maintain and extend.