# Scheduler Security Analysis (As-Built)

**Status: This document describes the current security implementation of the scheduler. The planned Role-Based Access Control (RBAC) refactoring remains incomplete.**

## 1. Overview

This document provides an analysis of the current security model for the scheduler application. The application currently operates in an insecure "default-to-patient" mode and lacks the Role-Based Access Control (RBAC) specified in planning documents.

While a partial refactoring of the backend was initiated to improve security, the frontend was never updated to support a role-based system. This creates significant security vulnerabilities.

---

## 2. Current Security State: "Security by Obscurity"

The current implementation does not have a true RBAC system. The frontend logic, in both the Velo page code and the embedded static script, simply defaults to showing the patient view.

-   **`apps/frontend/schedule/Schedule.js` (Velo):** On page load, the code programmatically expands the `#patientContainer` and collapses the `#dashboardContainer` and `#adminContainer`. This is a hardcoded behavior and does **not** involve checking the user's role.
-   **`docs/js/scheduler.js` (Static):** The orchestrator script hardcodes the initial view to `'patient'`. While it contains a `switchView` function, there is no secure mechanism that prevents a savvy user from potentially triggering it.

This is a form of "security by obscurity." The admin and dashboard views are hidden from typical users but are still present in the code and could potentially be accessed.

---

## 3. Backend Implementation: A Half-Finished Refactor

A security refactoring of the backend was started but never completed.

-   **New Secure Endpoints Exist:** New files like `createAppointmentSecure.web.js` and `permissions.web.js` were created. These files correctly implement server-side permission checks using `wix-users-backend`, ensuring that a user's role is verified before any sensitive action is taken.
-   **Old Insecure Endpoints Remain:** The original backend functions (e.g., `createAppointment.web.js`) were **not removed**. They exist in parallel with the new secure versions.
-   **Frontend Not Migrated:** The frontend code was **never updated** to call the new `*Secure.web.js` endpoints. It still makes calls to the original, insecure backend functions.

This leaves the application in a highly vulnerable state. The secure backend logic exists but is not being used.

---

## 4. Summary of Security Vulnerabilities

1.  **No Frontend Role-Based UI:** Administrative UI components are loaded in the browser for all users and are simply hidden. There is no guarantee they cannot be accessed.
2.  **Insecure Backend Endpoints Are Still in Use:** The frontend continues to call the original backend functions that lack proper server-side permission validation.
3.  **Inconsistent Security Model:** The presence of both secure and insecure backend endpoints makes the system's security posture unpredictable and difficult to maintain.

---

## 5. Action Plan: Completing the RBAC Implementation

To secure the scheduler, the original plan laid out in this document must be fully executed. The following actions are critical:

1.  **Implement a Role-Check on the Frontend:**
    -   The Velo page code (`Schedule.js`) must be the single source of truth for the user's role on the frontend.
    -   On page load, it should call a secure backend function to fetch the current user's role.
    -   Based on the role, it should *only* render or initialize the UI components appropriate for that user. For guests or patients, the dashboard and admin components should never be rendered at all.

2.  **Migrate Frontend to Secure Endpoints:**
    -   Every `fetch` call in the frontend JavaScript (`Schedule.js` and the `docs/js/*App.js` files) must be audited.
    -   All calls to old backend functions must be replaced with calls to their `*Secure.web.js` equivalents.

3.  **Deprecate and Remove Insecure Backend Functions:**
    -   Once the frontend has been fully migrated, all the old, insecure backend files (`createAppointment.web.js`, `getAppointments.web.js`, etc.) must be **deleted** from the repository to ensure they can never be called again.
