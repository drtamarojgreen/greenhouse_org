// Velo Version of scheduler.js and schedulerUI.js
// This file will contain the combined and adapted logic for Wix Velo.

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { getAppointmentsByDateRange, proposeAppointment, updateAppointment, deleteAppointment, getConflictsForDateRange, getServiceTypes } from 'backend/createAppointment.web'; // Assuming these backend functions exist

/**
 * @description Configuration for the scheduler application, adapted for Velo
 */
const config = {
    // No direct DOM manipulation delays needed in Velo
    retries: {
        maxAttempts: 3,
        delay: 1000
    }
};

/**
 * Application state management, adapted for Velo
 */
const appState = {
    isInitialized: false,
    isLoading: false,
    currentView: null, // 'patient', 'dashboard', 'admin'
    currentAppointmentId: null, // For editing appointments
    errors: []
};

/**
 * @function retryOperation
 * @description Retries an async operation with exponential backoff
 * @param {Function} operation - The async operation to retry
 * @param {string} operationName - Name for logging
 * @param {number} [maxAttempts=3] - Maximum retry attempts
 * @returns {Promise} Result of the operation
 */
async function retryOperation(operation, operationName, maxAttempts = config.retries.maxAttempts) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`Velo Scheduler: ${operationName} - Attempt ${attempt}/${maxAttempts}`);
            return await operation();
        } catch (error) {
            lastError = error;
            console.warn(`Velo Scheduler: ${operationName} failed on attempt ${attempt}:`, error.message);
            
            if (attempt < maxAttempts) {
                const delay = config.retries.delay * Math.pow(2, attempt - 1);
                console.log(`Velo Scheduler: Retrying ${operationName} in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw new Error(`${operationName} failed after ${maxAttempts} attempts. Last error: ${lastError.message}`);
}

/**
 * @function showNotification
 * @description Shows a notification message to the user using Velo's built-in notifications or custom elements.
 * @param {string} message - Message to display
 * @param {string} type - Type of notification ('success', 'error', 'info')
 * @param {number} [duration=5000] - Auto-dismiss duration in milliseconds (Velo might handle this differently)
 */
function showNotification(message, type = 'info', duration = 5000) {
    // Velo has a built-in notification system, or we can use text elements
    if (type === 'success') {
        $w('#textNotification').text = message;
        $w('#textNotification').style.color = 'green';
        $w('#textNotification').show();
        setTimeout(() => $w('#textNotification').hide(), duration);
    } else if (type === 'error') {
        $w('#textNotification').text = message;
        $w('#textNotification').style.color = 'red';
        $w('#textNotification').show();
        setTimeout(() => $w('#textNotification').hide(), duration);
    } else {
        $w('#textNotification').text = message;
        $w('#textNotification').style.color = 'blue';
        $w('#textNotification').show();
        setTimeout(() => $w('#textNotification').hide(), duration);
    }
    console.log(`Velo Scheduler Notification (${type}): ${message}`);
}

/**
 * @function displayError
 * @description Displays a visible error message on the page.
 * @param {string} message - The error message to display
 */
function displayError(message) {
    showNotification(`Error: ${message}`, 'error', 0); // 0 for sticky error
    console.error('Velo Scheduler Error:', {
        message,
        view: appState.currentView,
        errors: appState.errors
    });
}

/**
 * @function validatePatientForm
 * @description Validates the patient appointment request form.
 * @returns {boolean} True if form is valid.
 */
function validatePatientForm() {
    let isValid = true;

    // Example validation for a text input
    if (!$w('#inputTitle').value) {
        $w('#textErrorTitle').text = 'Title is required.';
        $w('#textErrorTitle').show();
        isValid = false;
    } else {
        $w('#textErrorTitle').hide();
    }

    // Example validation for a date input
    const selectedDate = $w('#inputDate').value;
    if (!selectedDate) {
        $w('#textErrorDate').text = 'Date is required.';
        $w('#textErrorDate').show();
        isValid = false;
    } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(selectedDate) < today) {
            $w('#textErrorDate').text = 'Please select a future date.';
            $w('#textErrorDate').show();
            isValid = false;
        } else {
            $w('#textErrorDate').hide();
        }
    }

    // Example validation for a time input
    const selectedTime = $w('#inputTime').value;
    if (!selectedTime) {
        $w('#textErrorTime').text = 'Time is required.';
        $w('#textErrorTime').show();
        isValid = false;
    } else {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(selectedTime)) {
            $w('#textErrorTime').text = 'Please enter a valid time.';
            $w('#textErrorTime').show();
            isValid = false;
        } else {
            $w('#textErrorTime').hide();
        }
    }

    // Example validation for a dropdown
    if (!$w('#dropdownService').value) {
        $w('#textErrorService').text = 'Service is required.';
        $w('#textErrorService').show();
        isValid = false;
    } else {
        $w('#textErrorService').hide();
    }

    return isValid;
}

/**
 * @function handlePatientFormSubmission
 * @description Handles the submission of the patient appointment request form.
 */
async function handlePatientFormSubmission() {
    if (!validatePatientForm()) {
        showNotification('Please correct the errors in the form.', 'error');
        return;
    }

    $w('#buttonProposeAppointment').disable();
    $w('#loadingSpinner').show();

    try {
        const appointmentData = {
            title: $w('#inputTitle').value,
            date: $w('#inputDate').value,
            time: $w('#inputTime').value,
            platform: $w('#inputPlatform').value,
            serviceRef: $w('#dropdownService').value,
            // Add other fields as necessary, e.g., patient ID from wixUsers
        };

        let result;
        if (appState.currentAppointmentId) {
            // Update existing appointment
            result = await retryOperation(
                () => updateAppointment(appState.currentAppointmentId, appointmentData),
                'Updating Appointment'
            );
            showNotification('Appointment updated successfully!', 'success');
        } else {
            // Propose new appointment
            result = await retryOperation(
                () => proposeAppointment(appointmentData),
                'Proposing Appointment'
            );
            showNotification('Appointment request submitted successfully!', 'success');
        }

        console.log('Velo Scheduler: Form submitted with data:', appointmentData, 'Result:', result);
        
        // Reset form and state
        resetPatientForm();
        appState.currentAppointmentId = null;

    } catch (error) {
        console.error('Velo Scheduler: Form submission error:', error);
        displayError(`Failed to submit appointment request: ${error.message}`);
    } finally {
        $w('#buttonProposeAppointment').enable();
        $w('#loadingSpinner').hide();
    }
}

/**
 * @function resetPatientForm
 * @description Resets the patient form inputs and error messages.
 */
function resetPatientForm() {
    $w('#inputTitle').value = '';
    $w('#inputDate').value = '';
    $w('#inputTime').value = '';
    $w('#inputPlatform').value = '';
    $w('#dropdownService').value = ''; // Reset select to default

    // Hide all error messages
    $w('#textErrorTitle').hide();
    $w('#textErrorDate').hide();
    $w('#textErrorTime').hide();
    $w('#textErrorService').hide();

    // Reset button text
    $w('#buttonProposeAppointment').label = 'Request Appointment';
}

/**
 * @function editPatientAppointment
 * @description Populates the patient form with appointment data for editing.
 * @param {object} appointment - The appointment data to edit.
 */
function editPatientAppointment(appointment) {
    $w('#inputTitle').value = appointment.title;
    $w('#inputDate').value = appointment.date; // Assuming date is in YYYY-MM-DD format
    $w('#inputTime').value = appointment.time; // Assuming time is in HH:MM format
    $w('#inputPlatform').value = appointment.platform;
    $w('#dropdownService').value = appointment.serviceRef;

    $w('#buttonProposeAppointment').label = 'Update Appointment';
    appState.currentAppointmentId = appointment._id;
}

/**
 * @function setupServiceDropdown
 * @description Populates the service dropdown with data from the backend.
 */
async function setupServiceDropdown() {
    try {
        const serviceTypes = await retryOperation(getServiceTypes, 'Fetching Service Types');
        const dropdownOptions = serviceTypes.map(service => ({
            label: service.name,
            value: service._id
        }));
        $w('#dropdownService').options = [{ label: 'Please select a service...', value: '', disabled: true, selected: true }, ...dropdownOptions];
    } catch (error) {
        console.error('Velo Scheduler: Failed to load service types:', error);
        displayError('Failed to load available services.');
    }
}

/**
 * @function renderDashboardCalendar
 * @description Renders a calendar view for the given year and month using Velo elements.
 * Assumes a repeater or custom elements for calendar cells.
 * @param {number} year - The year to display.
 * @param {number} month - The month to display (0-indexed).
 */
function renderDashboardCalendar(year, month) {
    // This function would typically populate a repeater or a custom calendar component
    // For simplicity, we'll just update a text element for now.
    const date = new Date(year, month);
    const monthName = date.toLocaleString('default', { month: 'long' });
    const currentYear = date.getFullYear();

    $w('#textCalendarMonthYear').text = `${monthName} ${currentYear}`;
    $w('#buttonPrevMonth').onClick(() => {
        const newMonth = month === 0 ? 11 : month - 1;
        const newYear = month === 0 ? year - 1 : year;
        renderDashboardCalendar(newYear, newMonth);
    });
    $w('#buttonNextMonth').onClick(() => {
        const newMonth = month === 11 ? 0 : month + 1;
        const newYear = month === 11 ? year + 1 : year;
        renderDashboardCalendar(newYear, newMonth);
    });

    // Logic to populate calendar cells (e.g., a repeater) would go here.
    // Each cell would have an onClick event to select a date.
    console.log(`Velo Scheduler: Rendered calendar for ${monthName} ${currentYear}`);
}

/**
 * @function renderDashboardWeeklySchedule
 * @description Renders the detailed weekly schedule view with appointments.
 * Assumes a repeater or table for schedule display.
 * @param {Array<object>} appointments - List of appointment objects.
 * @param {Array<object>} serviceTypes - List of service type objects.
 */
function renderDashboardWeeklySchedule(appointments, serviceTypes) {
    // This would typically populate a repeater or a table.
    // For now, we'll just log and assume a repeater is set up.
    console.log('Velo Scheduler: Rendering weekly schedule with appointments:', appointments);

    // Example: Populating a repeater named 'repeaterSchedule'
    // $w('#repeaterSchedule').data = appointments.map(appt => ({
    //     _id: appt._id,
    //     title: appt.title,
    //     date: new Date(appt.start).toLocaleDateString(),
    //     time: new Date(appt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    //     // Map other fields as needed
    // }));

    // $w('#repeaterSchedule').onItemReady(($item, itemData, index) => {
    //     $item('#textAppointmentTitle').text = itemData.title;
    //     $item('#textAppointmentDateTime').text = `${itemData.date} ${itemData.time}`;
    //     // Add event listeners for editing/deleting appointments
    //     $item('#buttonEditAppointment').onClick(() => editAdminAppointment(itemData));
    // });
}

/**
 * @function renderDashboardConflicts
 * @description Renders the list of conflicts.
 * Assumes a repeater or text elements for conflict display.
 * @param {Array<object>} conflicts - List of conflict objects.
 */
function renderDashboardConflicts(conflicts) {
    console.log('Velo Scheduler: Rendering conflicts:', conflicts);

    if (conflicts && conflicts.length > 0) {
        // Example: Populating a repeater named 'repeaterConflicts'
        // $w('#repeaterConflicts').data = conflicts.map(conflict => ({
        //     _id: conflict._id,
        //     title: conflict.title,
        //     date: conflict.date,
        //     time: conflict.time,
        //     reason: conflict.reason || 'N/A'
        // }));
        // $w('#repeaterConflicts').onItemReady(($item, itemData, index) => {
        //     $item('#textConflictDetails').text = `Conflict: ${itemData.title} on ${itemData.date} at ${itemData.time}. Reason: ${itemData.reason}`;
        //     $item('#buttonResolveConflict').onClick(() => resolveConflict(itemData._id));
        // });
        $w('#textNoConflicts').hide();
        // Show repeater
    } else {
        $w('#textNoConflicts').show();
        // Hide repeater
    }
}

/**
 * @function showConflictModal
 * @description Shows the conflict resolution modal.
 * @param {object} conflictData - Data about the conflict.
 */
function showConflictModal(conflictData) {
    // Assuming a Velo Lightbox is used for the modal
    // wixWindow.openLightbox("ConflictResolutionLightbox", conflictData);
    console.log('Velo Scheduler: Showing conflict modal with data:', conflictData);
    // For now, just update a text element
    $w('#textConflictDetails').text = JSON.stringify(conflictData, null, 2);
    $w('#boxConflictModal').show();
}

/**
 * @function hideConflictModal
 * @description Hides the conflict resolution modal.
 */
function hideConflictModal() {
    $w('#boxConflictModal').hide();
}

/**
 * @function initPatientView
 * @description Initializes the patient view.
 */
async function initPatientView() {
    console.log('Velo Scheduler: Initializing Patient View');
    $w('#patientFormContainer').show();
    $w('#dashboardContainer').hide();
    $w('#adminContainer').hide();

    await setupServiceDropdown();
    $w('#buttonProposeAppointment').onClick(handlePatientFormSubmission);
    // Add other patient view specific initializations here
}

/**
 * @function initDashboardView
 * @description Initializes the dashboard view.
 */
async function initDashboardView() {
    console.log('Velo Scheduler: Initializing Dashboard View');
    $w('#patientFormContainer').hide();
    $w('#dashboardContainer').show();
    $w('#adminContainer').hide();

    const today = new Date();
    renderDashboardCalendar(today.getFullYear(), today.getMonth());

    // Fetch and render appointments/conflicts for the current week/month
    try {
        const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()); // Start of current week (Sunday)
        const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6); // End of current week (Saturday)
        
        const appointments = await retryOperation(
            () => getAppointmentsByDateRange(startDate.toISOString(), endDate.toISOString()),
            'Fetching Dashboard Appointments'
        );
        renderDashboardWeeklySchedule(appointments);

        const conflicts = await retryOperation(
            () => getConflictsForDateRange(startDate.toISOString(), endDate.toISOString()),
            'Fetching Dashboard Conflicts'
        );
        renderDashboardConflicts(conflicts);

    } catch (error) {
        console.error('Velo Scheduler: Failed to load dashboard data:', error);
        displayError('Failed to load dashboard schedule and conflicts.');
    }

    // Add event listeners for dashboard elements (e.g., calendar navigation, conflict resolution)
    $w('#buttonPrevMonth').onClick(() => {
        const currentMonthYear = $w('#textCalendarMonthYear').text.split(' ');
        const currentMonth = new Date(Date.parse(currentMonthYear[0] + " 1, 2000")).getMonth();
        const currentYear = parseInt(currentMonthYear[1]);
        const newMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const newYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        renderDashboardCalendar(newYear, newMonth);
    });
    $w('#buttonNextMonth').onClick(() => {
        const currentMonthYear = $w('#textCalendarMonthYear').text.split(' ');
        const currentMonth = new Date(Date.parse(currentMonthYear[0] + " 1, 2000")).getMonth();
        const currentYear = parseInt(currentMonthYear[1]);
        const newMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const newYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        renderDashboardCalendar(newYear, newMonth);
    });

    $w('#buttonConflictModalClose').onClick(hideConflictModal);
    $w('#buttonConflictModalCancel').onClick(hideConflictModal);
    // $w('#buttonConflictModalResolve').onClick(() => { /* Logic to resolve conflict */ hideConflictModal(); });
}

/**
 * @function initAdminView
 * @description Initializes the admin view.
 */
async function initAdminView() {
    console.log('Velo Scheduler: Initializing Admin View');
    $w('#patientFormContainer').hide();
    $w('#dashboardContainer').hide();
    $w('#adminContainer').show();

    // Admin view specific initializations, e.g., loading admin forms, user management
    // This would involve fetching all appointments, or providing search/filter options
    // For now, just a placeholder.
    console.log('Velo Scheduler: Admin view is ready.');
}

/**
 * @function determineCurrentView
 * @description Determines the current view based on URL parameters or page context.
 * @returns {string} The current view ('patient', 'dashboard', 'admin').
 */
function determineCurrentView() {
    const urlParams = new URLSearchParams(wixLocation.url.split('?')[1]);
    const viewParam = urlParams.get('view');

    if (viewParam === 'dashboard') {
        return 'dashboard';
    } else if (viewParam === 'admin') {
        return 'admin';
    } else {
        return 'patient'; // Default view
    }
}

/**
 * @function initApp
 * @description Main initialization function for the Velo scheduler application.
 */
async function initApp() {
    if (appState.isInitialized || appState.isLoading) {
        console.log('Velo Scheduler: Already initialized or loading, skipping');
        return;
    }

    appState.isLoading = true;
    try {
        console.log('Velo Scheduler: Starting initialization');

        appState.currentView = determineCurrentView();
        console.log(`Velo Scheduler: Current view determined as: ${appState.currentView}`);

        // Initialize the appropriate view
        switch (appState.currentView) {
            case 'patient':
                await initPatientView();
                break;
            case 'dashboard':
                await initDashboardView();
                break;
            case 'admin':
                await initAdminView();
                break;
            default:
                console.warn('Velo Scheduler: Unknown view, defaulting to patient view.');
                await initPatientView();
                break;
        }

        appState.isInitialized = true;
        console.log('Velo Scheduler: Initialization completed successfully');
        showNotification('Scheduling application loaded successfully', 'success', 3000);

    } catch (error) {
        console.error('Velo Scheduler: Initialization failed:', error);
        appState.errors.push(error);
        displayError(`Failed to load the scheduling application: ${error.message}`);
    } finally {
        appState.isLoading = false;
    }
}

/**
 * @function onReady
 * @description Velo's page ready function.
 */
$w.onReady(function () {
    // Global error handlers (Velo might have its own mechanisms)
    // window.addEventListener('error', (event) => { /* ... */ });
    // window.addEventListener('unhandledrejection', (event) => { /* ... */ });

    initApp();
});

// Expose public API for debugging (if needed in Velo's dev console)
export function getState() {
    return { ...appState };
}

export function getConfig() {
    return { ...config };
}

export function reinitialize() {
    appState.isInitialized = false;
    appState.isLoading = false;
    return initApp();
}

export function showVeloNotification(message, type, duration) {
    showNotification(message, type, duration);
}
