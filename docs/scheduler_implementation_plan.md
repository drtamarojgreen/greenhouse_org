# Scheduler Permissions: Implementation Plan

## 1. Overview

This document outlines the necessary changes to the scheduler application to implement a complete, role-based permissions system. The goal is to refactor the frontend and backend code to ensure that UI elements and data access are securely managed based on the user's role (e.g., Public, Member, or Administrator).

The implementation will be divided into three core areas:
1.  **Frontend Velo JS:** The page-level Velo code that acts as the primary controller.
2.  **Frontend Embedded JS:** The `scheduler.js` script running inside the HTML Component.
3.  **Backend Velo JS:** The secure web modules that provide data and execute actions.

---

## 2. Velo Page Code (`apps/frontend/Scheduler.js`)

**Objective:** This code will act as the frontend "gatekeeper." It determines the user's role, controls native page elements, fetches the appropriate data from the backend, and passes the necessary information to the embedded `scheduler.js`.

**Required Changes:**

1.  **Determine User Role:** On page load (`$w.onReady`), use `wix-users.currentUser.getRoles()` to securely check if the current user has the "Administrator" or "Developer" role. Store this result in a variable (e.g., `isAdmin`).

2.  **Control Native Elements:** Use the `isAdmin` variable to immediately show or hide any native Wix elements on the page that are outside the main HTML component. For example, an admin-only settings button or a page title.

3.  **Fetch Role-Specific Data:** Based on the `isAdmin` variable, call the appropriate backend web modules.
    -   If `isAdmin` is `true`, call secure functions like `getAppointments()` to fetch sensitive, detailed data.
    -   If `isAdmin` is `false`, call public-safe functions like `getPublicAvailability()`.

4.  **Communicate with Embedded JS:** After determining the role and fetching the initial data, send a message to the `scheduler.js` HTML Component via `postMessage()`. This message should contain, at a minimum:
    -   The simplified role (`'admin'` or `'public'`).
    -   The data fetched from the backend.

```javascript
// Conceptual Example for apps/frontend/Scheduler.js
import wixUsers from 'wix-users';
import { getAppointments } from 'backend/getAppointments.web';
import { getPublicAvailability } from 'backend/getPublicAvailability.web';

$w.onReady(async () => {
    const schedulerComponent = $w('#schedulerHost');
    const roles = await wixUsers.currentUser.getRoles();
    const isAdmin = roles.some(r => r.name === 'Administrator' || r.name === 'Developer');

    const message = {
        role: isAdmin ? 'admin' : 'public',
        data: isAdmin ? await getAppointments() : await getPublicAvailability()
    };

    schedulerComponent.postMessage(message);
});
```

---

## 3. Embedded Scheduler JS (`docs/js/scheduler.js`)

**Objective:** This script will be refactored into a simple "view" component. It should not contain any permission logic itself; it will only render the UI based on the instructions it receives from the Velo page code.

**Required Changes:**

1.  **Implement Message Listener:** Create a `window.onmessage` event listener as the single entry point for the script.

2.  **Remove Internal Logic:** All existing code that attempts to determine user status or fetch data independently must be removed.

3.  **Create Rendering Functions:** Implement distinct rendering functions, such as `renderAdminView(data)` and `renderPublicView(data)`.

4.  **Route Based on Role:** Inside the `onmessage` listener, inspect the `role` from the received message and call the corresponding rendering function, passing in the `data` from the message.

```javascript
// Conceptual Example for docs/js/scheduler.js

window.onmessage = (event) => {
    if (!event.data) return;

    const { role, data } = event.data;

    if (role === 'admin') {
        renderAdminView(data);
    } else {
        renderPublicView(data);
    }
};

function renderAdminView(appointments) {
    // Build UI for the admin dashboard using the full appointment data
}

function renderPublicView(publicSlots) {
    // Build UI for the public booking form using the public availability data
}
```

---

## 4. Backend Web Modules (`apps/wv/backend/`)

**Objective:** To provide a secure data and action layer. Every function must assume it could be called by a malicious user and must perform its own permission checks.

**Required Changes:**

1.  **Audit All Functions:** Review every file in the `apps/wv/backend/` directory.

2.  **Implement Permission Blocks:** At the top of every exported function, add a security block that uses `wix-users-backend.currentUser.getRoles()` to get the user's roles directly from the server.

3.  **Enforce Permissions:**
    -   For functions that perform sensitive or destructive actions (e.g., `deleteAppointment.web.js`, `resolveConflict.web.js`, `getAppointments.web.js`), check if the user is an admin. If not, `throw new Error("Permission Denied")` immediately.
    -   For functions that are intended for public use, ensure they only query and return safe, non-sensitive data.

4.  **Adopt Modern Standards:** Ensure all new backend web modules use the `.web.js` extension.

```javascript
// Conceptual Example for a secure backend function
import { webMethod, Permissions } from 'wix-web-module';
import wixUsersBackend from 'wix-users-backend';

export const deleteAppointment = webMethod(Permissions.SiteMember, async (appointmentId) => {
    // 1. Get roles from the server
    const roles = await wixUsersBackend.currentUser.getRoles();
    const isAdmin = roles.some(r => r.name === 'Administrator' || r.name === 'Developer');

    // 2. Enforce permissions
    if (!isAdmin) {
        throw new Error("Permission Denied: You cannot delete appointments.");
    }

    // 3. Proceed with action if check passes
    // ... logic to delete the appointment ...
});
```

---

