# Implementation Plan: Scheduler Modal and Instruction Popup

## 1. Project Goal

To enhance the user interface of the patient scheduling view by:
1.  Moving the calendar into a modal dialog that appears only when the user is ready to select a date.
2.  Placing the instructional text into a separate popup to reduce initial screen clutter.

This will create a more focused and guided experience for the user.

## 2. Component Modification Strategy

The implementation will require coordinated changes across the HTML-generating, styling, and logic-handling components of the scheduler application.

### `schedulerUI.js` (UI Generation)

This file is responsible for building the DOM elements. Its role will be to:
- **Create a Modal Container:** A new function, `buildCalendarModal()`, will be added. This function will generate the necessary `div` elements for a modal overlay and a modal content panel. The existing logic for building the calendar will be moved inside this new modal structure.
- **Create a Popup Container:** A new function, `buildInstructionsPopup()`, will be added to generate a container `div` for the instruction text.
- **Integrate into Patient View:** The main `buildPatientUI` function will be updated to call the new functions, appending the (initially hidden) modal and popup elements to the DOM.

### `docs/css/schedule.css` (Styling)

This file will be updated to control the appearance and visibility of the new UI elements.
- **Modal Styles:** CSS rules will be created for the modal overlay (e.g., `.modal-overlay`) to cover the screen and for the modal content panel (e.g., `.modal-content`) to position it correctly. A `.hidden` class will be used to control visibility (`display: none`).
- **Popup Styles:** CSS rules will be added to style the instruction popup and position it relative to its trigger element. It will also be hidden by default.

### `GreenhousePatientApp.js` (Application Logic)

This file handles user interaction and business logic. Its role will be to:
- **Manage Modal Visibility:**
    - It will add a `click` event listener to the date selection input field.
    - When the user clicks this field, the script will remove the `.hidden` class from the calendar modal, making it appear.
    - It will also implement the logic for closing the modal, such as via a "Close" button inside the modal or by clicking on the overlay.
- **Manage Popup Visibility:**
    - It will add a `click` event listener to an "info" icon or "Show Instructions" button.
    - This listener will toggle the visibility of the instruction popup.

### `scheduler.js` (Orchestration)

This file's role is primarily to ensure that the new UI components are loaded and initialized correctly within the existing view-switching framework. No significant logic changes are anticipated, but it will be reviewed to confirm that the new elements do not cause conflicts.

## 3. Step-by-Step Implementation Plan

1.  **Task 1: Create UI Structures in `schedulerUI.js`**
    - Implement the `buildCalendarModal()` function. It will create a parent `div` with class `.modal-overlay` and a child `div` with class `.modal-content`. The existing calendar container will be generated inside `.modal-content`.
    - Implement the `buildInstructionsPopup()` function to create a `div` for the popup content.
    - Modify `buildPatientUI` to call these two functions, ensuring the modal and popup are added to the main application container.

2.  **Task 2: Style Modal and Popup in `schedule.css`**
    - Add CSS for `.modal-overlay` to make it a fixed-position, full-screen, semi-transparent backdrop.
    - Add CSS for `.modal-content` to center it, give it a border, background, and appropriate dimensions.
    - Add CSS for the instruction popup.
    - Add a `.hidden { display: none; }` utility class.

3.  **Task 3: Implement Interaction Logic in `GreenhousePatientApp.js`**
    - In the `init` function, get DOM references to the modal, the date input field, and the modal's close button.
    - Attach a `click` event listener to the date input that removes the `.hidden` class from the modal.
    - Attach a `click` event listener to the close button that adds the `.hidden` class back to the modal.
    - Create or identify the trigger for the instruction list and add a `click` listener to toggle the popup's visibility.

4.  **Task 4: Verification and Review**
    - Review `scheduler.js` to ensure that the initialization and view-switching logic remains intact.
    - Manually test the patient view to confirm the new modal and popup functionality works as expected without regressions.
