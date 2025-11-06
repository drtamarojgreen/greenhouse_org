# Testing Plan: Models Simulation Application

## 1. Overview

This document outlines a comprehensive testing strategy for the "Models" Neural Plasticity Simulation application. The goal is to establish a robust testing framework that ensures the reliability, correctness, and maintainability of the application, consistent with the testing patterns used elsewhere in the repository.

Currently, the Models application has zero test coverage. This plan proposes adding unit, integration, and end-to-end tests.

## 2. Proposed Test Structure

The following directory structure will be created to mirror the existing patterns in `tests/apps/frontend/`:

```
tests/
└── apps/
    └── frontend/
        └── models/
            ├── run_unit_tests.js
            ├── run_integration_tests.js
            └── unit/
                ├── models.test.js
                ├── models_data.test.js
                ├── models_ui.test.js
                └── models_ux.test.js
```

-   **`run_unit_tests.js`**: A script to execute all unit tests for the Models application.
-   **`run_integration_tests.js`**: A script to execute integration tests.
-   **`unit/`**: The directory to house all unit test files.

## 3. Testing Strategy

### 3.1. Unit Tests

Unit tests will form the foundation of the testing pyramid, focusing on isolating and verifying individual modules of the Models application.

**Key Modules to Test:**

-   **`models_data.js`**:
    -   Test the `loadData` function to ensure it correctly parses data from the mocked `#dataTextElement`.
    -   Verify that it handles missing or malformed JSON gracefully.
    -   Test the `transformNotesToSimulationInput` function with various inputs to ensure it produces the correct data structure for the simulation.
-   **`models_ux.js`**:
    -   Mock the UI and Data modules to test the application logic in `GreenhouseModelsUX`.
    -   Verify that `init` calls its dependencies correctly.
    -   Simulate button clicks and confirm that the correct event handler logic is executed.
    -   Test state changes in response to events.
-   **`models_ui.js`**:
    -   Test the `renderConsentScreen` and `renderSimulationInterface` functions.
    -   Verify that the correct DOM elements are created with the proper IDs and classes.
    -   This can be tested in a headless DOM environment (like JSDOM) without a full browser.

**Tools:**

-   **Test Runner:** A JavaScript-based test runner (like the one implicitly used by other `run_unit_tests.js` scripts).
-   **Assertion Library:** The existing `tests/utils/assertion_library.js`.
-   **DOM Mocking:** JSDOM to simulate a browser environment for UI rendering tests.
-   **Mocks:** Leverage the existing `tests/mocks/velo_backend_mock.js` and `wix_api_mock.js` to simulate the Wix environment.

### 3.2. Integration Tests

Integration tests will verify the interaction between the different modules of the Models application.

**Key Integration Scenarios:**

-   **Data Flow:** Test the complete flow from `models.js` loading its dependencies, to `models_ux.js` initializing, `models_data.js` fetching mock data, and `models_ui.js` rendering the initial consent screen.
-   **Consent to Simulation:** Test the transition from the consent screen to the main simulation interface, ensuring all modules interact correctly after the "Launch Simulation" button is clicked.

### 3.3. End-to-End (E2E) Tests

While the local environment has limitations with `fetch`, basic E2E tests can be structured to run against a live or staged environment in the future.

**Key E2E Scenarios:**

-   **Full User Journey:** A test that loads the `/models` page, clicks the consent checkbox, clicks the "Launch Simulation" button, and verifies that the simulation canvas and controls appear.
-   **Interaction with Simulation:** A test that interacts with the simulation controls (e.g., changing intensity) and asserts that some visual or state change occurs as expected.

**Tools:**

-   The existing BDD structure (`.feature` files) could be extended for these E2E tests, though this is a lower priority than the unit and integration tests.

## 4. Implementation Steps

1.  **Create Directory Structure:** Create the new `tests/apps/frontend/models` directories and files.
2.  **Develop Unit Tests:** Start by writing unit tests for `models_data.js`, as it has the fewest UI dependencies.
3.  **Develop UI Unit Tests:** Write unit tests for `models_ui.js` using a mocked DOM.
4.  **Develop UX Unit Tests:** Write unit tests for `models_ux.js`, mocking its UI and data dependencies.
5.  **Implement Integration Tests:** Write integration tests to verify module interactions.
6.  **Configure Test Runners:** Create the `run_unit_tests.js` script to execute the new test suite.

This plan provides a clear path to achieving comprehensive test coverage for the Models application, aligning with the established practices of the repository.
