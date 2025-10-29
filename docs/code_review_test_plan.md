# Code Review: Testing Strategy Consolidation Plan

This document outlines a detailed, phased plan to unify the project's testing efforts. The objective is to create a cohesive and modern testing strategy that reduces maintenance overhead, improves test coverage, and provides a clear path forward for developers.

## Phased Rollout Timeline

*   **Phase 1 (Current Quarter): Foundational Setup**
    *   Consolidate all JavaScript unit tests into `tests/javascript/` and remove the `test_new/` directory.
    *   Establish Jest as the official unit testing framework for JavaScript and write the first unit tests for shared utility functions.
    *   Begin the audit of the `tests/python_legacy` suite to identify high-value E2E tests for migration.
*   **Phase 2 (Next Quarter): Legacy Migration**
    *   Begin migrating the identified high-value E2E tests from `tests/python_legacy` to the modern Python test suite in `tests/integration/`.
    *   Begin migrating the critical BDD scenarios from `tests/bdd_legacy` into modern Python integration tests.
    *   Expand Jest unit test coverage to include core UI-building functions in `schedulerUI.js`.
*   **Phase 3 (Following Quarter): Decommission and Documentation**
    *   Complete all legacy test migrations.
    *   Archive and remove the `tests/python_legacy` and `tests/bdd_legacy` directories.
    *   Create the `docs/TESTING.md` document to serve as the definitive guide for the new, consolidated testing strategy.

## 1. Modern Frameworks and Structure

### 1.1. Modern Python Suite (`tests/`)

*   **Mandate:** All new backend unit, integration, and E2E tests will reside in this suite, leveraging `pytest`.
*   **Structure:**
    *   `tests/unit`: For testing individual Python functions in isolation.
    *   `tests/integration`: For testing the interaction between different parts of the application, including backend API endpoints and E2E browser tests.

### 1.2. JavaScript Unit Test Suite (`tests/javascript`)

*   **Consolidation:** The `test_new/` directory will be removed, and its contents migrated to a new `tests/javascript/` subdirectory to centralize all testing.
*   **Framework:** **Jest** is the official framework for all JavaScript unit tests.
*   **Initial Focus & Example:** The initial focus will be on testing the utility and UI-building functions in the static JavaScript application. These tests can be run in a Node.js environment without a browser, making them fast and reliable.

    *   **Example Jest Unit Test (`tests/javascript/GreenhouseUtils.spec.js`):**
        ```javascript
        // Mocking browser APIs for a Node.js environment
        const mockElement = {
          classList: { add: jest.fn(), remove: jest.fn() },
          style: {},
        };
        global.document = { querySelector: jest.fn().mockReturnValue(mockElement) };

        // Assuming GreenhouseUtils.js is refactored to be importable
        const GreenhouseUtils = require('../../docs/js/GreenhouseUtils');

        describe('GreenhouseUtils', () => {
          describe('showElement', () => {
            it('should remove the greenhouse-hidden class and set display to block', () => {
              const selector = '#my-element';
              GreenhouseUtils.showElement(selector);

              expect(document.querySelector).toHaveBeenCalledWith(selector);
              expect(mockElement.classList.remove).toHaveBeenCalledWith('greenhouse-hidden');
              expect(mockElement.style.display).toBe('block');
            });
          });
        });
        ```

## 2. Legacy Test Migration Strategy

### 2.1. `tests/python_legacy` (Selenium Tests)

*   **Audit:** A comprehensive audit of all legacy Selenium tests will be conducted to identify which tests are still relevant and provide high value. Tests that are brittle, outdated, or low-value will be discarded.
*   **Migration Strategy:** The identified high-value E2E tests will be re-implemented within the **modern Python test suite (`tests/integration/`)**. This consolidates all Python testing into a single, modern framework that the team is already using.

### 2.2. `tests/bdd_legacy` (BDD Tests)

*   **Scenario Review:** A review of the `.feature` files will determine which user scenarios remain critical to the application's functionality.
*   **Migration:** The critical BDD scenarios will be converted into new integration tests within the **modern Python (`tests/`) suite**. This preserves the valuable user-flow tests in a more maintainable format.

## 3. Final Documentation

*   **`docs/TESTING.md`:** Upon completion of the migration, a new `TESTING.md` file will be created within the `docs/` directory. This document will serve as the official guide to the consolidated testing strategy, providing clear instructions on how to run all types of tests.
