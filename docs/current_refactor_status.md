# Current Refactor Status: Separating UI Logic

This document summarizes the current state of refactoring efforts to separate UI logic from application logic in the Greenhouse project's JavaScript files. The primary goal is to move UI-related functions into a centralized `schedulerUI.js` file.

## File Status:

### `GreenhousePatientApp.js`
*   **Current State**: This file still contains its UI-related functions (`setupModal`, `showConflictModal`, `clearFormInputs`, `resetForm`, `editAppointment`).
*   **Pending Task**: These UI functions need to be removed from `GreenhousePatientApp.js`. Calls to these functions within `GreenhousePatientApp.js` (e.g., in `init`, `proposeAndAddAppointment`, `handleAction`) need to be updated to point to `GreenhouseSchedulerUI.<functionName>`.
*   **Error Handling**: API wrapper functions have been updated to use `GreenhouseUtils.displayError`. `alert()` and `confirm()` calls have been replaced or commented out.

### `GreenhouseAdminApp.js`
*   **Current State**: The `buildForm` function (now `buildAdminAppointmentForm`) has been successfully moved from this file to `schedulerUI.js`. Calls to it have been updated.
*   **Pending Task**: No immediate pending tasks for this file.

### `GreenhouseDashboardApp.js`
*   **Current State**: Its UI functions (`buildDashboardUI`, `renderSchedule`, `renderConflicts`, `renderCalendar`, `addDashboardEventListeners`) have been successfully moved to `schedulerUI.js`. Calls to these functions have been updated.
*   **Pending Task**: No immediate pending tasks for this file.

### `schedulerUI.js`
*   **Current State**: This file now contains the `buildPatientFormUI`, `buildAdminAppointmentForm`, and all dashboard UI functions (`buildDashboardUI`, `renderSchedule`, `renderConflicts`, `renderCalendar`, `addDashboardEventListeners`).
*   **Pending Task**: The UI functions from `GreenhousePatientApp.js` (`setupModal`, `showConflictModal`, `clearFormInputs`, `resetForm`, `editAppointment`) need to be added to this file, and its `return` statement needs to be updated to expose them.

### `scheduler.js`
*   **Current State**: This file has been updated to call UI functions from `GreenhouseSchedulerUI`.
*   **Pending Task**: No immediate pending tasks for this file.

## Overall Next Steps:

The immediate next major step is to complete the move of the remaining UI functions from `GreenhousePatientApp.js` to `schedulerUI.js`. This will involve:

1.  **Identify UI Functions**: Clearly identify all UI-related functions within `GreenhousePatientApp.js` that need to be moved.
2.  **Migrate Function Definitions**:
    *   Copy the complete function definition (including parameters and body) of each identified UI function from `GreenhousePatientApp.js` to `schedulerUI.js`.
    *   Ensure proper placement within `schedulerUI.js` (e.g., within the `GreenhouseSchedulerUI` module pattern).
3.  **Remove Original Functions**: Delete the original function definitions from `GreenhousePatientApp.js` after successful migration.
4.  **Update Function Calls**:
    *   Locate all calls to the moved UI functions within `GreenhousePatientApp.js`.
    *   Prefix these calls with `GreenhouseSchedulerUI.` (e.g., `setupModal()` becomes `GreenhouseSchedulerUI.setupModal()`).
5.  **Expose Functions in `schedulerUI.js`**: Modify the `return` statement in `schedulerUI.js` to explicitly expose all newly added UI functions, making them accessible from other modules.

## Detailed Implementation Plan for `GreenhousePatientApp.js` and `schedulerUI.js`:

This section outlines the specific steps for each UI function to be migrated.

