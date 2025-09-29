# Scheduler Backend Data Fetching with Permissions

## 1. Overview

Once the frontend UI has been adjusted based on the user's role (as described in `wix_permissions_implementation.md`), the next step is to fetch the appropriate data from the backend.

-   **Public users** should only receive data they are allowed to see, such as public appointment slots.
-   **Admin/Developer users** can receive sensitive data, such as full appointment details, user information, and conflict logs.

**Crucially, every backend function must re-verify the user's permissions before returning data.** Never trust the role or any other information sent from the client, as it can be easily manipulated.

---

## 2. Creating a Backend Web Module

In Velo, server-side code is placed in **Web Modules**. These are files with a `.jsw` or `.web.js` extension located in your backend code folder. Functions exported from these modules can be securely called from your frontend page code.

1.  In the Wix Editor, navigate to the "Code" panel.
2.  Under the "Backend" section, create a new file (e.g., `getAppointments.web.js`).

---

## 3. Implementing Secure Backend Functions

Here we'll cover two common scenarios based on the files in `apps/wv/backend/`:
1.  A function that returns different data based on the user's role.
2.  A function that should only be executable by an administrator.

### 3.1. Scenario 1: Role-Based Data Fetching

A common requirement is to fetch a list of appointments, but show more detail or a complete list to admins. The frontend determines the user's role to set up the UI, and then calls the appropriate backend function.

**Example Frontend Logic (`$w.onReady`)**

```javascript
// --- Frontend Page Code ---
import { getAppointments } from 'backend/getAppointments.web';
import { getPublicAvailability } from 'backend/getPublicAvailability.web'; // Assuming this function exists for non-admins
import wixUsers from 'wix-users';

$w.onReady(async function () {
    const currentUser = wixUsers.currentUser;
    let isAdmin = false;

    if (currentUser.loggedIn) {
        const roles = await currentUser.getRoles();
        isAdmin = roles.some(r => r.name === "Administrator" || r.name === "Developer");
    }

    if (isAdmin) {
        // User is an Admin: Show admin UI and fetch all appointment data
        $w('#adminDashboard').show();
        $w('#publicScheduler').hide();

        getAppointments()
            .then(appointments => {
                // Populate the admin dashboard with sensitive data
                $w('#adminRepeater').data = appointments;
            })
            .catch(err => console.error(err));

    } else {
        // User is a standard member or guest: Show public UI and fetch public data
        $w('#publicScheduler').show();
        $w('#adminDashboard').hide();

        // Call a different, safe backend function for public data
        getPublicAvailability()
            .then(slots => {
                // Populate the public scheduler with available slots
                $w('#publicRepeater').data = slots;
            })
            .catch(err => console.error(err));
    }
});
```

**Example Backend Implementation (`backend/getAppointments.web.js`)**

Even though the frontend logic for admins calls this function, it **must** re-verify the role. This prevents a non-admin from calling it directly.

```javascript
// --- backend/getAppointments.web.js ---
import { webMethod, Permissions } from 'wix-web-module';
import wixUsersBackend from 'wix-users-backend';
import wixData from 'wix-data';

export const getAppointments = webMethod(Permissions.SiteMember, async () => {
    // 1. Securely get the user's roles on the server.
    const roles = await wixUsersBackend.currentUser.getRoles();
    const isAdmin = roles.some(r => r.name === "Administrator" || r.name === "Developer");

    // 2. If the user is not an admin, refuse to proceed.
    if (!isAdmin) {
        throw new Error("Permission Denied: You do not have access to this data.");
    }

    // 3. If the check passes, proceed to query and return sensitive data.
    console.log("Backend: Admin check passed. Fetching all appointments.");
    const results = await wixData.query("AllAppointments").find();
    return results.items;
});
```

### 3.2. Scenario 2: Admin-Only Actions

For an action like resolving a scheduling conflict using `resolveConflict.web.js`, the function should only be executable by an admin.

**Example Frontend Logic (Admin Button Click)**

This code would live inside an admin-only part of your UI.

```javascript
import { resolveConflict } from 'backend/resolveConflict.web';

export function resolveConflictButton_click(event) {
    const conflictId = "some_conflict_id_from_your_ui";
    const resolutionDetails = { status: "Resolved", notes: "Double-booked with VIP." };

    $w('#resolveConflictButton').disable();

    resolveConflict(conflictId, resolutionDetails)
        .then(() => {
            console.log("Conflict resolved!");
            // Refresh the admin dashboard or show a success message
        })
        .catch(err => {
            console.error(err);
            $w('#adminErrorText').text = err.message;
        })
        .finally(() => {
            $w('#resolveConflictButton').enable();
        });
}
```

**Example Backend Implementation (`backend/resolveConflict.web.js`)**

The backend function is simple: check the role, and if it fails, throw an error.

```javascript
import { webMethod, Permissions } from 'wix-web-module';
import wixUsersBackend from 'wix-users-backend';
import wixData from 'wix-data';

export const resolveConflict = webMethod(Permissions.SiteMember, async (conflictId, resolutionDetails) => {
    const roles = await wixUsersBackend.currentUser.getRoles();
    const isAdmin = roles.some(r => r.name === "Administrator" || r.name === "Developer");

    if (!isAdmin) {
        throw new Error("Permission Denied: You cannot perform this action.");
    }

    // --- If check passes, proceed with resolution logic ---
    console.log(`Backend: Admin resolving conflict ${conflictId}`);
    // ... logic to update the database using wixData ...
    // For example:
    // await wixData.update("Conflicts", { _id: conflictId, ...resolutionDetails });
    return { success: true };
});
```

This two-layered approach provides a good user experience (a fast-rendering UI) while maintaining strict data security on the backend.