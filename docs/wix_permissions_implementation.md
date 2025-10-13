# Wix Permissions Implementation for Scheduling Application

## 1. Overview

This document outlines the implementation of a granular, role-based permission system for the scheduling application on the Greenhouse Mental Health website. The goal is to display different views and components based on a user's specific role.

- **Anonymous Users & Standard Logged-in Users:** Will have access to the public-facing scheduling tools.
- **Administrators & Developers:** Will have access to internal scheduling management, dashboard, and conflict resolution tools.

---

## 2. User Role Definitions and Views

Access is now determined by specific roles, not just login status.

### 2.1. Public View (Default)

This view is shown to the following users:
-   Anonymous (not logged-in) users.
-   Logged-in users who are **not** assigned the "Administrator" or "Developer" role.

**Components Displayed:**
-   Weekly Schedule View
-   Monthly Schedule Modal Button
-   Schedule Appointment Form

### 2.2. Admin View (Privileged)

This view is **only** shown to logged-in users who have been assigned the **"Administrator"** or **"Developer"** role.

**Components Displayed:**
-   Conflict Resolution Calendar
-   Full Scheduling Calendars (Admin Dashboard)

---

## 3. Velo Implementation

This functionality is implemented using Velo by Wix. The logic checks the current user's assigned roles to determine which components to display.

### 3.1. Basic Principle: Managing Element Visibility

While client-side code cannot secure content, it can dynamically show or hide page elements based on a user's authentication status or roles. You can use the `$w` API to select elements and modify their properties, such as `hidden`, or use the `.show()` and `.hide()` methods.

For instance, you might show different content to logged-in members versus guests.

> **Example: Control Element Visibility by Login Status**
>
> ```javascript
> import wixUsers from "wix-users";
>
> $w.onReady(() => {
>   if (wixUsers.currentUser.loggedIn) {
>     $w("#memberContent").show(); // Show content for logged-in members
>     $w("#guestContent").hide();
>   } else {
>     $w("#guestContent").show(); // Show content for guests
>     $w("#memberContent").hide();
>   }
> });
> ```

This same principle is extended in our implementation to check for specific roles, not just login status.

### 3.2. Prerequisite: Create Roles in Wix

Before using the code, you must create the necessary roles in your Wix site's dashboard.
1.  Go to your site's **Dashboard**.
2.  Navigate to **Contacts -> Members -> Roles**.
3.  Create two roles with the exact names: `Administrator` and `Developer`.
4.  Assign these roles to the appropriate members.

### 3.3. Velo Page Code (Simple Implementation)

This code is for showing/hiding native Wix elements on your page.

```javascript
import wixUsers from 'wix-users';
import wixWindow from 'wix-window';

$w.onReady(async function () {
    const currentUser = wixUsers.currentUser;
    let hasAdminAccess = false;

    // Check if the user is logged in first
    if (currentUser.loggedIn) {
        // Get the user's roles
        const roles = await currentUser.getRoles();
        // Check if their roles include Administrator or Developer
        if (roles.some(role => role.name === "Administrator" || role.name === "Developer")) {
            hasAdminAccess = true;
        }
    }

    if (hasAdminAccess) {
        // --- USER HAS ADMIN/DEVELOPER ACCESS ---
        console.log("User has admin access. Showing admin view.");
        $w('#conflictResolutionView').show();
        $w('#fullSchedulingCalendars').show();
        $w('#weeklyScheduleView').hide();
        $w('#openMonthlyModalButton').hide();
        $w('#scheduleAppointmentForm').hide();
    } else {
        // --- USER HAS PUBLIC ACCESS ---
        console.log("User has public access. Showing public view.");
        $w('#weeklyScheduleView').show();
        $w('#openMonthlyModalButton').show();
        $w('#scheduleAppointmentForm').show();
        $w('#conflictResolutionView').hide();
        $w('#fullSchedulingCalendars').hide();
    }
});

/**
 * Event handler for the 'Open Monthly Schedule' button.
 */
export function openMonthlyModalButton_click(event) {
    wixWindow.openLightbox('monthlyScheduleModal', {});
}
```

---

## Appendix: Advanced Integration with `scheduler.js`

This section details how to apply the same granular permissions when using `scheduler.js` inside a Wix `HtmlComponent`.

### A.1 Communication Architecture

The architecture remains the same: the Velo page determines the user's access level and uses `postMessage` to send a simplified role (`admin` or `public`) to the `scheduler.js` script within the `HtmlComponent`.

### A.2 Updated Velo Page Code (for `HtmlComponent`)

This code checks for the "Administrator" or "Developer" roles and sends the appropriate simplified role to the `HtmlComponent`.

```javascript
import wixUsers from 'wix-users';

$w.onReady(async function () {
    const schedulerHost = $w('#schedulerHost');
    const currentUser = wixUsers.currentUser;
    let simplifiedRole = 'public'; // Default to public access

    if (currentUser.loggedIn) {
        const roles = await currentUser.getRoles();
        if (roles.some(role => role.name === "Administrator" || role.name === "Developer")) {
            simplifiedRole = 'admin';
        }
    }

    console.log(`Velo: User access level is '${simplifiedRole}'. Preparing to message HtmlComponent.`);

    const message = {
        role: simplifiedRole,
        selectors: {
            dashboardLeft: '#dashboardLeftContainer',
            dashboardRight: '#dashboardRightContainer',
            repeaterLeft: '#repeaterLeftContainer',
            repeaterRight: '#repeaterRightContainer'
        },
        baseUrl: './'
    };

    schedulerHost.onReady(() => {
        console.log('Velo: HtmlComponent is ready. Posting message...');
        schedulerHost.postMessage(message);
    });
});
```

