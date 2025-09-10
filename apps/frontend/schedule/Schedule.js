// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import { fetch } from 'wix-fetch';
import { lightbox } from 'wix-window';

// Backend function URLs
const BASE_URL = "/_functions"; // Velo functions are exposed here
const GET_SERVICES_URL = `${BASE_URL}/getServices`;
const GET_THERAPISTS_BY_SERVICE_URL = `${BASE_URL}/getTherapistsByService`; // Assumption: This backend function exists or will be created.
const GET_AVAILABILITY_URL = `${BASE_URL}/getAppointmentsByDateRange`;
const CREATE_APPOINTMENT_URL = `${BASE_URL}/createAppointment`;

$w.onReady(function () {
    // Initialize the page state
    populateServicesDropdown();
    setupEventListeners();
    $w('#bookingForm').collapse(); // Start with the form hidden
    $w('#confirmationMessage').collapse();
});

function setupEventListeners() {
    // When a service is selected, populate the therapist dropdown
    $w('#serviceDropdown').onChange((event) => {
        const serviceId = event.target.value;
        if (serviceId) {
            populateTherapistsDropdown(serviceId);
            $w('#therapistDropdown').enable();
        } else {
            $w('#therapistDropdown').disable();
        }
    });

    // When a therapist is selected, load their calendar availability
    $w('#therapistDropdown').onChange((event) => {
        const therapistId = event.target.value;
        if (therapistId) {
            // For this example, we assume the calendar automatically shows the current month.
            // A real implementation would need to handle month changes.
            loadCalendarAvailability(therapistId, new Date());
            $w('#calendar').enable();
        } else {
            $w('#calendar').disable();
        }
    });

    // When a date is selected in the calendar, show available time slots
    $w('#calendar').onChange((event) => {
        const selectedDate = event.target.value;
        const therapistId = $w('#therapistDropdown').value;
        loadTimeSlotsForDate(selectedDate, therapistId);
    });

    // When a time slot is clicked, open the booking form
    // This assumes the time slots are rendered in a repeater called #timeSlotsRepeater
    $w('#timeSlotsRepeater').onItemReady(($item, itemData, index) => {
        $item('#timeSlotButton').label = itemData.time; // e.g., "9:00 AM"
        $item('#timeSlotButton').onClick(() => {
            // Pass selected data to the booking form lightbox
            const bookingData = {
                service: $w('#serviceDropdown').value,
                therapist: $w('#therapistDropdown').value,
                date: $w('#calendar').value,
                time: itemData.time
            };
            lightbox.open('Booking Form', bookingData)
                .then((result) => {
                    if (result && result.booked) {
                        showConfirmationMessage();
                        // Refresh calendar
                        loadCalendarAvailability($w('#therapistDropdown').value, $w('#calendar').value);
                    }
                });
        });
    });
}

async function populateServicesDropdown() {
    try {
        const response = await fetch(GET_SERVICES_URL, { method: 'get' });
        if (response.ok) {
            const data = await response.json();
            const options = data.services.map(service => ({ label: service.name, value: service._id }));
            $w('#serviceDropdown').options = [{ label: 'Select a Service', value: '' }, ...options];
            $w('#serviceDropdown').enable();
        }
    } catch (err) {
        console.error("Error fetching services:", err);
        // Show an error to the user
    }
}

async function populateTherapistsDropdown(serviceId) {
    try {
        const response = await fetch(`${GET_THERAPISTS_BY_SERVICE_URL}?serviceId=${serviceId}`, { method: 'get' });
        if (response.ok) {
            const data = await response.json();
            const options = data.therapists.map(therapist => ({ label: therapist.name, value: therapist._id }));
            $w('#therapistDropdown').options = [{ label: 'Select a Therapist', value: '' }, ...options];
        }
    } catch (err) {
        console.error("Error fetching therapists:", err);
    }
}

async function loadCalendarAvailability(therapistId, date) {
    // This function would fetch appointments for the given month and disable dates that are fully booked.
    // The actual implementation depends heavily on the specific calendar component used.
    // For now, we assume the calendar is cleared and re-rendered with new availability info.
    console.log(`Loading availability for therapist ${therapistId} for month ${date.getMonth() + 1}`);
    // In a real scenario, you'd fetch data and use an API like $w('#calendar').disableDate(date) for each busy day.
}

async function loadTimeSlotsForDate(date, therapistId) {
    // This function will get existing appointments and calculate available slots.
    // This is a simplified example. A robust solution would have this logic on the backend.
    console.log(`Loading time slots for ${date.toDateString()} for therapist ${therapistId}`);
    const workingHours = { start: 9, end: 17 }; // 9 AM to 5 PM, assumed for now
    const slotDuration = 60; // 60 minutes

    // Fetch existing appointments for this day
    const response = await fetch(`${GET_AVAILABILITY_URL}?therapistId=${therapistId}&startDate=${date.toISOString()}&endDate=${date.toISOString()}`, { method: 'get' });
    const appointments = response.ok ? await response.json() : [];
    const bookedTimes = appointments.map(app => new Date(app.startDate).getHours());

    const timeSlots = [];
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
        if (!bookedTimes.includes(hour)) {
            timeSlots.push({ time: `${hour}:00` });
        }
    }
    $w('#timeSlotsRepeater').data = timeSlots;
    $w('#timeSlotsRepeater').expand();
}

function showConfirmationMessage() {
    $w('#mainContent').collapse(); // Hide the main scheduler UI
    $w('#confirmationMessage').expand(); // Show the success message
}

/**
 * NOTE: The booking form itself would have its own Velo code file if it's a Lightbox.
 * For example, a file named "lightboxes/Booking Form.js" would handle the form submission.
 * It would receive the context (bookingData) from the open() call,
 * handle the click on its own "Confirm" button, call the createAppointment backend function,
 * and then close the lightbox, returning a result.
 */