### Function: `setupModal`
*   **Step 1: Copy to `schedulerUI.js`**: Copy the entire `setupModal` function from `GreenhousePatientApp.js` to `schedulerUI.js`.
*   **Step 2: Remove from `GreenhousePatientApp.js`**: Delete the `setupModal` function from `GreenhousePatientApp.js`.
*   **Step 3: Update Calls in `GreenhousePatientApp.js`**: Find all instances of `setupModal(...)` in `GreenhousePatientApp.js` and change them to `GreenhouseSchedulerUI.setupModal(...)`.
*   **Step 4: Expose in `schedulerUI.js`**: Add `setupModal: setupModal,` to the `return` statement of `GreenhouseSchedulerUI` in `schedulerUI.js`.

### Function: `showConflictModal`
*   **Step 1: Copy to `schedulerUI.js`**: Copy the entire `showConflictModal` function from `GreenhousePatientApp.js` to `schedulerUI.js`.
*   **Step 2: Remove from `GreenhousePatientApp.js`**: Delete the `showConflictModal` function from `GreenhousePatientApp.js`.
*   **Step 3: Update Calls in `GreenhousePatientApp.js`**: Find all instances of `showConflictModal(...)` in `GreenhousePatientApp.js` and change them to `GreenhouseSchedulerUI.showConflictModal(...)`.
*   **Step 4: Expose in `schedulerUI.js`**: Add `showConflictModal: showConflictModal,` to the `return` statement of `GreenhouseSchedulerUI` in `schedulerUI.js`.

### Function: `clearFormInputs`
*   **Step 1: Copy to `schedulerUI.js`**: Copy the entire `clearFormInputs` function from `GreenhousePatientApp.js` to `schedulerUI.js`.
*   **Step 2: Remove from `GreenhousePatientApp.js`**: Delete the `clearFormInputs` function from `GreenhousePatientApp.js`.
*   **Step 3: Update Calls in `GreenhousePatientApp.js`**: Find all instances of `clearFormInputs(...)` in `GreenhousePatientApp.js` and change them to `GreenhouseSchedulerUI.clearFormInputs(...)`.
*   **Step 4: Expose in `schedulerUI.js`**: Add `clearFormInputs: clearFormInputs,` to the `return` statement of `GreenhouseSchedulerUI` in `schedulerUI.js`.

### Function: `resetForm`
*   **Step 1: Copy to `schedulerUI.js`**: Copy the entire `resetForm` function from `GreenhousePatientApp.js` to `schedulerUI.js`.
*   **Step 2: Remove from `GreenhousePatientApp.js`**: Delete the `resetForm` function from `GreenhousePatientApp.js`.
*   **Step 3: Update Calls in `GreenhousePatientApp.js`**: Find all instances of `resetForm(...)` in `GreenhousePatientApp.js` and change them to `GreenhouseSchedulerUI.resetForm(...)`.
*   **Step 4: Expose in `schedulerUI.js`**: Add `resetForm: resetForm,` to the `return` statement of `GreenhouseSchedulerUI` in `schedulerUI.js`.

### Function: `editAppointment`
*   **Step 1: Copy to `schedulerUI.js`**: Copy the entire `editAppointment` function from `GreenhousePatientApp.js` to `schedulerUI.js`.
*   **Step 2: Remove from `GreenhousePatientApp.js`**: Delete the `editAppointment` function from `GreenhousePatientApp.js`.
*   **Step 3: Update Calls in `GreenhousePatientApp.js`**: Find all instances of `editAppointment(...)` in `GreenhousePatientApp.js` and change them to `GreenhouseSchedulerUI.editAppointment(...)`.
*   **Step 4: Expose in `schedulerUI.js`**: Add `editAppointment: editAppointment,` to the `return` statement of `GreenhouseSchedulerUI` in `schedulerUI.js`.

## Verification Steps:

1.  **Run Unit Tests**: Execute any existing unit tests related to `GreenhousePatientApp.js` and `schedulerUI.js` to ensure no regressions.
2.  **Manual Testing**:
    *   Verify that the patient appointment scheduling functionality works as expected.
    *   Test modal display, form clearing, and appointment editing.
3.  **Code Review**: Review the modified files to ensure adherence to coding standards and proper separation of concerns.
