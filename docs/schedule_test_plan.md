# Schedule Test Plan

## 1. Introduction

This document outlines the testing strategy for the Greenhouse Mental Health scheduling application. The primary goal is to ensure a smooth deployment and robust operation of the application within the Wix platform. A core principle of this plan is a rigorous focus on pre-deployment testing to identify and resolve issues before they impact the live environment. The scheduler is a custom JavaScript application hosted on GitHub Pages and integrated into the main Wix website (`greenhousementalhealth.org`). This test plan focuses on the unique challenges presented by this architecture, including cross-origin asset loading, DOM integration, and backend communication with Wix Velo.

## 2. Scope

### In Scope

*   Testing of the public-facing appointment request functionality.
*   Testing of the administrator-facing dashboard for schedule management and conflict resolution.
*   Testing of the administrator-facing page for individual appointment management.
*   Integration testing between the frontend (GitHub Pages) and the Wix Velo backend.
*   Verification of the application's injection and rendering on the live Wix site.
*   Security testing of user roles and permissions.
*   Cross-browser and responsive testing.

### Out of Scope

*   Testing the underlying Wix platform infrastructure.
*   Load and stress testing beyond anticipated user loads.
*   Testing third-party integrations not directly related to the scheduler.

## 3. Test Objectives

*   Verify that all frontend assets (JavaScript, CSS) load from GitHub Pages onto the Wix site without errors (e.g., CORS).
*   Ensure the scheduler UI is correctly and consistently injected into the designated DOM elements on the Wix page.
*   Validate all interactions with the Wix Velo backend, including data creation, retrieval, updates, and deletion.
*   Confirm that the application's security model correctly enforces access controls for public users and administrators.
*   Ensure the application is functional, visually correct, and responsive across all supported browsers and devices.
*   Identify and document all bugs, regressions, and usability issues before deployment.

## 4. Testing Types & Strategy

### 4.1. Unit Testing

*   **Objective:** To test individual JavaScript modules and functions in isolation.
*   **Strategy:** Develop and utilize native, custom-built testing utilities to conduct unit tests on individual JavaScript modules. These lightweight tools will be created to provide essential assertion, test running, and mocking capabilities without introducing external framework dependencies. Tests will focus on the complex logic within `scheduler.js`, `app.js`, `dashboard.js`, and `admin.js`, with mocks created for Velo backend functions and other dependencies.

### 4.2. Integration Testing

*   **Objective:** To test the interaction between different parts of the system.
*   **Strategy:**
    *   **Frontend-Backend Integration:** Test the communication between the frontend JavaScript and the Wix Velo backend functions. Verify that data is passed correctly and that the frontend handles both successful responses and errors gracefully.
    *   **DOM Integration:** Test the injection of the scheduler's UI into the Wix page. This includes testing the selectors' robustness and handling potential timing issues.

### 4.3. End-to-End (E2E) Testing

*   **Objective:** To test complete user flows from start to finish.
*   **Strategy:** Simulate real user scenarios in a test environment that closely mimics the production Wix site. These tests should cover both public user and administrator flows.

### 4.4. Cross-Browser & Cross-Device Testing

*   **Objective:** To ensure a consistent experience across different browsers and screen sizes.
*   **Strategy:** Manually test the application on the latest versions of major browsers (Chrome, Firefox, Safari, Edge) and on different devices (desktop, tablet, mobile).

### 4.5. Security Testing

*   **Objective:** To identify and mitigate security vulnerabilities.
*   **Strategy:**
    *   **Permission Testing:** Attempt to access administrator functions and data as a public user.
    *   **Input Validation:** Test for vulnerabilities like cross-site scripting (XSS) by entering malicious data into input fields.
    *   **Velo Permissions:** Review and test the permissions set on Wix Data Collections to ensure they are not overly permissive.

### 4.6. Performance Testing

*   **Objective:** To ensure the application is fast and responsive.
*   **Strategy:**
    *   **Asset Loading:** Measure the time it takes for all scheduler assets to load on the Wix page.
    *   **UI Rendering:** Measure the time it takes for the UI to be rendered after the assets are loaded.
    *   **Backend Response Time:** Measure the response times of the Velo backend functions.

## 5. Wix Platform Specific Test Cases

### 5.1. Local Environment Simulation

To catch issues before deployment, a local test environment will be developed to simulate the Wix production environment as closely as possible.

