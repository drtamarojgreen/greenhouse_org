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

        let appointments = [];
        let conflicts = [];
        let serviceTypes = [];

        try {
            appointments = await getAppointmentsByDateRange(startDate, endDate);
            console.log('GreenhouseDashboardApp: Appointments data fetched successfully.', appointments); // Added log
        } catch (error) {
            console.error("Error fetching appointments:", error);
            GreenhouseUtils.displayError('Failed to load appointments data.');
        }

        try {
            conflicts = await getConflictsForDateRange(startDate, endDate);
            console.log('GreenhouseDashboardApp: Conflicts data fetched successfully.', conflicts); // Added log
        } catch (error) {
            console.error("Error fetching conflicts:", error);
            GreenhouseUtils.displayError('Failed to load conflicts data.');
        }

        try {
            serviceTypes = await getServiceTypes();
            console.log('GreenhouseDashboardApp: Service types data fetched successfully.', serviceTypes); // Added log
        } catch (error) {
            console.error("Error fetching service types:", error);
            GreenhouseUtils.displayError('Failed to load service types data.');
        }

        // Always attempt to render, even if data fetching failed
        GreenhouseSchedulerUI.renderWeekly(appointments, serviceTypes, document.getElementById('greenhouse-dashboard-app-schedule-container'));
        GreenhouseSchedulerUI.renderConflicts(conflicts, document.getElementById('greenhouse-dashboard-app-conflict-list'));
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

        // Initial render of calendar and event listeners (moved from schedulerUI.js)
        GreenhouseSchedulerUI.renderCalendar(new Date().getFullYear(), new Date().getMonth());
        GreenhouseSchedulerUI.addDashboardEventListeners(dashboardContainer); // Pass the container for event delegation

        loadInitialData();
    }

    return {
        init: init
    };
}