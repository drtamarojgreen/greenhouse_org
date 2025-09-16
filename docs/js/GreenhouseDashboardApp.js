window.GreenhouseDashboardApp = (function() {
    'use strict';

    const GreenhouseUtils = window.GreenhouseUtils;
    if (!GreenhouseUtils) {
        console.error('GreenhouseDashboardApp: GreenhouseUtils not found. Ensure GreenhouseUtils.js is loaded.');
        return;
    }

    const dashboardAppState = {
        leftAppContainer: null,
        rightAppContainer: null,
        scheduleContainer: null,
        conflictList: null,
        calendarContainer: null,
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth(),
    };

    /**
     * API Calls
     */
    async function getAppointmentsByDateRange(startDate, endDate) {
        const response = await fetch(`/_functions/getAppointmentsByDateRange?startDate=${startDate}&endDate=${endDate}`);
        if (!response.ok) {
            throw new Error(`Failed to get appointments: ${response.statusText}`);
        }
        return response.json();
    }

    async function getConflictsForDateRange(startDate, endDate) {
        const response = await fetch(`/_functions/getConflictsForDateRange?startDate=${startDate}&endDate=${endDate}`);
        if (!response.ok) {
            throw new Error(`Failed to get conflicts: ${response.statusText}`);
        }
        return response.json();
    }

    async function updateAppointmentStatus(appointmentId, status) {
        const response = await fetch('/_functions/updateAppointmentStatus', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ appointmentId, status }),
        });
        if (!response.ok) {
            throw new Error(`Failed to update appointment status: ${response.statusText}`);
        }
        return response.json();
    }

    async function resolveConflict(conflictId, resolution) {
        const response = await fetch('/_functions/resolveConflict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ conflictId, resolution }),
        });
        if (!response.ok) {
            throw new Error(`Failed to resolve conflict: ${response.statusText}`);
        }
        return response.json();
    }

    async function getServiceTypes() {
        const response = await fetch('/_functions/getServiceTypes');
        if (!response.ok) {
            throw new Error(`Failed to get service types: ${response.statusText}`);
        }
        return response.json();
    }

    /**
     * Data Loading and Population
     */
    async function triggerDataFetchAndPopulation() {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1).toISOString().split('T')[0];
        const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (7 - today.getDay())).toISOString().split('T')[0];

        let appointments = [];
        let conflicts = [];
        let serviceTypes = [];

        try {
            appointments = await getAppointmentsByDateRange(startDate, endDate);
            console.log('GreenhouseDashboardApp: Appointments data fetched successfully.', appointments);
        } catch (error) {
            console.error("Error fetching appointments:", error);
            GreenhouseUtils.displayError('Failed to load appointments data.');
        }

        try {
            conflicts = await getConflictsForDateRange(startDate, endDate);
            console.log('GreenhouseDashboardApp: Conflicts data fetched successfully.', conflicts);
        } catch (error) {
            console.error("Error fetching conflicts:", error);
            GreenhouseUtils.displayError('Failed to load conflicts data.');
        }

        try {
            serviceTypes = await getServiceTypes();
            console.log('GreenhouseDashboardApp: Service types data fetched successfully.', serviceTypes);
        } catch (error) {
            console.error("Error fetching service types:", error);
            GreenhouseUtils.displayError('Failed to load service types data.');
        }

        // Always attempt to populate, even if data fetching failed
        populateWeekly(appointments, serviceTypes);
        populateConflicts(conflicts);
    }

    /**
     * Event Handlers
     */
    function handleAction(event) {
        const target = event.target;
        const action = target.dataset.action;

        if (action) {
            switch (action) {
                case 'prev-month':
                    dashboardAppState.currentMonth = (dashboardAppState.currentMonth - 1 + 12) % 12;
                    if (dashboardAppState.currentMonth === 11) { // If wrapped from Jan to Dec
                        dashboardAppState.currentYear--;
                    }
                    populateCalendar(dashboardAppState.currentYear, dashboardAppState.currentMonth);
                    break;
                case 'next-month':
                    dashboardAppState.currentMonth = (dashboardAppState.currentMonth + 1) % 12;
                    if (dashboardAppState.currentMonth === 0) { // If wrapped from Dec to Jan
                        dashboardAppState.currentYear++;
                    }
                    populateCalendar(dashboardAppState.currentYear, dashboardAppState.currentMonth);
                    break;
                case 'select-date':
                    const selectedDate = target.dataset.date;
                    // Implement logic to load appointments for the selected date
                    console.log('Selected date:', selectedDate);
                    break;
                case 'resolve-conflict':
                    const conflictId = target.dataset.conflictId;
                    // Implement logic to resolve conflict
                    console.log('Resolve conflict:', conflictId);
                    break;
                case 'view-appointment':
                    const appointmentId = target.dataset.appointmentId;
                    // Implement logic to view appointment details
                    console.log('View appointment:', appointmentId);
                    break;
            }
        }
    }

    /**
     * UI Population Functions
     */

    /**
     * Populates the calendar UI with dates for the given year and month.
     * This function updates existing elements rather than re-rendering the entire calendar.
     * @param {number} year - The year to display.
     * @param {number} month - The month to display (0-indexed).
     */
    function populateCalendar(year, month) {
        const calendarContainer = dashboardAppState.calendarContainer;
        if (!calendarContainer) {
            console.error('GreenhouseDashboardApp: Calendar container not found for population.');
            return;
        }

        // Update month/year display
        const titleElement = calendarContainer.querySelector('[data-identifier="calendar-title"]');
        const date = new Date(year, month);
        const monthName = date.toLocaleString('default', { month: 'long' });
        const currentYear = date.getFullYear();
        if (titleElement) {
            titleElement.textContent = `${monthName} ${currentYear}`;
        } else {
            // If title not found, create it (should be created by schedulerUI)
            const header = document.createElement('div');
            header.className = 'calendar-header';
            const prevButton = document.createElement('button');
            prevButton.dataset.action = 'prev-month';
            prevButton.dataset.year = currentYear;
            prevButton.dataset.month = month;
            prevButton.textContent = 'Prev';
            header.appendChild(prevButton);

            const newTitle = document.createElement('h2');
            newTitle.setAttribute('data-identifier', 'calendar-title');
            newTitle.textContent = `${monthName} ${currentYear}`;
            header.appendChild(newTitle);

            const nextButton = document.createElement('button');
            nextButton.dataset.action = 'next-month';
            nextButton.dataset.year = currentYear;
            nextButton.dataset.month = month;
            nextButton.textContent = 'Next';
            header.appendChild(nextButton);
            calendarContainer.prepend(header); // Prepend to ensure it's at the top
        }

        const tbody = calendarContainer.querySelector('[data-identifier="calendar-tbody"]');
        if (!tbody) {
            console.error('GreenhouseDashboardApp: Calendar tbody not found for population.');
            return;
        }

        // Clear previous date cells
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let dateCounter = 1;
        for (let i = 0; i < 6; i++) { // Up to 6 weeks
            const row = document.createElement('tr');
            for (let j = 0; j < 7; j++) { // 7 days a week
                const cell = document.createElement('td');
                if (i === 0 && j < firstDayOfMonth) {
                    cell.textContent = '';
                } else if (dateCounter > daysInMonth) {
                    cell.textContent = '';
                } else {
                    cell.textContent = dateCounter;
                    cell.dataset.date = `${currentYear}-${String(month + 1).padStart(2, '0')}-${String(dateCounter).padStart(2, '0')}`;
                    cell.dataset.action = 'select-date';
                    dateCounter++;
                }
                row.appendChild(cell);
            }
            tbody.appendChild(row);
            if (dateCounter > daysInMonth && i > 3) break;
        }
        console.log('GreenhouseDashboardApp: Calendar populated.');
    }

    /**
     * Populates the weekly schedule UI with appointment data.
     * This function updates existing elements rather than re-rendering the entire schedule.
     * @param {Array<object>} appointments - List of appointment objects.
     * @param {Array<object>} serviceTypes - List of service type objects.
     */
    function populateWeekly(appointments, serviceTypes) {
        const scheduleContainer = dashboardAppState.scheduleContainer;
        if (!scheduleContainer) {
            console.error('GreenhouseDashboardApp: Schedule container not found for population.');
            return;
        }

        const tbody = scheduleContainer.querySelector('[data-identifier="schedule-tbody"]');
        if (!tbody) {
            console.error('GreenhouseDashboardApp: Schedule tbody not found for population.');
            return;
        }

        // Clear previous appointment content from cells
        tbody.querySelectorAll('.appointment-item').forEach(item => item.remove());

        // Populate appointments
        if (appointments && appointments.length > 0) {
            appointments.forEach(appointment => {
                const apptDate = new Date(appointment.start);
                const apptDay = apptDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
                const apptHour = apptDate.getHours();

                const cell = tbody.querySelector(`.schedule-cell[data-day="${apptDay}"][data-hour="${apptHour}"]`);
                if (cell) {
                    const apptDiv = document.createElement('div');
                    apptDiv.className = 'appointment-item';
                    apptDiv.textContent = `${appointment.title} (${apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
                    cell.appendChild(apptDiv);
                }
            });
        }
        console.log('GreenhouseDashboardApp: Weekly schedule populated.');
    }

    /**
     * Populates the conflicts list UI with conflict data.
     * This function updates existing elements rather than re-rendering the entire list.
     * @param {Array<object>} conflicts - List of conflict objects.
     */
    function populateConflicts(conflicts) {
        const conflictListElement = dashboardAppState.conflictList;
        if (!conflictListElement) {
            console.error('GreenhouseDashboardApp: Conflict list container not found for population.');
            return;
        }

        // Clear previous conflict content
        while (conflictListElement.firstChild) {
            conflictListElement.removeChild(conflictListElement.firstChild);
        }

        if (conflicts && conflicts.length > 0) {
            conflicts.forEach(conflict => {
                const li = document.createElement('li');
                li.className = 'conflict-item'; // Add a class for styling
                li.innerHTML = `
                    <strong>Conflict: ${conflict.title}</strong><br>
                    Date: ${conflict.date} at ${conflict.time}<br>
                    Reason: ${conflict.reason || 'N/A'}
                    <button data-action="resolve-conflict" data-conflict-id="${conflict.id}">Resolve</button>
                `;
                conflictListElement.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No conflicts found.';
            conflictListElement.appendChild(li);
        }
        console.log('GreenhouseDashboardApp: Conflicts populated.');
    }

    /**
     * @function init
     * @description Initializes the Dashboard application.
     * @param {HTMLElement} leftAppContainer - The main DOM element for the left panel.
     * @param {HTMLElement} rightAppContainer - The main DOM element for the right panel.
     */
    function init(leftAppContainer, rightAppContainer) {
        dashboardAppState.leftAppContainer = leftAppContainer;
        dashboardAppState.rightAppContainer = rightAppContainer;

        // Get references to the UI elements created by schedulerUI.js
        dashboardAppState.scheduleContainer = leftAppContainer.querySelector('[data-identifier="schedule-container"]');
        dashboardAppState.conflictList = leftAppContainer.querySelector('[data-identifier="conflict-list"]');
        dashboardAppState.calendarContainer = rightAppContainer.querySelector('[data-identifier="calendar-container"]');

        // --- Manual Data Fetching Setup ---
        // For development, data fetching is triggered manually. This ensures all UI elements
        // are rendered and visible before any data is loaded, per user requirements.
        const fetchButton = leftAppContainer.querySelector('[data-identifier="fetch-schedule-data-btn"]');
        if (fetchButton) {
            fetchButton.addEventListener('click', triggerDataFetchAndPopulation);
        } else {
            console.warn('GreenhouseDashboardApp: Fetch schedule data button not found.');
        }

        // Initial population of calendar UI without data.
        populateCalendar(dashboardAppState.currentYear, dashboardAppState.currentMonth);

        // Add event listeners to the main app containers for delegation
        dashboardAppState.leftAppContainer.addEventListener('click', handleAction);
        dashboardAppState.rightAppContainer.addEventListener('click', handleAction);

        // NOTE: Initial data loading is intentionally disabled. Data is loaded on-demand via the fetch button.
        // triggerDataFetchAndPopulation();
    }

    return {
        init: init,
        populateCalendar: populateCalendar,
        populateWeekly: populateWeekly,
        populateConflicts: populateConflicts,
        triggerDataFetchAndPopulation: triggerDataFetchAndPopulation, // Expose for manual trigger
    };
})();
