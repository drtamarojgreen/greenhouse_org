function GreenhouseDashboardApp() {
    async function getAppointmentsByDateRange(startDate, endDate) {
        const response = await fetch(`/_api/getAppointmentsByDateRange?startDate=${startDate}&endDate=${endDate}`);
        if (!response.ok) {
            throw new Error(`Failed to get appointments: ${response.statusText}`);
        }
        return response.json();
    }

    async function getConflictsForDateRange(startDate, endDate) {
        const response = await fetch(`/_api/getConflictsForDateRange?startDate=${startDate}&endDate=${endDate}`);
        if (!response.ok) {
            throw new Error(`Failed to get conflicts: ${response.statusText}`);
        }
        return response.json();
    }

    async function updateAppointmentStatus(appointmentId, status) {
        const response = await fetch('/_api/updateAppointmentStatus', {
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
        const response = await fetch('/_api/resolveConflict', {
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
        const response = await fetch('/_api/getServiceTypes');
        if (!response.ok) {
            throw new Error(`Failed to get service types: ${response.statusText}`);
        }
        return response.json();
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

            GreenhouseSchedulerUI.renderSchedule(appointments, serviceTypes, document.getElementById('greenhouse-dashboard-app-schedule-container')); // Renamed ID
            GreenhouseSchedulerUI.renderConflicts(conflicts, document.getElementById('greenhouse-dashboard-app-conflict-list')); // Renamed ID
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
                    GreenhouseSchedulerUI.renderCalendar(prevMonth === 0 ? prevYear - 1 : prevYear, (prevMonth - 1 + 12) % 12);
                    break;
                case 'next-month':
                    const nextYear = parseInt(target.dataset.year);
                    const nextMonth = parseInt(target.dataset.month);
                    GreenhouseSchedulerUI.renderCalendar(nextMonth === 11 ? nextYear + 1 : nextYear, (nextMonth + 1) % 12);
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
            // The drag and drop event listeners are now handled by schedulerUI.js
        }

        // The initial renderCalendar and addDashboardEventListeners are now handled by schedulerUI.js
        loadInitialData();
    }

    return {
        init: init
    };
}