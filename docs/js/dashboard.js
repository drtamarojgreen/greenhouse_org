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
async function buildDashboardUI() {
    const fragment = document.createDocumentFragment();

    const h1 = document.createElement('h1');
    h1.textContent = 'Administrator Dashboard: Weekly Schedule & Conflict Resolution';
    fragment.appendChild(h1);

    const description = document.createElement('p');
    description.textContent = 'Review and resolve scheduling conflicts for the week. Select a date range to view appointments.';
    fragment.appendChild(description);

    // New Appointment Box
    const newAppointmentBox = document.createElement('div');
    newAppointmentBox.id = 'new-appointment-box';
    newAppointmentBox.textContent = 'New Appointment';
    newAppointmentBox.draggable = true;
    fragment.appendChild(newAppointmentBox);

    newAppointmentBox.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', 'new-appointment');
    });

    // Calendar Dropdown
    const calendarContainer = document.createElement('div');
    calendarContainer.id = 'calendar-container';
    fragment.appendChild(calendarContainer);

    function renderCalendar(year, month) {
        calendarContainer.innerHTML = '';
        const table = document.createElement('table');
        const header = table.createTHead();
        const body = table.createTBody();
        const headerRow = header.insertRow();

        const prevButton = headerRow.insertCell();
        prevButton.textContent = '<';
        prevButton.onclick = () => renderCalendar(month === 0 ? year - 1 : year, (month - 1 + 12) % 12);

        const monthCell = headerRow.insertCell();
        monthCell.colSpan = 5;
        monthCell.textContent = `${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year}`;

        const nextButton = headerRow.insertCell();
        nextButton.textContent = '>';
        nextButton.onclick = () => renderCalendar(month === 11 ? year + 1 : year, (month + 1) % 12);

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const daysRow = header.insertRow();
        days.forEach(day => {
            const cell = daysRow.insertCell();
            cell.textContent = day;
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
                    if (day === new Date().getDate() && year === new Date().getFullYear() && month === new Date().getMonth()) {
                        cell.classList.add('today');
                    }
                    day++;
                }
            }
        }

        calendarContainer.appendChild(table);
    }

    renderCalendar(new Date().getFullYear(), new Date().getMonth());

    // Schedule Display Area
    const scheduleContainer = document.createElement('div');
    scheduleContainer.id = 'schedule-container';
    fragment.appendChild(scheduleContainer);

    // Conflict Resolution Area
    const conflictResolutionDiv = document.createElement('div');
    conflictResolutionDiv.id = 'conflict-resolution-area';
    conflictResolutionDiv.innerHTML = '<h2>Conflicts to Resolve</h2><ul id="conflictList"><li>No conflicts found.</li></ul>';
    fragment.appendChild(conflictResolutionDiv);

    // Initial data load
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

            renderSchedule(appointments, serviceTypes, scheduleContainer);
            renderConflicts(conflicts, conflictResolutionDiv.querySelector('#conflictList'));
        } catch (error) {
            console.error("Error loading initial data:", error);
            scheduleContainer.innerHTML = '<p style="color: red;">Error loading dashboard data. Please try refreshing the page. See console for more details.</p>';
        }
    }

    loadInitialData();

    

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
            timeCell.className = 'time-slot';
            timeCell.textContent = `${i}:00`;
            timeSlotRow.appendChild(timeCell);

            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('td');
                cell.className = 'editable';
                cell.addEventListener('dragover', (e) => {
                    e.preventDefault();
                });

                cell.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const data = e.dataTransfer.getData('text/plain');
                    if (data === 'new-appointment') {
                        const div = document.createElement('div');
                        div.className = 'service-new';
                        div.textContent = 'New Appointment';

                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.id = `reminder-${Date.now()}`;
                        const label = document.createElement('label');
                        label.htmlFor = checkbox.id;
                        label.textContent = 'Request Reminder';

                        div.appendChild(checkbox);
                        div.appendChild(label);

                        cell.appendChild(div);
                    }
                });

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
                div.className = `service-${app.serviceRef}`;
                div.textContent = service ? service.name : app.title;
                cell.appendChild(div);

                // Make the cell editable
                cell.addEventListener('click', () => {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = div.textContent;
                    cell.innerHTML = '';
                    cell.appendChild(input);
                    input.focus();

                    input.addEventListener('blur', () => {
                        div.textContent = input.value;
                        cell.innerHTML = '';
                        cell.appendChild(div);
                    });

                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            input.blur();
                        }
                    });
                });
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