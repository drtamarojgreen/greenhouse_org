# Scheduler Security: From Demo to Role-Based Access Control

## 1. Overview

This document outlines the necessary steps to transition the scheduler application from its current demo-based implementation to a secure, Role-Based Access Control (RBAC) model. The current implementation renders all UI components (Patient, Dashboard, Admin) simultaneously, which is insecure and unsuitable for a production environment.

The transition involves implementing security checks on both the **frontend** (to control UI visibility) and the **backend** (to secure data and actions). This guide covers two primary contexts observed in the codebase:
- **Velo (`Schedule.js`)**: For integration within the Wix platform.
- **Standard Web (`scheduler.js`)**: For integration into a standard web page.

---

## 2. Current State Analysis

In both `Schedule.js` and `scheduler.js`, the initialization logic is "open by default":

- **`Schedule.js`**: The `initScheduler` function is called without any user context. Inside, it proceeds to initialize all three application modules (`initializePatientApp`, `initializeDashboardApp`, `initializeAdminApp`) and makes their UI components visible.
- **`scheduler.js`**: The `initializeApplication` function loads and initializes all app scripts (`GreenhouseDashboardApp.js`, `GreenhousePatientApp.js`, `GreenhouseAdminApp.js`) regardless of the user's identity or permissions.

This approach is a security risk, as it exposes administrative UI and functionality to all users, even if they cannot perform any actions.

---

## 3. Proposed RBAC Architecture

We will implement a standard RBAC model with the following components:

1.  **Roles**: Define a clear set of user roles.
    *   `ADMIN`: Full access to all scheduling data and administrative functions.
    *   `THERAPIST`: Access to the dashboard view to see their own schedule and manage appointments.
    *   `PATIENT`: Access to view their own appointments and schedule new ones.
    *   `GUEST` (or unauthenticated): No access to scheduler data; should be prompted to log in.

2.  **Backend Role Verification**: Create a secure backend endpoint that returns the current user's role. The frontend must not determine the role itself.
    *   **Velo**: This will be a backend function in a `.jsw` file that uses the `wix-users-backend` API to get the current user and looks up their assigned role from a database collection (e.g., a "UserProfiles" collection).
    *   **Standard Web**: This will be a standard API endpoint (e.g., `/api/v1/users/me`) that returns the logged-in user's session data, including their role.

3.  **Frontend Conditional Rendering**: The frontend will fetch the user's role on load and use it to conditionally render the appropriate UI and initialize the correct application logic.

---

## 4. Implementation Steps

### Step 1: Backend - Establish User Roles

This is the foundation. A system must exist to assign roles to users.

-   **Velo**:
    1.  Create a new Database Collection named `UserRoles`.
    2.  Add fields: `_id` (User ID from Wix Members), and `role` (Text).
    3.  Manually or programmatically populate this collection to assign roles to users.
-   **Standard Web**:
    1.  Ensure your user authentication system and database schema include a `role` field for each user.

### Step 2: Backend - Create a Role-Check Endpoint

The frontend needs a secure way to ask, "Who am I?".

-   **Velo (in a new `user.jsw` backend file)**:
    ```javascript
    // backend/user.jsw
    import { currentUser } from 'wix-users-backend';
    import wixData from 'wix-data';

    export async function getCurrentUserRole() {
      if (!currentUser.loggedIn) {
        return 'GUEST';
      }

      const userId = currentUser.id;
      const userRoleItem = await wixData.get('UserRoles', userId).catch(() => null);

      if (userRoleItem) {
        return userRoleItem.role;
      }

      // Default to PATIENT if logged in but no specific role found
      return 'PATIENT';
    }
    ```

-   **Standard Web (example using Express.js)**:
    ```javascript
    // routes/user.js
    router.get('/api/v1/users/me', (req, res) => {
      if (req.session && req.session.user) {
        // Return user data, including the role
        res.json({
          isLoggedIn: true,
          role: req.session.user.role,
          name: req.session.user.name
        });
      } else {
        res.json({ isLoggedIn: false, role: 'GUEST' });
      }
    });
    ```

