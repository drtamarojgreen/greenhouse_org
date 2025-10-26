# Implementation Plan: Scheduler Modal and Instruction Popup

## 1. Project Goal

To enhance the user interface of the patient scheduling view by refactoring two key components:
1.  **Calendar Modal:** The patient calendar, currently a static element on the page, will be moved into a modal dialog. This modal will only become visible when the user interacts with the date selection input, creating a more focused workflow.
2.  **Instruction Popup:** The instructional text will be moved into a separate, dismissible popup. This will reduce initial screen clutter and make the instructions available on demand.

## 2. Detailed Component Modification Strategy

### 2.1. `schedulerUI.js` (UI Generation)

This file is responsible for building the DOM elements. The changes will be as follows:

- **Step 1: Create Modal Container Function:**
  - A new function, `buildCalendarModal()`, will be implemented.
  - This function will generate a `div` for the modal overlay (`#greenhouse-calendar-modal-overlay`) and a `div` for the modal content (`#greenhouse-calendar-modal-content`).
  - The existing calendar-building logic from `buildPatientCalendarUI` will be called *inside* this new modal structure.
  - A "Close" button will be added to the modal content.

- **Step 2: Create Popup Container Function:**
  - A new function, `buildInstructionsPopup()`, will be implemented.
  - This function will generate a container `div` for the instruction text (`#greenhouse-instructions-popup`).
  - It will call the existing `buildInstructionsList` function to populate the content.
  - A "Close" button will be added to the popup.

- **Step 3: Integrate into Patient View:**
  - The main `buildPatientFormUI` function will be updated to:
    - Call the new `buildCalendarModal()` and `buildInstructionsPopup()` functions to append the (initially hidden) modal and popup elements to the DOM.
    - Add a "Show Instructions" button (`#greenhouse-show-instructions-btn`) to the patient form area.

- **Step 4: Refactor Instruction Panel:**
  - The existing `createInstructionsPanel` will be renamed to `buildAppointmentsListAndPanel` and will be modified to only create the appointments list, preventing the duplication of the instruction text.

### 2.2. `docs/css/schedule.css` (Styling)

This file will be updated to control the appearance and visibility of the new UI elements.

- **Step 1: Add Modal Styles:**
  - CSS rules will be created for `.greenhouse-modal-overlay` to make it a fixed-position, full-screen, semi-transparent backdrop.
  - CSS rules will be added for `.greenhouse-modal-content` to center it, give it a border, background, and appropriate dimensions.

- **Step 2: Add Popup Styles:**
  - CSS rules will be added to style the `.greenhouse-popup-container` and position it relative to its trigger element.

- **Step 3: Add Visibility Control:**
  - A `.greenhouse-hidden` class will be created to control visibility (`display: none`).

### 2.3. `GreenhousePatientApp.js` (Application Logic)

This file handles user interaction and business logic.

- **Step 1: Add State Properties:**
  - New properties will be added to the `patientAppState` object to hold references to the new modal and popup elements.

- **Step 2: Implement Modal Visibility Logic:**
  - An event listener will be added to the date selection input. On `focus`, it will remove the `.greenhouse-hidden` class from the calendar modal.
  - Event listeners will be added to the modal's "Close" button and the overlay to add the `.greenhouse-hidden` class back, hiding the modal.

- **Step 3: Implement Popup Visibility Logic:**
  - An event listener will be added to the "Show Instructions" button. On `click`, it will toggle the visibility of the instruction popup.
  - An event listener on the popup's "Close" button will hide the popup.

### 2.4. `scheduler.js` (Orchestration)

- **Step 1: Update Function Call:**
  - The call to `createInstructionsPanel` in the `renderView` function will be updated to call the newly renamed `buildAppointmentsListAndPanel` function.

## 3. Testing Plan

A thorough testing process will be required to ensure the new functionality works as expected and does not introduce regressions.

- **Unit Testing (Conceptual):**
  - **`schedulerUI.js`:** Verify that the `buildCalendarModal` and `buildInstructionsPopup` functions return the correct HTML structures.
  - **`GreenhousePatientApp.js`:** Test the logic for showing and hiding the modal and popup in isolation.

- **Integration Testing:**
  - **Objective:** Ensure all components work together correctly in a simulated browser environment.
  - **Steps:**
    1.  Start a local web server to serve the static files.
    2.  Create a Playwright script (`verify_modal_popup.py`) that:
        - Navigates to the test harness page (`tests/pages/schedule_test_page.html`).
        - Waits for the application to initialize.
        - Clicks the date input and verifies that the modal appears.
        - Takes a screenshot of the open modal.
        - Clicks the modal's "Close" button and verifies that it disappears.
        - Clicks the "Show Instructions" button and verifies that the popup appears.
        - Takes a screenshot of the open popup.
        - Clicks the popup's "Close" button and verifies that it disappears.

- **User Acceptance Testing (UAT):**
  - **Objective:** Manually verify the user experience.
  - **Steps:**
    1.  Open the test harness in a browser.
    2.  Confirm that the instruction list is not visible on page load.
    3.  Click the "Show Instructions" button and confirm the popup appears with the correct content.
    4.  Close the popup and confirm it disappears.
    5.  Click on the date input field and confirm the calendar modal appears.
    6.  Select a date and confirm the modal closes and the date is populated in the input.
    7.  Re-open the modal and close it using the "Close" button.
    8.  Re-open the modal and close it by clicking on the overlay.

## 4. Evaluation Criteria

The success of this refactoring will be evaluated based on the following criteria:

- **Functional Correctness:** The modal and popup must appear and disappear reliably on all supported browsers.
- **UI/UX Improvement:** The initial view of the patient form should be visibly less cluttered. The workflow for selecting a date and viewing instructions should feel intuitive.
- **No Regressions:** The core functionality of the scheduler (e.g., proposing an appointment) must remain unaffected.
- **Code Quality:** The new code must adhere to the existing coding style and conventions, including the `.greenhouse-` prefix for all new CSS classes.
- **Performance:** The changes should not introduce any noticeable performance degradation.

This detailed plan ensures that all aspects of the implementation, from coding to testing and evaluation, are clearly defined and can be executed efficiently.
