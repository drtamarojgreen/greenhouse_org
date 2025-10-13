# Scheduler Application System Overview

## Architecture Overview

The system is a modular JavaScript application designed to be embedded into a Wix website. Its architecture consists of several key components that work together to deliver the scheduling functionality.

*   **Central Loader (`greenhouse.js`):** This is the main entry point script. It runs on every page of the Wix site, detects the URL path, and determines which application module needs to be loaded. For the scheduler (e.g., on the `/schedule/` page), it initiates the loading process for the scheduler components.

*   **Utility Library (`GreenhouseUtils.js`):** A shared library providing core functionalities used by all other parts of the application. Its responsibilities include:
    *   Dynamically loading other JavaScript files.
    *   Waiting for specific DOM elements to appear on the Wix site before proceeding.
    *   Managing a shared application state object.
    *   Displaying system-wide notifications and errors.

*   **Scheduler Orchestrator (`scheduler.js`):** This script contains the high-level logic for the scheduling feature. It orchestrates the entire process:
    *   It waits for the necessary DOM container elements to be rendered by the Wix site.
    *   It loads the UI builder (`schedulerUI.js`).
    *   It directs the UI builder to create all the necessary HTML elements for the current view (e.g., patient form, admin calendar).
    *   It dynamically loads the specific application logic script (e.g., `GreenhousePatientApp.js`) for the rendered view.
    *   It passes the newly created container elements to the application script's initialization function.

*   **UI Builder (`schedulerUI.js`):** This script is solely responsible for creating the HTML DOM elements that make up the user interface for the different scheduler views. It receives a container element and populates it with the required forms, calendars, buttons, and other UI components.

*   **View-Specific Applications (e.g., `GreenhousePatientApp.js`):** These are the final pieces, containing the detailed business logic for a specific view. For example, `GreenhousePatientApp.js` handles the patient-facing appointment request form.

## Corrected Data Fetching Logic

The application has been corrected to address a critical timing issue. Previously, data fetching was initiated automatically upon script initialization, which often occurred before the UI was fully rendered in the DOM, leading to errors.

**The correct, current behavior is as follows:**

1.  **UI First:** The application first renders the complete user interface, including a specific button to initiate data loading (e.g., "View My Appointments").
2.  **User-Initiated Fetch:** Data fetching (e.g., for existing appointments or available services) is **only** triggered after the user explicitly clicks this button.
3.  **No Automatic Fetching:** The `setTimeout` call that previously caused an automatic, premature data fetch in `GreenhousePatientApp.js` has been removed. The application now correctly waits for user interaction before making any backend calls.

This ensures that UI elements are always present in the DOM before any script attempts to access or manipulate them, creating a stable and error-free user experience.

## Backend Functions

The frontend application communicates with backend services composed of serverless functions (e.g., `getAppointments.web.js`, `getServices.web.js`). These functions are called via `fetch` requests to retrieve or update data in the database.