### Step 3: Frontend - Implement Conditional Logic

Modify the initialization sequence to be role-aware.

-   **Velo (`Schedule.js`)**:
    ```javascript
    // At the top of the file
    import { getCurrentUserRole } from 'backend/user';

    // Modify the onReady function
    $w.onReady(async function () {
        const userRole = await getCurrentUserRole();
        initScheduler(userRole); // Pass the role to the main function
    });

    // Modify the initScheduler function
    async function initScheduler(role) {
        // ... existing setup ...

        // Hide all containers by default
        $w('#patientContainer').collapse();
        $w('#dashboardContainer').collapse();
        $w('#adminContainer').collapse();

        // Show UI and initialize apps based on role
        switch (role) {
            case 'ADMIN':
                $w('#dashboardContainer').expand();
                $w('#adminContainer').expand();
                initializeDashboardApp();
                initializeAdminApp();
                break;
            case 'THERAPIST':
                $w('#dashboardContainer').expand();
                initializeDashboardApp();
                break;
            case 'PATIENT':
                $w('#patientContainer').expand();
                initializePatientApp();
                break;
            default: // GUEST
                // Display a login message or redirect
                $w('#loginMessage').show(); // Assuming a login prompt element
                break;
        }

        // ... rest of the function
    }
    ```

-   **Standard Web (`scheduler.js`)**:
    ```javascript
    // Modify GreenhouseAppsScheduler.init
    async init() {
        // ...
        GreenhouseUtils.appState.isLoading = true;
        try {
            // Fetch user role first
            const response = await fetch('/api/v1/users/me'); // Your new endpoint
            const user = await response.json();
            const userRole = user.role; // e.g., 'ADMIN', 'PATIENT', 'GUEST'

            // ... waitForElement calls ...

            // Pass role to render and initialize functions
            await this.renderView(containers, userRole);
            await this.initializeApplication(containers, userRole);

            // ... rest of the function ...
        } catch (error) {
            // ...
        }
    }

    // Modify renderView and initializeApplication to accept the role
    async renderView(containers, role) {
        // ... clear containers ...
        switch (role) {
            case 'ADMIN':
                GreenhouseSchedulerUI.buildDashboardLeftPanelUI(containers.dashboardLeft);
                GreenhouseSchedulerUI.buildAdminFormUI(containers.repeaterLeft);
                break;
            // etc.
        }
    }

    async initializeApplication(containers, role) {
        switch (role) {
            case 'ADMIN':
                await GreenhouseUtils.loadScript('GreenhouseDashboardApp.js');
                await GreenhouseUtils.loadScript('GreenhouseAdminApp.js');
                GreenhouseDashboardApp.init(...);
                GreenhouseAdminApp.init(...);
                break;
            // etc.
        }
    }
    ```

---

## 5. Critical: Securing Backend API Endpoints

**Hiding the UI is not enough.** A malicious user can still directly call your backend functions. Every single backend data endpoint must be secured.

For **every backend function** (`getAppointments`, `createAppointment`, `deleteAppointment`, etc.), you must add role-based checks at the very beginning.

-   **Velo Backend Function Example (`appointments.jsw`)**:
    ```javascript
    import { currentUser } from 'wix-users-backend';
    import { getCurrentUserRole } from 'backend/user'; // Import your role function

    export async function deleteAppointment(appointmentId) {
      const role = await getCurrentUserRole();

      if (role !== 'ADMIN') {
        // Or check if user is the owner of the appointment
        throw new Error('You do not have permission to delete appointments.');
      }

      // --- Original delete logic proceeds here ONLY if check passes ---
      return wixData.remove('Appointments', appointmentId);
    }
    ```

By implementing both frontend UI controls and backend data-level security, the scheduler application will be properly secured for a production environment.