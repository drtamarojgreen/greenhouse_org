# Scheduler Debugging Status - Monday, September 8, 2025

## Overview
This document summarizes the current status of debugging the Greenhouse scheduling application, focusing on issues encountered and actions taken.

## Errors Encountered & Actions Taken

### 1. `Uncaught ReferenceError: renderSchedule is not defined`
*   **Initial Cause:** `GreenhouseDashboardApp.js` was calling `GreenhouseSchedulerUI.renderSchedule`, but `GreenhouseSchedulerUI.renderSchedule` had been renamed to `GreenhouseSchedulerUI.renderWeekly` in `schedulerUI.js`.
*   **Action Taken:**
    *   Renamed `renderSchedule` to `renderWeekly` in `docs/js/schedulerUI.js` (both definition and exposure in `return` object).
    *   Updated the call in `docs/js/GreenhouseDashboardApp.js` from `GreenhouseSchedulerUI.renderSchedule` to `GreenhouseSchedulerUI.renderWeekly`.
    *   Modified `docs/js/scheduler.js` to pass `GreenhouseSchedulerUI` to `GreenhouseDashboardApp` and call `buildDashboardUI` from `GreenhouseSchedulerUI` directly.
*   **Current Status:** This specific `ReferenceError` is no longer appearing in the latest console logs, indicating the code changes on disk have resolved it. The previous appearance was likely due to caching on the live site.

### 2. `TypeError: appState.currentAppInstance.buildDashboardUI is not a function`
*   **Cause:** After modifying `scheduler.js` to pass `GreenhouseSchedulerUI` to `GreenhouseDashboardApp`, `scheduler.js` was incorrectly trying to call `appState.currentAppInstance.buildDashboardUI()`. `GreenhouseDashboardApp` does not expose a `buildDashboardUI` method in its return object.
*   **Action Taken:** Reverted the change in `docs/js/scheduler.js` to call `GreenhouseSchedulerUI.buildDashboardUI()` directly, as `GreenhouseSchedulerUI` is the intended central UI builder.
*   **Current Status:** This error should be resolved.

### 3. `TypeError: GreenhouseSchedulerUI.addDashboardEventListeners is not a function`
*   **Cause:** `GreenhouseDashboardApp.js` is trying to call `GreenhouseSchedulerUI.addDashboardEventListeners`, but this function is not exposed in the `GreenhouseSchedulerUI` object (defined in `schedulerUI.js`).
*   **Action Taken:** (Proposed, but not yet executed due to user intervention) Expose `addDashboardEventListeners` in the `return` object of `GreenhouseSchedulerUI` in `docs/js/schedulerUI.js`.
*   **Current Status:** This error is still present and needs to be addressed.

### 4. `Calendar container not found: #greenhouse-dashboard-app-calendar-container`
*   **Cause:** The `renderCalendar` function in `schedulerUI.js` is trying to find the calendar container, but it's not finding it. This suggests a timing issue where `renderCalendar` is called before `buildDashboardUI` has created and appended the container to the DOM.
*   **Action Taken:** None yet.
*   **Current Status:** This error is still present and needs to be addressed.

### 5. CORS Error (`Cross-Origin Request Blocked`)
*   **Cause:** The browser's Same-Origin Policy is blocking `greenhouse.js` (running on `greenhousementalhealth.org`) from fetching `schedulerUI.js` (and other assets) from `drtamarojgreen.github.io`.
*   **Action Taken:** None (cannot be fixed from within this environment).
*   **Current Status:** This is a critical deployment/server-side configuration issue that needs to be resolved outside of this environment. It prevents the scheduler from loading at all. The successful loading of `news.js` from the same origin suggests the issue might be intermittent, caching-related, or specific to the schedule page's context within Wix.

### 6. `Vine Effect Error`
*   **Cause:** The vine effect script cannot find its target element using the specified CSS selector.
*   **Action Taken:** Merged vine effect logic into `docs/js/effects.js` and updated the selector.
*   **Current Status:** This error still persists. It is secondary to the core scheduler loading issues.

## Current Architectural Understanding
*   `greenhouse.js` is the central loader, dynamically injecting application-specific scripts (like `scheduler.js`, `GreenhouseDashboardApp.js`, `schedulerUI.js`).
*   `scheduler.js` loads `GreenhouseDashboardApp.js` (for the dashboard view) and `schedulerUI.js`.
*   `schedulerUI.js` is intended to be the central place for all UI element building and rendering functions (e.g., `buildDashboardUI`, `renderCalendar`, `renderWeekly`).
*   `GreenhouseDashboardApp.js` handles data fetching and application logic, delegating UI rendering to `GreenhouseSchedulerUI` (from `schedulerUI.js`).
*   `dashboard.js` is a local testing/demo file and is not loaded on the live site. Its UI rendering functions are redundant and conflicting with `schedulerUI.js`'s role.

## Next Steps (Prioritized)
1.  **Resolve `TypeError: GreenhouseSchedulerUI.addDashboardEventListeners is not a function`:** Expose `addDashboardEventListeners` in `docs/js/schedulerUI.js`.
2.  **Resolve `Calendar container not found`:** Investigate timing/DOM insertion for `buildDashboardUI` and `renderCalendar` calls.
3.  **User Action Required:** Resolve the CORS issue on the live site.
4.  **Re-evaluate `Vine Effect Error`:** After core scheduler issues and CORS are resolved.
