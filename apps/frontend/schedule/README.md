# Velo Interactive Scheduler

This directory contains the frontend Velo code (`Schedule.js`) for the interactive appointment scheduler on the Greenhouse for Mental Health website:

👉 [https://greenhousementalhealth.org/schedule/](https://greenhousementalhealth.org/schedule/)

---

## How it Works

The `Schedule.js` script provides a complete, interactive booking experience. It replaces the previous static, read-only implementation. The page code communicates with custom Velo backend functions to fetch data, check availability, and create new appointments in real-time.

### Key Features:

-   **Dynamic Filtering:** Users can select a service and a therapist from dropdown menus.
-   **Interactive Calendar:** The calendar displays the selected therapist's availability.
-   **Real-time Slot Selection:** Users can select a date and an available time slot.
-   **Lightbox Booking Form:** A booking form opens in a lightbox for the user to enter their details and confirm the appointment.
-   **Backend Integration:** The frontend is fully integrated with the Velo backend functions located in `apps/wv/backend/`. It handles creating appointments, checking for conflicts, and triggering confirmation emails.

### Assumed Velo Elements on Page:

The Velo code in `Schedule.js` assumes the following elements exist on the Wix page with these specific IDs:

-   `#serviceDropdown`: Dropdown for selecting a service.
-   `#therapistDropdown`: Dropdown for selecting a therapist.
-   `#calendar`: A calendar element to select a date.
-   `#timeSlotsRepeater`: A repeater to display available time slots.
    -   `#timeSlotButton`: A button inside the repeater for each time slot.
-   `#bookingForm`: A container for the booking form (though the form itself is implemented as a lightbox).
-   `#confirmationMessage`: A container to show a success message after booking.
-   `#mainContent`: A container holding the main scheduler interface, which can be hidden to show the confirmation message.

### Booking Form Lightbox:

The actual booking form is expected to be a Wix Lightbox named **"Booking Form"**. This lightbox should have its own Velo code to handle the form submission, call the `createAppointment` backend function, and then close itself, returning a status to the main page.

---

This implementation provides a robust and user-friendly scheduling experience directly on the Wix platform. For more details on the overall design, user flow, and data schema, see the main design document: `docs/scheduler_design_plan.md`.