### A.3 Required Changes in `scheduler.js`

The requirements for `scheduler.js` remain the same as described previously. It must listen for the message from Velo and use the `role` (`admin` or `public`) in the message to conditionally render the correct UI. The logic inside `scheduler.js` does not need to know about the specific "Developer" or "Administrator" roles, only the simplified `admin` or `public` role passed to it.

### A.4. Example `scheduler.js` Implementation

Here is a conceptual example of how `scheduler.js` should be structured to handle the incoming message from Velo and render the appropriate view.

```javascript
// scheduler.js

// --- 1. Message Listener ---
// Listen for messages from the Velo page code
window.onmessage = (event) => {
    // Basic security: check the origin of the message if possible
    // if (event.origin !== "https://your-wix-site.com") return;

    if (event.data) {
        console.log('scheduler.js: Message received from Velo.', event.data);
        const { role, selectors, baseUrl } = event.data;

        // --- 2. Conditional Rendering ---
        // Use the role to determine which UI to build
        if (role === 'admin') {
            renderAdminView(selectors, baseUrl);
        } else {
            renderPublicView(selectors, baseUrl);
        }
    }
};

// --- 3. View Rendering Functions ---

/**
 * Renders the Admin dashboard view.
 * @param {object} selectors - The CSS selectors for container elements.
 * @param {string} baseUrl - The base URL for loading assets.
 */
function renderAdminView(selectors, baseUrl) {
    console.log('Rendering Admin View...');
    // Example: Fetch and display admin-specific data
    // Hide public elements and show admin elements
    const dashboardLeft = document.querySelector(selectors.dashboardLeft);
    const dashboardRight = document.querySelector(selectors.dashboardRight);

    if (dashboardLeft && dashboardRight) {
        // Clear any existing content
        dashboardLeft.innerHTML = '<h2>Admin Dashboard</h2><p>Conflict Resolution Tools Here...</p>';
        dashboardRight.innerHTML = '<h2>Full Calendars</h2><p>Management Interface Here...</p>';

        // Ensure repeater containers are hidden if they exist
        const repeaterLeft = document.querySelector(selectors.repeaterLeft);
        const repeaterRight = document.querySelector(selectors.repeaterRight);
        if(repeaterLeft) repeaterLeft.style.display = 'none';
        if(repeaterRight) repeaterRight.style.display = 'none';
    }
}

/**
 * Renders the Public scheduling view.
 * @param {object} selectors - The CSS selectors for container elements.
 * @param {string} baseUrl - The base URL for loading assets.
 */
function renderPublicView(selectors, baseUrl) {
    console.log('Rendering Public View...');
    // Example: Build the standard appointment scheduling interface
    // Hide admin elements and show public elements
    const repeaterLeft = document.querySelector(selectors.repeaterLeft);
    const repeaterRight = document.querySelector(selectors.repeaterRight);

    if (repeaterLeft && repeaterRight) {
        // Clear any existing content
        repeaterLeft.innerHTML = '<h3>Weekly Schedule</h3><p>Display weekly slots...</p>';
        repeaterRight.innerHTML = '<h3>Book an Appointment</h3><p>Appointment form here...</p>';

        // Ensure dashboard containers are hidden if they exist
        const dashboardLeft = document.querySelector(selectors.dashboardLeft);
        const dashboardRight = document.querySelector(selectors.dashboardRight);
        if(dashboardLeft) dashboardLeft.style.display = 'none';
        if(dashboardRight) dashboardRight.style.display = 'none';
    }
}
```

---

## 4. Security Considerations

**IMPORTANT:** The Velo code described in this document controls **client-side rendering only**. It determines what a user sees in their browser, but it does **not** secure your data or backend functions.

-   **Client-Side Logic is for UI/UX:** Hiding an element in the browser does not prevent a technically savvy user from accessing the underlying data or functions if they are not properly secured.
-   **Secure Backend Endpoints:** Any functions that create, read, update, or delete sensitive information (like appointments or user data) must be protected on the backend.
-   **Use `wix-backend` for Permissions:** When creating backend web modules (`.jsw` files), always re-verify the user's permissions using `wix-users-backend.currentUser.getRoles()` before performing any privileged operations. Do not trust the role sent from the client.

### Example Backend Permission Check (`myScheduler.jsw`)

```javascript
import { webMethod, Permissions } from 'wix-web-module';
import wixUsersBackend from 'wix-users-backend';

export const getAdminData = webMethod(Permissions.SiteMember, async () => {
    // 1. Get the current user's ID on the backend
    const userId = wixUsersBackend.currentUser.id;

    // 2. Get the user's roles on the backend
    const roles = await wixUsersBackend.currentUser.getRoles();

    // 3. Verify the role before returning sensitive data
    const isAdmin = roles.some(role => role.name === "Administrator" || role.name === "Developer");

    if (!isAdmin) {
        throw new Error("Permission Denied: User is not an administrator.");
    }

    // 4. Proceed to fetch and return admin-only data
    const adminData = {
        // ... sensitive data here ...
    };

    return adminData;
});
```