## 5. Rigorous Testing Guide

A robust testing strategy is essential for a secure and reliable permissions system. This guide outlines a rigorous architecture based on established software testing principles, without requiring external libraries.

### 5.1. Core Testing Principles

Our test suite will be designed around the following principles to ensure it is clean, maintainable, and effective:

-   **DRY (Don't Repeat Yourself):** Avoid duplication by creating reusable helper functions for common setup tasks, such as logging in a user with a specific role or creating mock data.
-   **FIRST (Fast, Independent, Repeatable, Self-Validating, Timely):**
    -   **Fast:** Tests must run quickly. By mocking all external dependencies (like Velo APIs and database calls), we eliminate network latency and ensure rapid feedback.
    -   **Independent:** Each test must be runnable in isolation and in any order. State must be reset before each test to prevent cascading failures.
    -   **Repeatable:** A test must produce the same result every time. Our mock-based approach guarantees this by providing a consistent, predictable environment.
    -   **Self-Validating:** Tests must either pass or fail without requiring manual inspection of output. A custom assertion library will be used to programmatically check outcomes.
    -   **Timely:** Tests should be written concurrently with the feature code.
-   **DAMP (Descriptive and Meaningful Phrases):** Test names should be descriptive sentences that clearly communicate their purpose and intent, making the test suite easy to read and understand.

### 5.2. Proposed Test Suite Architecture

To adhere to these principles, we will organize the tests into a dedicated structure within the `test/` directory.

```
test/
├── lib/
│   ├── test_runner.js      # The custom runner (describe, it, assert)
│   ├── mocks.js            # Mock Velo APIs (wix-users, $w, etc.)
│   └── helpers.js          # Reusable DRY helper functions
├── unit/
│   ├── velo_page.test.js   # Unit tests for apps/frontend/Scheduler.js
│   └── backend_modules.test.js # Unit tests for apps/wv/backend/
└── bdd/
│   ├── permissions.feature.js  # BDD scenarios in a structured format
│   └── step_definitions.js   # Maps BDD steps to implementation
└── run_tests.html          # The HTML page to execute the suite
```

### 5.3. Unit Testing Implementation

Unit tests will focus on individual functions in isolation, using the architecture above to enforce our principles.

**Applying DRY:**
The `test/lib/helpers.js` file will contain functions to abstract away repetitive setup.

```javascript
// test/lib/helpers.js
import { mocks } from './mocks.js';

export function loginAs(role) {
    const roles = role ? [role] : [];
    const loggedIn = !!role;
    mocks.wixUsers._configure(loggedIn, roles);
    mocks.wixUsersBackend._configure(loggedIn, roles);
}

export async function loadSchedulerPage() {
    // Simulates the page load, calling the main onReady function
    await runVeloOnReady();
}
```

**Applying FIRST and DAMP:**
Each test will be independent and descriptive. The `test_runner.js` will handle resetting mocks between tests.

```javascript
// test/unit/backend_modules.test.js
import { describe, it, assert } from '../lib/test_runner.js';
import { loginAs } from '../lib/helpers.js';
import { deleteAppointment } from '../../apps/wv/backend/deleteAppointment.web.js'; // Assuming modules can be imported

describe('Backend Permissions: deleteAppointment', () => {

    it('should throw a permission error when a standard member tries to delete an appointment', async () => {
        // DAMP: The test name is a clear sentence.
        // FIRST: This test is independent and self-validates.
        loginAs('Member'); // DRY: Using a helper for setup.
        let caughtError = null;

        try {
            await deleteAppointment('some-id');
        } catch (e) {
            caughtError = e;
        }

        assert.isTrue(caughtError !== null, 'An error should have been thrown');
        assert.strictEqual(caughtError.message, 'Permission Denied: You cannot delete appointments.');
    });
});
```

### 5.4. BDD Testing Implementation

BDD tests verify end-to-end behavior using the same DRY helpers and mock environment. This approach is inherently DAMP.

**Feature File (`test/bdd/permissions.feature.js`):**
Scenarios are defined declaratively.

```javascript
export const schedulerPermissionsFeature = {
    feature: 'Scheduler Role Permissions',
    scenarios: [
        {
            name: 'Administrator views the scheduler',
            steps: [
                'Given I am logged in as an "Administrator"',
                'When I navigate to the scheduler page',
                'Then I should see the "Admin Dashboard"',
                'And I should not see the "Public Scheduler"',
            ]
        },
        // ... other scenarios
    ]
};
```

**Step Definitions (`test/bdd/step_definitions.js`):**
Steps are mapped to the reusable helper functions.

```javascript
import { loginAs, loadSchedulerPage } from '../lib/helpers.js';
import { assertSees, assertDoesNotSee } from '../lib.assert_helpers.js'; // More helpers for DRY

export const stepDefinitions = {
    // "Given I am logged in as an {string}"
    /^Given I am logged in as an "(.*)"$/: (role) => {
        loginAs(role);
    },
    // "When I navigate to the scheduler page"
    /^When I navigate to the scheduler page$/: async () => {
        await loadSchedulerPage();
    },
    // "Then I should see the {string}"
    /^Then I should see the "(.*)"$/: (elementName) => {
        assertSees(elementName);
    },
    // "And I should not see the {string}"
    /^And I should not see the "(.*)"$/: (elementName) => {
        assertDoesNotSee(elementName);
    }
};
```

This structured, principle-driven approach provides a truly rigorous and maintainable test suite without requiring external frameworks.
