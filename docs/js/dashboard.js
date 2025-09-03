// docs/js/dashboard.js

// Import necessary Velo backend functions (these are placeholders until implemented)
// import { getAppointmentsByDateRange, getConflictsForDateRange, updateAppointmentStatus, resolveConflict } from 'backend/adminScheduling'; // Assuming a new adminScheduling module

/**
 * Builds the UI for the Administrator Dashboard.
 * @returns {DocumentFragment} A DocumentFragment containing the dashboard UI.
 */
async function buildDashboardUI() {
    const fragment = document.createDocumentFragment();

    const h1 = document.createElement('h1');
    h1.textContent = 'Administrator Dashboard: Weekly Schedule & Conflict Resolution';
    fragment.appendChild(h1);

    const description = document.createElement('p');
    description.textContent = 'Review and resolve scheduling conflicts for the week. Select a date range to view appointments.';
    fragment.appendChild(description);

    // Date Range Selection
    const dateRangeDiv = document.createElement('div');
    dateRangeDiv.className = 'date-range-selector';
    dateRangeDiv.innerHTML = `
        <label for="startDate">Start Date:</label>
        <input type="date" id="startDate">
        <label for="endDate">End Date:</label>
        <input type="date" id="endDate">
        <button id="fetchScheduleBtn">Load Schedule</button>
    `;
    fragment.appendChild(dateRangeDiv);

    // Schedule Display Area
    const scheduleContainer = document.createElement('div');
    scheduleContainer.id = 'schedule-container';
    fragment.appendChild(scheduleContainer);

    // Conflict Resolution Area
    const conflictResolutionDiv = document.createElement('div');
    conflictResolutionDiv.id = 'conflict-resolution-area';
    conflictResolutionDiv.innerHTML = '<h2>Conflicts to Resolve</h2><ul id="conflictList"><li>No conflicts found.</li></ul>';
    fragment.appendChild(conflictResolutionDiv);

    // Event Listeners for date range and schedule loading
    // This part would typically be handled by app.js or a dedicated dashboard.js logic file
    // For programmatic UI, we attach them here.
    fragment.querySelector('#fetchScheduleBtn').addEventListener('click', async () => {
        const startDate = fragment.querySelector('#startDate').value;
        const endDate = fragment.querySelector('#endDate').value;

        if (!startDate || !endDate) {
            alert('Please select both start and end dates.');
            return;
        }

        // Mock data for now, replace with actual backend calls
        // const appointments = await getAppointmentsByDateRange(startDate, endDate);
        // const conflicts = await getConflictsForDateRange(startDate, endDate);

        const mockAppointments = [
            { _id: 'a1', title: 'Meeting with Client A', start: '2025-09-08T09:00:00Z', end: '2025-09-08T10:00:00Z', serviceRef: 'serviceA', confirmed: true, anonymousId: 'anon1' },
            { _id: 'a2', title: 'Team Sync', start: '2025-09-08T09:30:00Z', end: '2025-09-08T10:30:00Z', serviceRef: 'serviceB', confirmed: false, anonymousId: 'anon2' },
            { _id: 'a3', title: 'Client B Call', start: '2025-09-09T11:00:00Z', end: '2025-09-09T12:00:00Z', serviceRef: 'serviceA', confirmed: true, anonymousId: 'anon3' },
        ];

        const mockConflicts = [
            {
                type: 'time_overlap',
                proposedAppointment: mockAppointments[1],
                conflictingAppointment: mockAppointments[0]
            }
        ];

        renderSchedule(mockAppointments, scheduleContainer);
        renderConflicts(mockConflicts, conflictResolutionDiv.querySelector('#conflictList'));
    });

    // Helper function to render the schedule (simplified)
    function renderSchedule(appointments, container) {
        container.innerHTML = '<h3>Weekly Overview</h3>';
        if (appointments.length === 0) {
            container.innerHTML += '<p>No appointments for this period.</p>';
            return;
        }

        const ul = document.createElement('ul');
        appointments.forEach(app => {
            const li = document.createElement('li');
            li.textContent = `${app.title} (${new Date(app.start).toLocaleString()})`;
            ul.appendChild(li);
        });
        container.appendChild(ul);
    }

    // Helper function to render conflicts
    function renderConflicts(conflicts, container) {
        container.innerHTML = ''; // Clear previous
        if (conflicts.length === 0) {
            container.innerHTML = '<li>No conflicts found.</li>';
            return;
        }

        conflicts.forEach(conflict => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>Conflict Type:</strong> ${conflict.type}<br>
                <strong>Proposed:</strong> ${conflict.proposedAppointment.title} (${new Date(conflict.proposedAppointment.start).toLocaleString()})<br>
                <strong>Conflicting:</strong> ${conflict.conflictingAppointment.title} (${new Date(conflict.conflictingAppointment.start).toLocaleString()})
                <button data-appointment-id="${conflict.proposedAppointment._id}" data-action="resolve">Resolve</button>
            `;
            container.appendChild(li);
        });

        // Add event listener for resolve buttons (placeholder)
        container.querySelectorAll('button[data-action="resolve"]').forEach(button => {
            button.addEventListener('click', async (e) => {
                const appointmentId = e.target.dataset.appointmentId;
                alert(`Resolve action for appointment ID: ${appointmentId} (Backend call to resolveConflict or updateAppointmentStatus would go here)`);
                // await resolveConflict(appointmentId, ...);
                // Re-fetch schedule after resolution
            });
        });
    }

    return fragment;
}

// Expose globally for scheduler.js
window.buildDashboardUI = buildDashboardUI;