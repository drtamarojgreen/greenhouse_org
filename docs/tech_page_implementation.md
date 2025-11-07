# Implementation Plan: Tech & Testing Page

## 1. Overview

This document outlines the implementation strategy for a new, non-public "Tech" page (`/tech`). The primary purpose of this page is to serve as a controlled development and testing environment. It will allow developers to:

*   Test the functionality of backend Velo scripts in isolation.
*   Verify the behavior of client-side JavaScript modules (`GreenhouseUtils.js`, UI components, etc.).
*   Debug interactions between the Velo backend and the frontend application.
*   Ensure components render correctly without interfering with the live, public-facing site.

The architecture will mirror the existing structure used by pages like `/models`, `/schedule`, and `/books`, ensuring consistency and reusability of existing patterns.

## 2. Architecture

The Tech page will be composed of three main parts: a Velo backend script, a standard Wix page, and a dedicated client-side JavaScript application.

### 2.1. Velo Backend Script (`Tech.js`)

A new backend script will be created in the Velo editor named `Tech.js`. This script will not handle live data but will expose a set of functions designed specifically for testing.

**Responsibilities:**

*   **Provide Mock Data:** Expose functions that return structured, predictable JSON data to simulate various backend responses.
*   **Simulate Backend Operations:** Contain functions that mimic database queries, long-running processes, or permission checks.
*   **Data Handoff:** Populate the page's hidden `#dataTextElement` with initial test data upon page load.

**Example Functions in `Tech.js`:**

```javascript
// Returns a mock user object
export function getMockUserData() {
  return {
    userId: "test-123",
    role: "admin",
    preferences: { theme: "dark" }
  };
}

// Simulates a process that takes time to complete
export async function simulateLongProcess() {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { status: "complete", duration: 1500 };
}
```

### 2.2. Client-Side Application (`docs/js/tech.js`)

A new JavaScript file, `docs/js/tech.js`, will be created. This script will be injected into the `/tech` page and will be responsible for building the user interface for the testing dashboard.

**Responsibilities:**

*   **Initialize:** Read the initial data passed from the Velo backend via the `#dataTextElement`.
*   **Render UI:** Dynamically create and render a simple dashboard with buttons, input fields, and output areas for different test cases.
*   **Event Handling:** Attach event listeners to the UI elements to trigger test functions.
*   **Execute Tests:** Call functions from the `Tech.js` backend (via `wixWindow.functions`) and from other client-side modules (like `GreenhouseUtils.js`).
*   **Display Results:** Render the output of the tests (e.g., returned data, success/error messages) in the designated display areas.

### 2.3. Wix Page (`/tech`)

A new page will be created in the Wix editor with the URL slug `tech`. This page will be hidden from the main site navigation.

**Components:**

*   **Target Element:** A designated section or container where the `tech.js` script will render the testing dashboard.
*   **Data Text Element (`#dataTextElement`):** A hidden text element that will be used by `Tech.js` to pass initial configuration data to the client-side script.

## 3. Implementation Steps

1.  **Backend Script Creation:**
    *   In the Velo Editor, create a new backend `.js` file named `Tech.js`.
    *   Add initial placeholder functions for providing mock data and simulating backend processes.

2.  **Client-Side Script Creation:**
    *   Create a new file at `docs/js/tech.js`.
    *   Implement the basic structure, including an `init()` function that will be called to render the test dashboard.

3.  **Wix Page Setup:**
    *   Create a new, hidden page in the Wix editor and set its URL to `/tech`.
    *   Add a text element and set its ID to `dataTextElement`.
    *   Add a container element that will serve as the mounting point for the test dashboard UI.
    *   In the page's code panel, import the functions from `Tech.js` and use them to populate `#dataTextElement` on page load.

4.  **Loader Configuration:**
    *   Modify the main application loader (`greenhouse.js` or equivalent) to detect when the user is on the `/tech` page.
    *   Add logic to dynamically load and initialize the `docs/js/tech.js` script when the page is detected.

## 4. Example Test Cases to Implement

The `tech.js` script will render a UI to execute tests like the following:

*   **Test Case 1: Backend Data Fetch**
    *   **UI:** A "Fetch Mock User" button.
    *   **Action:** Calls the `getMockUserData()` function from `Tech.js`.
    *   **Result:** The returned user object is stringified and displayed in an output box.

*   **Test Case 2: Utility Function Verification**
    *   **UI:** A "Test DOM Element Finder" button.
    *   **Action:** Executes a function from `GreenhouseUtils.js`, like `GreenhouseUtils.waitForElement()`, on a test element on the page.
    *   **Result:** Displays a success or timeout message.

*   **Test Case 3: UI Component Rendering**
    *   **UI:** A "Render Notification Banner" button.
    *   **Action:** Calls a shared UI function to render a notification component.
    *   **Result:** A notification banner appears on the page.

## 5. Integration with Existing Test Suites

The `/tech` page is designed to complement, not replace, the existing automated test suites located in the `tests/` directory. Its role is to facilitate a different kind of testing: **interactive, manual verification and debugging**.

The existing test suites (`tests/unit`, `tests/integration`, etc.) are essential for automated, repeatable verification of the application's correctness and are a critical part of the CI/CD pipeline. The `/tech` page serves as a development tool that comes *before* the automated tests are finalized.

### The Development Workflow

1.  **Develop a Feature:** A developer builds a new component or function (e.g., a new utility in `GreenhouseUtils.js` or a new Velo backend function).
2.  **Manual Verification on `/tech`:** The developer adds a simple UI to the `/tech` page to trigger and interact with the new feature. This allows them to quickly see it in action, test edge cases, and debug issues in a real browser environment.
3.  **Write Formal Automated Tests:** Once the feature's behavior is confirmed to be correct through manual testing on the `/tech` page, the developer writes formal, automated unit or integration tests for it. These tests will reside in the appropriate directory within `tests/`.
4.  **Commit and CI:** The new feature and its corresponding automated tests are committed to the repository, where they will be run automatically as part of the continuous integration process.

By providing a live sandbox, the `/tech` page will accelerate the development and debugging cycle, leading to more robust and well-understood code *before* it is subjected to the rigor of the formal, automated test suite.
