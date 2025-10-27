# Wix Velo Scheduler: Implementation Plan - Phase VIII: Frontend and UI/UX

### 8.1. Velo Component Strategy

-   **Main Calendar View:** A **Repeater** or **Custom Element** will be used to render the calendar grid. A Custom Element offers more flexibility for complex interactions like drag-and-drop, but a Repeater is faster to implement for a static display.
-   **Appointment Details:** A **Box** element containing text fields will be used to display the details of a selected appointment. This will be populated dynamically.
-   **Filtering and Controls:** **Dropdown** elements for filtering by therapist and **Button** elements for actions like "Refresh" or "Sync All".
-   **Conflict Resolution:** A **Lightbox** will be used to display conflict details and provide administrators with options to resolve them (e.g., "Cancel New," "Reschedule Existing").

### 8.2. Core User Flows

-   **Admin Viewing Schedule:**
    1.  Admin lands on the scheduler page.
    2.  The frontend calls a backend function `getAggregatedCalendar(dateRange)`.
    3.  The backend fetches, normalizes, and merges data from all sources.
    4.  The frontend populates the calendar Repeater with the returned appointments, visually highlighting any with conflicts.
-   **Admin Resolving a Conflict:**
    1.  Admin clicks on a conflicting appointment.
    2.  A Lightbox opens, showing details of the overlapping appointments.
    3.  Admin chooses an action (e.g., "Cancel Conflicting Appointment").
    4.  The frontend calls a backend function `resolveConflict(action, appointmentIds)`.
    5.  The UI is refreshed to reflect the change.
