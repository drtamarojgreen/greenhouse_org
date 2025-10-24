# Current Refactor Status: Separating UI Logic from Application Logic

This document summarizes the current state of the refactoring effort to separate UI construction and manipulation logic from the core application logic in the static JavaScript scheduler.

The primary goal is to move all DOM creation and direct manipulation into `schedulerUI.js`, leaving the application-specific files (`GreenhousePatientApp.js`, `GreenhouseDashboardApp.js`, etc.) to handle data fetching, state management, and event handling.

## Refactoring Summary

The refactoring is **partially complete**.

-   **`schedulerUI.js`:** This file is now responsible for **building the initial HTML structure** for all scheduler views (Patient, Dashboard, Admin). It creates forms, containers, calendars, and modals, but it does not handle their dynamic updates (e.g., showing/hiding modals, populating calendars with dates).
-   **Application Files (e.g., `GreenhousePatientApp.js`):** These files remain responsible for the **dynamic UI manipulation**. They query the DOM for elements created by `schedulerUI.js` and then update them based on application state or user interaction.

## Detailed File Status

### `schedulerUI.js` - UI Construction (Complete)

This file has successfully consolidated the UI *building* logic. It now contains and exports functions for creating the static structure of the scheduler, including:

-   `buildSchedulerUI()`: Creates the main app container.
-   `buildPatientFormUI()`: Creates the patient appointment request form.
-   `buildPatientCalendarUI()`: Creates the static structure for the patient view calendar.
-   `buildDashboardLeftPanelUI()` / `buildDashboardRightPanelUI()`: Creates the admin dashboard layout.
-   `buildAdminFormUI()`: Creates the admin settings form.
-   `createHiddenElements()`: Creates elements like the conflict modal that are initially hidden.

### `GreenhousePatientApp.js` - Application Logic & Dynamic UI (Refactoring Incomplete)

This file manages the logic for the patient view. While it correctly uses `schedulerUI.js` to build the initial view, it **still contains significant UI manipulation logic** that needs to be moved.

-   **API Calls & State Management:** Correctly resides here.
-   **Event Handlers (`handleFormSubmission`, `handleAction`):** Correctly reside here, as they orchestrate the application logic.
-   **UI Functions Remaining in this File (To be moved):**
    -   `populateServices()`: Populates the service dropdown.
    -   `populateAppointments()`: Renders the list of appointments.
    -   `populateFormForEdit()`: Fills the form with data for an existing appointment.
    -   `resetForm()`: Clears form inputs and resets button states.
    -   `showLoadingSpinner()`: Toggles the visibility of a loading spinner.
    -   `showConflictModal()` / `hideConflictModal()`: Manages the visibility of the conflict modal.
    -   `renderCalendar()`: **Crucially, this function, which dynamically draws the calendar days, is still in the App logic file, not the UI file.**

### `GreenhouseDashboardApp.js` / `GreenhouseAdminApp.js`

The status of these files reflects a similar pattern to `GreenhousePatientApp.js`. The initial UI construction has been moved to `schedulerUI.js`, but the dynamic rendering and manipulation logic (e.g., populating the dashboard with data) remains within the app-specific files.

## Overall Next Steps

The refactoring is stalled at a critical point. To complete it, the remaining dynamic UI manipulation functions must be migrated from the application logic files into `schedulerUI.js`.

The immediate next steps are focused on `GreenhousePatientApp.js`:

1.  **Migrate Dynamic UI Functions:** Move the function definitions for `populateServices`, `populateAppointments`, `populateFormForEdit`, `resetForm`, `showLoadingSpinner`, `showConflictModal`, `hideConflictModal`, and `renderCalendar` from `GreenhousePatientApp.js` into `schedulerUI.js`.
2.  **Expose New UI Functions:** Update the `return` statement in `schedulerUI.js` to expose these new functions.
3.  **Refactor Function Calls:** Update `GreenhousePatientApp.js` to call these functions from the `GreenhouseSchedulerUI` module (e.g., `GreenhouseSchedulerUI.renderCalendar(...)`).
4.  **Pass State as Arguments:** The migrated UI functions must be refactored to be pure functions. Instead of accessing the `patientAppState` object directly, they should accept the necessary data and element references as arguments (e.g., `renderCalendar(calendarContainer, date)` instead of `renderCalendar()`).
5.  **Repeat for Other App Files:** Apply the same pattern to `GreenhouseDashboardApp.js` and `GreenhouseAdminApp.js`.
