# Scheduler Technical Status and Action Plan

**Last Updated: October 24, 2025**

## 1. Overview

This document provides a technical summary of the current status of the static JavaScript scheduler, outlining key architectural patterns, unresolved issues, and a clear action plan for remediation.

## 2. Current Architecture

The scheduler's code is fundamentally split into two responsibilities:

1.  **Static UI Construction (`schedulerUI.js`):** This module is responsible for building the initial, static HTML structure of the scheduler's different views (Patient, Dashboard, Admin). It creates the containers, forms, and tables but does not populate them with dynamic data or handle user interaction.

2.  **Application Logic & Dynamic Updates (`GreenhousePatientApp.js`, `GreenhouseDashboardApp.js`, etc.):** These modules handle the application's logic. They fetch data, manage state, and, crucially, perform all dynamic UI manipulation. They query the DOM for the static elements created by `schedulerUI.js` and then populate or modify them (e.g., rendering calendar days, showing modals, populating forms).

This separation has led to a number of timing-related bugs, as the application logic often attempts to manipulate DOM elements that may not have been fully rendered and attached to the page yet.

## 3. Unresolved Technical Issues

The following issues, identified in previous debugging sessions, persist in the current codebase and are a direct result of the architectural pattern described above.

### Issue 1: `TypeError` on Missing UI Functions

-   **Symptom:** The application frequently throws `TypeError` exceptions, such as `GreenhouseSchedulerUI.addDashboardEventListeners is not a function`.
-   **Root Cause:** The application logic files (e.g., `GreenhouseDashboardApp.js`) attempt to call dynamic UI or event-handling functions that they expect to exist in `schedulerUI.js`. However, the refactoring to move these functions from the app files into the UI file was never completed. As a result, `schedulerUI.js` only exposes functions for building the *initial* static view, not for handling its dynamic updates.
-   **Status:** **Active.** This remains a primary blocker.

### Issue 2: Race Condition - "Container Not Found" Errors

-   **Symptom:** The browser console logs errors like `Calendar container not found: #greenhouse-dashboard-app-calendar-container`.
-   **Root Cause:** This is a classic race condition. The application logic in `GreenhouseDashboardApp.js` calls a function to render dynamic content (e.g., `populateCalendar`) immediately after initiating the creation of the static UI. The JavaScript event loop does not guarantee that the static container has been appended to the document's DOM before the population logic runs.
-   **Status:** **Active.** This fundamental timing issue makes the scheduler's rendering unreliable.

### Issue 3: CORS Errors on Live Environment (External Factor)

-   **Symptom:** `Cross-Origin Request Blocked` errors prevent scripts from loading when the application is deployed on the main website.
-   **Root Cause:** This is a server configuration issue related to the Same-Origin Policy. The live environment is not correctly configured to allow scripts hosted on the primary domain to load assets from the secondary (e.g., GitHub Pages) domain.
-   **Status:** **Active Blocker.** This is an external dependency that cannot be fixed within the application codebase. It is the most critical issue preventing the scheduler from functioning in production.

## 4. Action Plan (Prioritized)

To stabilize the scheduler, the following steps must be taken:

1.  **Resolve CORS Issue (Highest Priority - External):** The server hosting the assets must be configured with the appropriate CORS headers (e.g., `Access-Control-Allow-Origin`) to allow requests from `greenhousementalhealth.org`. This action is outside the scope of the repository's code.

2.  **Complete the UI Logic Refactoring (Highest Internal Priority):** The separation of concerns between static UI and dynamic updates must be properly completed.
    -   **Action:** Move all remaining DOM manipulation functions (e.g., `populateCalendar`, `populateWeekly`, `showConflictModal`, `addDashboardEventListeners`) from the `*App.js` files into `schedulerUI.js`.
    -   **Action:** Ensure the `return` object in `schedulerUI.js` exposes these new functions.
    -   **Action:** Refactor the `*App.js` files to call these functions via the `GreenhouseSchedulerUI` module (e.g., `GreenhouseSchedulerUI.populateCalendar(...)`).
    -   **Action:** Ensure that data is passed to these UI functions as arguments, rather than having them access a global state.

3.  **Implement a Post-Render Callback System:** To eliminate the race condition, the `init` functions in the `*App.js` files should not call population logic directly. Instead, the UI building functions in `schedulerUI.js` should accept an optional callback function that is executed *only after* the UI has been successfully appended to the DOM.

    **Example Implementation:**
    ```javascript
    // In schedulerUI.js
    function buildDashboardUI(targetElement, onReadyCallback) {
        // ... build all elements ...
        targetElement.appendChild(dashboardContainer);

        // Execute the callback only after the UI is attached
        if (typeof onReadyCallback === 'function') {
            onReadyCallback();
        }
    }

    // In GreenhouseDashboardApp.js
    function init(container) {
        GreenhouseSchedulerUI.buildDashboardUI(container, () => {
            // This code runs only after the UI is safely in the DOM
            populateCalendar(new Date().getFullYear(), new Date().getMonth());
            triggerDataFetchAndPopulation();
        });
    }
    ```
This action plan directly addresses the root causes of the scheduler's instability and provides a clear path toward a more robust and maintainable implementation.
