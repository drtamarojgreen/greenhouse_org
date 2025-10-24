# Scheduler Enhancements Roadmap (As-Built)

**Status: This document has been revised to provide a realistic roadmap of potential enhancements based on the currently implemented scheduler.**

This document outlines a prioritized list of potential enhancements for the Velo-based interactive scheduler. The suggestions are grounded in the existing, simplified application and provide a clear path for future development.

---

## 1. Foundational Feature Enhancements

These enhancements focus on implementing the core features from the original design that were not included in the initial build.

**1. Implement Therapist Selection**
*   **Description:** Introduce the concept of therapists into the scheduler. This involves creating a `Therapists` data collection and adding a "Select a Therapist" dropdown to the patient form. This is the single most important feature required to unlock many other enhancements.
*   **Current State:** The application currently has no concept of different therapists.
*   **Next Steps:**
    1.  Create a `Therapists` collection in Wix Data.
    2.  Add a dropdown to the patient form UI.
    3.  Create a backend function `getTherapistsByService` and call it from the frontend to populate the dropdown.
    4.  Add a `therapistId` reference to the `Appointments` collection.

**2. Interactive Calendar Availability**
*   **Description:** Upgrade the current date picker to an interactive calendar that visually shows available and unavailable days for a selected therapist.
*   **Current State:** The patient view uses a simple date input field, not a full calendar. The dashboard has a calendar, but it's not used for patient booking.
*   **Next Steps:**
    1.  Add a Wix Calendar element to the patient view.
    2.  Create a backend function `getMonthlyAvailability(therapistId)` that returns which days are busy.
    3.  Use Velo code to disable the busy dates on the calendar element.

**3. Implement Time Slot Selection**
*   **Description:** Instead of having the user manually type in a time, display a list of available time slots for a selected date and therapist.
*   **Current State:** Users enter a time manually, which is prone to errors and conflicts.
*   **Next Steps:**
    1.  Create a backend function `getAvailableTimeSlots(therapistId, date)`. This function would check working hours and existing appointments to return a list of open slots.
    2.  Add a repeater element to the UI to display the time slots returned by the backend.

## 2. User Experience (UX/UI) Enhancements

**4. Real-time Form Validation**
*   **Description:** Provide immediate feedback to the user as they fill out the form, for example, by showing a red border around an invalid email address without waiting for them to click "submit."
*   **Current State:** Validation is minimal and only runs on submission.
*   **Next Steps:**
    1.  Attach `onBlur` or `onInput` event handlers to the form fields.
    2.  Use Velo code to perform validation (e.g., regex for email) and show/hide error messages for each field.

**5. Automatic Timezone Detection**
*   **Description:** Detect the user's timezone and display a notice (e.g., "All times are in your local timezone: America/New_York"). This avoids confusion for users in different regions.
*   **Current State:** Timezones are not handled at all.
*   **Next Steps:**
    1.  Use frontend JavaScript (`Intl.DateTimeFormat().resolvedOptions().timeZone`) to get the user's timezone.
    2.  Display this information clearly on the UI.
    3.  Ensure all dates sent to the backend are in a consistent format (like ISO 8601 string) to be stored as UTC.

**6. User-Managed Cancellations**
*   **Description:** In the "My Appointments" list, provide a "Cancel" button that allows a user to cancel their own appointment, subject to a cancellation policy (e.g., cannot cancel within 24 hours).
*   **Current State:** Only Edit/Delete is available, and there's no policy enforcement.
*   **Next Steps:**
    1.  In the `onItemReady` for the appointments repeater, add logic to the "Cancel" button's click handler.
    2.  This logic should check if the appointment's start time is less than 24 hours from the current time.
    3.  If it is, show a message. If not, call the `deleteAppointment` backend function.

## 3. Administrative Enhancements

**7. Therapist "Time Off" Management**
*   **Description:** Create a simple interface in the admin or dashboard view for an administrator to block out dates for a therapist (e.g., for vacation or sick leave).
*   **Current State:** No such functionality exists.
*   **Next Steps:**
    1.  Create a `TimeOff` data collection with `therapistId`, `startDate`, and `endDate` fields.
    2.  The backend availability logic (`getAvailableTimeSlots`) must be updated to query this collection and exclude any time off from the results.
    3.  Build a simple form in the admin view to create new entries in the `TimeOff` collection.

**8. Improved Admin Dashboard Reports**
*   **Description:** Enhance the dashboard with simple, key metrics like "Total Appointments This Week" and "Most Booked Service."
*   **Current State:** The dashboard only shows a schedule and conflict list.
*   **Next Steps:**
    1.  Create a new backend function that uses the `wix-data-aggregation` API to perform `count` and `group` operations on the `Appointments` collection.
    2.  Add text elements to the dashboard UI to display the results of this aggregation.

## 4. Communication & Notifications

**9. SMS Reminders**
*   **Description:** Integrate with an SMS service like Twilio to send automated appointment reminders 24 hours before the appointment.
*   **Current State:** Only email notifications are considered in the design.
*   **Next Steps:**
    1.  Add a "Phone Number" field and an "I consent to SMS reminders" checkbox to the appointment form.
    2.  Create a backend function that uses `wix-fetch` to call the Twilio API.
    3.  This function would need to be triggered by a recurring job, which may require an external service like Zapier to run daily and check for upcoming appointments.

**10. Customizable Email Templates**
*   **Description:** Allow administrators to edit the content of confirmation and cancellation emails without changing the code.
*   **Current State:** Email content is likely hardcoded in the backend.
*   **Next Steps:**
    1.  Create an `EmailTemplates` data collection to store the subject and body of different emails.
    2.  Modify the backend functions that send email to first query this collection for the template, insert dynamic data (like appointment time), and then send the result.
