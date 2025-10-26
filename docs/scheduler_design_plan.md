# Scheduler Design Documentation (As-Built)

**Status: This document reflects the current, implemented design of the scheduler and supersedes any previous plans.**

This document outlines the design, user flow, and data schema for the Greenhouse for Mental Health appointment scheduler as it is currently implemented on the Wix/Velo platform.

## Part 1: Application Design and User Flow

The scheduler is implemented as a single-page application within the Wix site, comprising three distinct views: Patient, Dashboard, and Admin. The default and primary view is the **Patient View**.

### 1.1. User Flow (Patient View)

The implemented user flow for requesting an appointment is a direct, form-based process:

1.  **Page Load:** The user lands on the scheduler page, which displays the Patient View. This view contains an appointment request form and a list of their existing appointments.
2.  **Data Loading (Manual):** The user must click a "Load My Appointments & Services" button to populate the form's service dropdown and their appointment list. This is an intentional design choice to prevent automatic data requests on page load.
3.  **Information Entry:** The user fills out a single form with the following details:
    *   Appointment Title
    *   Preferred Date
    *   Preferred Time
    *   Meeting Platform (e.g., Google Meet, Zoom)
    *   Service Type (selected from a dropdown)
4.  **Submission:** The user clicks "Request Appointment."
5.  **Conflict Check & Confirmation:** The system submits the request to a backend function (`proposeAppointment`) which checks for scheduling conflicts.
    *   **If no conflict:** The appointment is created, and the user sees a success message. Their appointment list is refreshed.
    *   **If a conflict exists:** The user sees an error message indicating a conflict, prompting them to choose a different time.
6.  **Editing/Deleting:** Users can edit or delete their existing appointments directly from the list displayed on the page.

### 1.2. UI/UX Design (Implemented)

The UI consists of three containers that are collapsed or expanded to switch between views.

#### a) Patient View (`#patientContainer`)

*   **Layout:** A simple, single-column layout.
*   **Primary Components:**
    *   **Appointment Request Form:** Contains input fields for all appointment details.
    *   **Appointments List:** A repeater element (`#patientAppointmentsRepeater`) that displays a list of the user's currently scheduled appointments, with buttons to "Edit" or "Delete".

#### b) Dashboard & Admin Views

These views are not part of the primary patient flow and are intended for staff.
*   **Dashboard View (`#dashboardContainer`):** Displays a weekly schedule table and a list of unresolved scheduling conflicts.
*   **Admin View (`#adminContainer`):** Provides a detailed form for viewing and editing the raw data of a specific appointment, typically accessed via a URL query parameter (`?appointmentId=...`).

---

## Part 2: Data Schema (Implicit)

The frontend code (`apps/frontend/schedule/Schedule.js`) interacts with a series of Velo backend functions (`/_functions/...`). While the exact database schema is defined in the backend, the frontend API calls imply the existence and structure of the following data collections.

### 2.1. `Services` Collection (Implicit)

*   **Purpose:** Stores the different types of services offered.
*   **Accessed Via:** `getServices()` backend function.
*   **Implied Fields:**
    *   `_id` (ID): Unique identifier for the service.
    *   `name` (Text): The name of the service (e.g., "Initial Consultation").

### 2.2. `Appointments` Collection (Implicit)

*   **Purpose:** Stores all proposed and confirmed appointments.
*   **Accessed Via:** `getAppointments()`, `proposeAppointment()`, `createAppointment()`, `updateAppointment()`, `deleteAppointment()` functions.
*   **Permissions (Inferred from Frontend Logic):**
    *   **Create:** Any site member can propose an appointment.
    *   **Read/Update/Delete:** A user can only manage their own appointments. Admins have broader permissions managed by the backend.
*   **Implied Fields:**
    *   `_id` (ID): Automatically generated unique ID.
    *   `title` (Text): The user-defined title for the appointment.
    *   `start` (Date and Time): The start date and time of the appointment (calculated from user input).
    *   `end` (Date and Time): The end date and time of the appointment.
    *   `platform` (Text): The meeting platform (e.g., "Zoom").
    *   `serviceRef` (Reference): A reference to the `Services` collection.
    *   *(Note: The `Therapist` reference from the original design plan is not implemented in the frontend.)*
