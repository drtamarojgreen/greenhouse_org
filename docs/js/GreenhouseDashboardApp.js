function GreenhouseDashboardApp() {
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
     * Builds the UI for the Administrator Dashboard.
     * @returns {DocumentFragment} A DocumentFragment containing the dashboard UI.
     */
    function buildDashboardUI() {
        const fragment = document.createDocumentFragment();

        const h1 = document.createElement('h1');
        h1.textContent = 'Administrator Dashboard: Weekly Schedule & Conflict Resolution';
        fragment.appendChild(h1);

        const description = document.createElement('p');
        description.textContent = 'Review and resolve scheduling conflicts for the week. Select a date range to view appointments.';
        fragment.appendChild(description);

        // New Appointment Box
        const newAppointmentBox = document.createElement('div');
        newAppointmentBox.id = 'greenhouse-dashboard-app-new-appointment-box'; // Renamed ID
        newAppointmentBox.textContent = 'New Appointment';
        newAppointmentBox.draggable = true;
        fragment.appendChild(newAppointmentBox);

        // Calendar Dropdown
        const calendarContainer = document.createElement('div');
        calendarContainer.id = 'greenhouse-dashboard-app-calendar-container'; // Renamed ID
        fragment.appendChild(calendarContainer);

        // Schedule Display Area
        const scheduleContainer = document.createElement('div');
        scheduleContainer.id = 'greenhouse-dashboard-app-schedule-container'; // Renamed ID
        fragment.appendChild(scheduleContainer);

        // Conflict Resolution Area
        const conflictResolutionDiv = document.createElement('div');
        conflictResolutionDiv.id = 'greenhouse-dashboard-app-conflict-resolution-area'; // Renamed ID
        conflictResolutionDiv.innerHTML = '<h2>Conflicts to Resolve</h2><ul id="greenhouse-dashboard-app-conflict-list"><li>No conflicts found.</li></ul>'; // Renamed ID
        fragment.appendChild(conflictResolutionDiv);

        return fragment;
    }

    // Helper function to render the schedule as a table
    function renderSchedule(appointments, serviceTypes, container) {
        container.innerHTML = '<h3>Weekly Overview</h3>';
        if (appointments.length === 0) {
            container.innerHTML += '<p>No appointments for this period.</p>';
            return;
        }

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Create header row
        const headerRow = document.createElement('tr');
        const days = ['Time', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        days.forEach(day => {
            const th = document.createElement('th');
            th.textContent = day;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        // Create time slot rows
        for (let i = 9; i <= 17; i++) {
            const timeSlotRow = document.createElement('tr');
            const timeCell = document.createElement('td');
            timeCell.className = 'greenhouse-dashboard-app-time-slot'; // Renamed class
            timeCell.textContent = `${i}:00`;
            timeSlotRow.appendChild(timeCell);

            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('td');
                cell.className = 'greenhouse-dashboard-app-editable-cell'; // Renamed class
                cell.dataset.time = `${i}:00`; // Add data attribute for time
                cell.dataset.day = j; // Add data attribute for day

                timeSlotRow.appendChild(cell);
            }
            tbody.appendChild(timeSlotRow);
        }

        table.appendChild(thead);
        table.appendChild(tbody);

        const tableWrapper = document.createElement('div');
        tableWrapper.style.overflowX = 'auto';
        tableWrapper.appendChild(table);
        container.appendChild(tableWrapper);

        // Populate the table with appointments
        appointments.forEach(app => {
            const appDate = new Date(app.start);
            const dayIndex = (appDate.getDay() + 6) % 7; // Monday is 0
            const hour = appDate.getHours();

            if (hour >= 9 && hour <= 17) {
                const rowIndex = hour - 9;
                const cell = tbody.rows[rowIndex].cells[dayIndex + 1];
                const service = serviceTypes.find(st => st._id === app.serviceRef);
                const div = document.createElement('div');
                div.className = `greenhouse-dashboard-app-service-${app.serviceRef}`; // Renamed class
                div.textContent = service ? service.name : app.title;
                div.dataset.appointmentId = app._id; // Add appointment ID
                div.dataset.action = 'view-appointment'; // Add action for viewing appointment
                cell.appendChild(div);
            }
        });
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
                <button data-action="resolve-conflict" data-conflict-id="${conflict._id}" class="greenhouse-dashboard-app-button">Resolve</button>
            `;
            container.appendChild(li);
        });
    }

    function renderCalendar(year, month) {
        const calendarContainer = document.getElementById('greenhouse-dashboard-app-calendar-container'); // Renamed ID
        calendarContainer.innerHTML = '';
        const table = document.createElement('table');
        const header = table.createTHead();
        const body = table.createTBody();
        const headerRow = header.insertRow();

        const prevButton = headerRow.insertCell();
        prevButton.textContent = '<';
        prevButton.dataset.action = 'prev-month';
        prevButton.dataset.year = year;
        prevButton.dataset.month = month;
        prevButton.className = 'greenhouse-dashboard-app-calendar-nav-button'; // Added class

        const monthCell = headerRow.insertCell();
        monthCell.colSpan = 5;
        monthCell.textContent = `${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year}`;

        const nextButton = headerRow.insertCell();
        nextButton.textContent = '>';
        nextButton.dataset.action = 'next-month';
        nextButton.dataset.year = year;
        nextButton.dataset.month = month;
        nextButton.className = 'greenhouse-dashboard-app-calendar-nav-button'; // Added class

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const daysRow = header.insertRow();
        days.forEach(day => {
            const cell = daysRow.insertCell();
            cell.textContent = day;
            cell.className = 'greenhouse-dashboard-app-calendar-day-header'; // Added class
        });

        const date = new Date(year, month);
        let day = 1;
        for (let i = 0; i < 6; i++) {
            const row = body.insertRow();
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < date.getDay()) {
                    row.insertCell();
                } else if (day > new Date(year, month + 1, 0).getDate()) {
                    break;
                } else {
                    const cell = row.insertCell();
                    cell.textContent = day;
                    cell.dataset.action = 'select-date';
                    cell.dataset.date = `${year}-${month + 1}-${day}`;
                    cell.className = 'greenhouse-dashboard-app-calendar-day-cell'; // Added class
                    if (day === new Date().getDate() && year === new Date().getFullYear() && month === new Date().getMonth()) {
                        cell.classList.add('greenhouse-dashboard-app-today'); // Added class
                    }
                    day++;
                }
            }
        }

        calendarContainer.appendChild(table);
    }

    async function loadInitialData() {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1).toISOString().split('T')[0];
        const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (7 - today.getDay())).toISOString().split('T')[0];

        try {
            const [appointments, conflicts, serviceTypes] = await Promise.all([
                getAppointmentsByDateRange(startDate, endDate),
                getConflictsForDateRange(startDate, endDate),
                getServiceTypes()
            ]);

            renderSchedule(appointments, serviceTypes, document.getElementById('greenhouse-dashboard-app-schedule-container')); // Renamed ID
            renderConflicts(conflicts, document.getElementById('greenhouse-dashboard-app-conflict-list')); // Renamed ID
        } catch (error) {
            console.error("Error loading initial data:", error);
            document.getElementById('greenhouse-dashboard-app-schedule-container').innerHTML = '<p style="color: red;">Error loading dashboard data. Please try refreshing the page. See console for more details.</p>'; // Renamed ID
        }
    }

    function handleAction(event) {
        const target = event.target;
        const action = target.dataset.action;

        if (action) {
            switch (action) {
                case 'prev-month':
                    const prevYear = parseInt(target.dataset.year);
                    const prevMonth = parseInt(target.dataset.month);
                    renderCalendar(prevMonth === 0 ? prevYear - 1 : prevYear, (prevMonth - 1 + 12) % 12);
                    break;
                case 'next-month':
                    const nextYear = parseInt(target.dataset.year);
                    const nextMonth = parseInt(target.dataset.month);
                    renderCalendar(nextMonth === 11 ? nextYear + 1 : nextYear, (nextMonth + 1) % 12);
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

    function init() {
        const dashboardContainer = document.getElementById('greenhouse-app-container'); // Assuming this is the main container
        if (dashboardContainer) {
            dashboardContainer.addEventListener('click', handleAction);
            dashboardContainer.addEventListener('dragstart', (e) => {
                if (e.target.id === 'greenhouse-dashboard-app-new-appointment-box') { // Renamed ID
                    e.dataTransfer.setData('text/plain', 'new-appointment');
                }
            });
            dashboardContainer.addEventListener('dragover', (e) => {
                if (e.target.classList.contains('greenhouse-dashboard-app-editable-cell')) { // Renamed class
                    e.preventDefault();
                }
            });
            dashboardContainer.addEventListener('drop', (e) => {
                if (e.target.classList.contains('greenhouse-dashboard-app-editable-cell')) { // Renamed class
                    e.preventDefault();
                    const data = e.dataTransfer.getData('text/plain');
                    if (data === 'new-appointment') {
                        const div = document.createElement('div');
                        div.className = 'greenhouse-dashboard-app-service-new'; // Renamed class
                        div.textContent = 'New Appointment';

                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.id = `greenhouse-dashboard-app-reminder-${Date.now()}`; // Renamed ID
                        const label = document.createElement('label');
                        label.htmlFor = checkbox.id;
                        label.textContent = 'Request Reminder';

                        div.appendChild(checkbox);
                        div.appendChild(label);

                        e.target.appendChild(div);
                    }
                }
            });
        }

        renderCalendar(new Date().getFullYear(), new Date().getMonth());
        loadInitialData();
    }

    return {
        init: init,
        buildDashboardUI: buildDashboardUI // Expose buildDashboardUI for scheduler.js
    };
}
