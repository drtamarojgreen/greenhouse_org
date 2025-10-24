# Scheduler Implementation Details (As-Built)

**Status: This document reflects the current, implemented architecture of the scheduler and supersedes any previous plans.**

## 1. Overview

This document outlines the technical implementation of the Greenhouse scheduler application. The chosen architecture is that of a **self-contained, embedded application**. The core logic resides in a suite of static JavaScript files, which are injected into the host Wix page and are responsible for rendering the UI and communicating with the backend.

This approach is the reverse of the one proposed in early planning documents; the embedded JavaScript is the primary controller, not the Velo page code.

---

## 2. Core Architecture: Self-Contained Application

The implementation is centered around `docs/js/scheduler.js`, which acts as the main orchestrator for the application.

1.  **Initiation:** The application is loaded onto the page by the site-wide `greenhouse.js` script.
2.  **Orchestration (`scheduler.js`):** Upon loading, `scheduler.js` takes control. It does **not** wait for instructions from the Velo page via `postMessage`.
3.  **View Management:** It determines which view to display (defaulting to the "patient" view).
4.  **Dynamic Loading:** It dynamically loads the required application logic for the current view (e.g., `GreenhousePatientApp.js` for the patient view).
5.  **UI Rendering:** It calls functions from `schedulerUI.js` to build the necessary HTML elements and injects them into the designated container elements on the Velo page.
6.  **Backend Communication:** The application logic files (`GreenhousePatientApp.js`, etc.) communicate **directly** with the Velo backend web modules (`/_functions/...`) using the `fetch` API.

There is no significant role-based logic in the Velo page code (`apps/frontend/schedule/Schedule.js`). Its primary purpose is to provide the host containers for the static application and to handle page-level setup.

---

## 3. Component Breakdown

### 3.1. Velo Page Code (`apps/frontend/Scheduler.js`)

-   **Role:** Minimalist Host.
-   **Responsibilities:**
    -   Provides the empty container elements (`#patientContainer`, `#dashboardContainer`, etc.) that the static application will populate.
    -   Handles the `$w.onReady` event.
    -   Manages the initial visibility of the containers (e.g., expanding the patient container and collapsing the others).
    -   Does **not** perform user role checks or pass data to the embedded script.

### 3.2. Embedded Orchestrator (`docs/js/scheduler.js`)

-   **Role:** Primary Controller.
-   **Responsibilities:**
    -   Waits for its own dependencies (`GreenhouseUtils.js`, `schedulerUI.js`) to become available.
    -   Initializes the application flow.
    -   Contains a `switchView` function that orchestrates the entire process of rendering a new view and initializing its logic. This includes clearing old content, rendering the new UI, and loading the new application script.
    -   Implements a `MutationObserver` as a resilience mechanism to detect if the Wix environment removes its UI elements, triggering a re-initialization if necessary.

### 3.3. Embedded UI Builder (`docs/js/schedulerUI.js`)

-   **Role:** Static View Factory.
-   **Responsibilities:**
    -   Contains functions to build the static HTML structure for all parts of the application (e.g., `buildPatientFormUI`, `buildDashboardLeftPanelUI`).
    -   It is responsible for **creation** of elements, but not for their dynamic updates or event handling.

### 3.4. Embedded Application Logic (`GreenhousePatientApp.js`, etc.)

-   **Role:** View-Specific Logic and Backend Communication.
-   **Responsibilities:**
    -   Contains the `init` function for a specific view.
    -   Handles all user interactions (e.g., form submissions, button clicks).
    -   Makes direct `fetch` calls to the Velo backend functions to get or post data.
    -   Performs dynamic UI updates (e.g., populating a list with fetched data, showing an error message).

### 3.5. Backend Web Modules (`apps/wv/backend/`)

-   **Role:** Secure Data Layer.
-   **Responsibilities:**
    -   Provide the API endpoints (`/_functions/...`) that the frontend calls.
    -   Contain all database queries and business logic (e.g., conflict checking).
    -   **Security:** As these endpoints are directly exposed to the client, it is assumed that each backend function performs its own permission checks to ensure a user is authorized to perform an action. This is a critical part of the security model.