*   **TC-WIX-01:** Create and maintain a local HTML file (`test/schedule_test_page.html`) that accurately mimics the DOM structure, including element IDs and classes, of the live `/schedule` page on Wix.
*   **TC-WIX-02:** Use a local web server to serve the project files. The test page will be loaded from the file system or a local server, while the JS/CSS assets will be loaded from a different origin (e.g., a different port) to simulate the cross-origin nature of the production setup and test for potential CORS issues locally.
*   **TC-WIX-03:** Develop a mock Velo backend script. This script will define mock functions (e.g., `getAppointments`, `createAppointment`) that return realistic sample data and simulate success/error responses, allowing for frontend testing without depending on the live Wix backend.
*   **TC-WIX-04:** Run all functional tests (e.g., creating an appointment, resolving conflicts) within this local environment first to ensure the core logic works before testing on the live Wix test site.

### 5.2. Asset Loading & CORS (on Wix Test Site)

*   **TC-WIX-05:** Verify that all scheduler-related `.js` and `.css` files are successfully fetched from the GitHub Pages URL when the schedule page on Wix is loaded.
*   **TC-WIX-06:** Confirm that there are no Cross-Origin Resource Sharing (CORS) errors in the browser console on the live test site.
*   **TC-WIX-07:** Test the application's behavior with browser cache enabled and disabled to catch caching-related issues.

### 5.3. DOM Injection (on Wix Test Site)

*   **TC-WIX-08:** Ensure the main scheduler container is injected into the correct target element on the Wix page.
*   **TC-WIX-09:** Verify that the UI renders correctly and that all expected elements are present.
*   **TC-WIX-10:** Test for JavaScript errors related to DOM elements not being found, which could indicate timing issues.
*   **TC-WIX-11:** (If possible) Test the injection's resilience by making minor, non-breaking changes to the Wix page structure in the editor.

### 5.4. Velo Backend Integration (on Wix Test Site)

*   **TC-WIX-12:** For each Velo backend function called from the frontend, verify that the call is successful and returns the expected data in the correct format.
*   **TC-WIX-13:** For each backend function, test error handling by simulating invalid inputs or server-side errors.
*   **TC-WIX-14:** Verify that data created or updated via the frontend is correctly persisted in the corresponding Wix Data Collection.

### 5.5. Authentication & Permissions (on Wix Test Site)

*   **TC-WIX-15:** As a public (unauthenticated) user, confirm that only the appointment request form is accessible.
*   **TC-WIX-16:** As a public user, attempt to navigate directly to the admin dashboard URL and verify that access is denied.
*   **TC-WIX-17:** As an administrator, log in and verify that the admin dashboard and individual appointment admin pages are accessible.
*   **TC-WIX-18:** Attempt to call administrator-only Velo backend functions directly from the browser console without being authenticated as an admin and verify that the calls fail with an authorization error.

## 6. High-Level Test Scenarios

### 6.1. Public User

*   **TS-PUB-01:** A user navigates to the schedule page, fills out the appointment request form, and submits it. The user receives a confirmation message.
*   **TS-PUB-02:** A user views the list of available services on the appointment request form.

### 6.2. Administrator

*   **TS-ADM-01:** An administrator logs into the Wix site and navigates to the schedule dashboard. The dashboard loads and displays the weekly schedule with appointments.
*   **TS-ADM-02:** The dashboard highlights a scheduling conflict between two appointments. The administrator resolves the conflict by editing one of the appointments.
*   **TS-ADM-03:** An administrator creates a new appointment directly from the dashboard.
*   **TS-ADM-04:** An administrator searches for a specific appointment, views its details on the individual admin page, updates the appointment's status, and saves the changes.
*   **TS-ADM-05:** An administrator deletes an appointment from the system.

## 7. Defect Management

*   **Reporting:** All defects will be reported as issues in the project's GitHub repository.
*   **Tracking:** Each issue will be assigned a priority level (e.g., Blocker, Critical, Major, Minor) and tracked until it is resolved and verified.
*   **Resolution:** Developers will address defects based on their priority. Resolved defects will be deployed to the test environment for verification.

## 8. Tools & Environments

*   **Test Environment:** A dedicated Wix test site that is a clone of the production site. This site will be configured to load scripts from the GitHub Pages repository.
*   **Browsers:**
    *   Google Chrome (latest version)
    *   Mozilla Firefox (latest version)
    *   Apple Safari (latest version)
    *   Microsoft Edge (latest version)
*   **Bug Tracking:** GitHub Issues.
