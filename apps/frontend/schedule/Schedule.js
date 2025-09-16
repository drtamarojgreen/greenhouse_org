// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import { fetch } from 'wix-fetch';
// Removed: import { lightbox } from 'wix-window'; as lightboxes are not being used.
import wixLocation from 'wix-location';

// Custom error class for conflicts
class ConflictError extends Error {
    constructor(message, data) {
        super(message);
        this.name = 'ConflictError';
        this.data = data;
    }
}

// Backend function URLs
const BASE_URL = "/_functions"; // Velo functions are exposed here
const GET_SERVICES_URL = `${BASE_URL}/getServices`;
const GET_THERAPISTS_BY_SERVICE_URL = `${BASE_URL}/getTherapistsByService`;
const GET_AVAILABILITY_URL = `${BASE_URL}/getAppointmentsByDateRange`;
const CREATE_APPOINTMENT_URL = `${BASE_URL}/createAppointment`;
const GET_CONFLICTS_FOR_DATE_RANGE_URL = `${BASE_URL}/getConflictsForDateRange`;
const UPDATE_APPOINTMENT_STATUS_URL = `${BASE_URL}/updateAppointmentStatus`;
const RESOLVE_CONFLICT_URL = `${BASE_URL}/resolveConflict`;
const GET_SERVICE_TYPES_URL = `${BASE_URL}/getServiceTypes`;
const GET_APPOINTMENT_BY_ID_URL = `${BASE_URL}/getAppointmentById`;
const GET_APPOINTMENTS_URL = `${BASE_URL}/getAppointments`;
const PROPOSE_APPOINTMENT_URL = `${BASE_URL}/proposeAppointment`;
const DELETE_APPOINTMENT_URL = `${BASE_URL}/deleteAppointment`;
const UPDATE_APPOINTMENT_URL = `${BASE_URL}/updateAppointment`;


// Global state and configuration for the scheduler application
const schedulerState = {
    isInitialized: false,
    isLoading: false,
    currentView: 'all', // Default to 'all' for development purposes
    errors: [],
    // Configuration settings, adapted from GreenhouseUtils.config
    config: {
        loadTimeout: 15000, // Timeout for waiting for elements and resources (in milliseconds)
        retries: {
            maxAttempts: 3,
            delay: 1000
        },
        dom: {
            insertionDelay: 500, // Delay before inserting into DOM (for Wix compatibility)
            observerTimeout: 10000
        }
    },
    // UI elements that are expected to exist within #schedulingContainer in the Wix editor
    uiElements: {
        // Main container provided by the user
        schedulingContainer: '#schedulingContainer',

        // General UI elements within #schedulingContainer
        notificationBox: '#schedulingContainer #notificationBox',
        errorMessage: '#schedulingContainer #errorMessageText',
        successMessage: '#schedulingContainer #successMessageText',
        infoMessage: '#schedulingContainer #infoMessageText',
        // Removed: confirmationLightbox as lightboxes are not being used.

        // Patient specific UI elements within #schedulingContainer
        patientContainer: '#schedulingContainer #patientContainer',
        patientFormContainer: '#schedulingContainer #patientFormContainer',
        patientTitleInput: '#schedulingContainer #patientTitleInput',
        patientDateInput: '#schedulingContainer #patientDateInput',
        patientTimeInput: '#schedulingContainer #patientTimeInput',
        patientPlatformInput: '#schedulingContainer #patientPlatformInput',
        serviceSelect: '#schedulingContainer #serviceDropdown',
        therapistDropdown: '#schedulingContainer #therapistDropdown',
        calendar: '#schedulingContainer #calendar',
        timeSlotsRepeater: '#schedulingContainer #timeSlotsRepeater',
        proposeAppointmentButton: '#schedulingContainer #proposeAppointmentButton',
        patientLoadingSpinner: '#schedulingContainer #patientLoadingSpinner',
        patientAppointmentsRepeater: '#schedulingContainer #patientAppointmentsRepeater',
        instructionsPanel: '#schedulingContainer #instructionsPanel',
        // Removed: conflictResolutionLightbox as lightboxes are not being used.

        // Dashboard specific UI elements within #schedulingContainer
        dashboardContainer: '#schedulingContainer #dashboardContainer',
        dashboardFetchDataButton: '#schedulingContainer #dashboardFetchDataButton',
        weeklyScheduleTable: '#schedulingContainer #weeklyScheduleTable',
        conflictRepeater: '#schedulingContainer #conflictRepeater',
        dashboardCalendar: '#schedulingContainer #dashboardCalendar',
        dashboardCalendarTitle: '#schedulingContainer #dashboardCalendarTitle',
        dashboardCalendarPrevButton: '#schedulingContainer #dashboardCalendarPrevButton',
        dashboardCalendarNextButton: '#schedulingContainer #dashboardCalendarNextButton',

        // Admin specific UI elements within #schedulingContainer
        adminContainer: '#schedulingContainer #adminContainer',
        adminFormContainer: '#schedulingContainer #adminFormContainer',
        adminAppointmentForm: '#schedulingContainer #adminAppointmentForm',
        adminTitleInput: '#schedulingContainer #adminTitleInput',
        adminStartInput: '#schedulingContainer #adminStartInput',
        adminEndInput: '#schedulingContainer #adminEndInput',
        adminPlatformInput: '#schedulingContainer #adminPlatformInput',
        adminServiceSelect: '#schedulingContainer #adminServiceSelect',
        adminConfirmedCheckbox: '#schedulingContainer #adminConfirmedCheckbox',
        adminConflictsTextarea: '#schedulingContainer #adminConflictsTextarea',
        adminFirstNameInput: '#schedulingContainer #adminFirstNameInput',
        adminLastNameInput: '#schedulingContainer #adminLastNameInput',
        adminContactInfoInput: '#schedulingContainer #adminContactInfoInput',
        adminAnonymousIdInput: '#schedulingContainer #adminAnonymousIdInput',
        adminSaveButton: '#schedulingContainer #adminSaveButton',
        adminDeleteButton: '#schedulingContainer #adminDeleteButton',
        adminMessageText: '#schedulingContainer #adminMessageText',
    },
    // Dashboard specific state
    dashboard: {
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth(),
    },
    // Admin specific state
    admin: {
        currentAppointment: null,
        serviceTypes: [],
    }
};

/**
 * @function displayMessage
 * @description Display a non-blocking notification using Wix elements.
 * Assumes a #notificationBox with states like "errorState", "successState", "infoState"
 * and text elements like #errorMessageText, #successMessageText, #infoMessageText.
 * @param {string} message - The message text
 * @param {'error'|'success'|'info'} type - Message type
 * @param {number} duration - How long to show message (ms). 0 for sticky.
 */
function displayMessage(message, type = 'error', duration = 5000) {
    const notificationBox = $w(schedulerState.uiElements.notificationBox);

    // Hide all message texts first
    $w(schedulerState.uiElements.errorMessage).collapse();
    $w(schedulerState.uiElements.successMessage).collapse();
    $w(schedulerState.uiElements.infoMessage).collapse();

    let messageElement;
    let stateName;

    switch (type) {
        case 'error':
            messageElement = $w(schedulerState.uiElements.errorMessage);
            stateName = 'errorState';
            break;
        case 'success':
            messageElement = $w(schedulerState.uiElements.successMessage);
            stateName = 'successState';
            break;
        case 'info':
            messageElement = $w(schedulerState.uiElements.infoMessage);
            stateName = 'infoState';
            break;
        default:
            messageElement = $w(schedulerState.uiElements.infoMessage);
            stateName = 'infoState';
    }

    if (messageElement.valid) {
        messageElement.text = message;
        messageElement.expand();
    } else {
        console.warn(`Scheduler: Notification message element for type ${type} not found.`);
    }

    if (notificationBox.valid) {
        notificationBox.changeState(stateName);
        notificationBox.expand();
        if (duration > 0) {
            setTimeout(() => notificationBox.collapse(), duration);
        }
    } else {
        console.warn('Scheduler: Notification box element not found.');
    }
}

function displayError(message, duration = 5000) {
    displayMessage(message, 'error', duration);
}

function displaySuccess(message, duration = 3000) {
    displayMessage(message, 'success', duration);
}

function displayInfo(message, duration = 5000) {
    displayMessage(message, 'info', duration);
}

/**
 * @function showConfirmationDialog
 * @description Displays a confirmation dialog using the existing notification system.
 * This is a fallback since lightboxes are not being used.
 * @param {string} message - The message to display in the confirmation dialog.
 * @returns {Promise<boolean>} A promise that resolves to true (always, as there's no user input for this fallback).
 */
async function showConfirmationDialog(message) {
    displayInfo(message + " (Action will proceed automatically as no confirmation dialog is available.)", 5000);
    // In a real scenario without lightboxes, you'd need to implement a custom confirmation UI
    // using page elements, or rely on a different interaction pattern.
    // For now, we'll assume 'yes' to proceed with the action.
    return true;
}

/**
 * API Calls (adapted from GreenhouseDashboardApp)
 */
async function getAppointmentsByDateRange(startDate, endDate) {
    try {
        const response = await fetch(`${GET_AVAILABILITY_URL}?startDate=${startDate}&endDate=${endDate}`);
        if (!response.ok) {
            throw new Error(`Failed to get appointments: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error("Error in getAppointmentsByDateRange:", error);
        displayError('Failed to load appointments data.');
        throw error; // Re-throw to allow calling function to handle
    }
}

async function getConflictsForDateRange(startDate, endDate) {
    try {
        const response = await fetch(`${GET_CONFLICTS_FOR_DATE_RANGE_URL}?startDate=${startDate}&endDate=${endDate}`);
        if (!response.ok) {
            throw new Error(`Failed to get conflicts: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error("Error in getConflictsForDateRange:", error);
        displayError('Failed to load conflicts data.');
        throw error;
    }
}

async function updateAppointmentStatus(appointmentId, status) {
    try {
        const response = await fetch(UPDATE_APPOINTMENT_STATUS_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ appointmentId, status }),
        });
        if (!response.ok) {
            throw new Error(`Failed to update appointment status: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error("Error in updateAppointmentStatus:", error);
        displayError('Failed to update appointment status.');
        throw error;
    }
}

async function resolveConflict(conflictId, resolution) {
    try {
        const response = await fetch(RESOLVE_CONFLICT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ conflictId, resolution }),
        });
        if (!response.ok) {
            throw new Error(`Failed to resolve conflict: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error("Error in resolveConflict:", error);
        displayError('Failed to resolve conflict.');
        throw error;
    }
}

async function getServiceTypes() {
    try {
        const response = await fetch(GET_SERVICE_TYPES_URL);
        if (!response.ok) {
            throw new Error(`Failed to get service types: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error("Error in getServiceTypes:", error);
        displayError('Failed to load service types data.');
        throw error;
    }
}

/**
 * API Calls (adapted from GreenhousePatientApp)
 */
async function getServices() {
    try {
        const response = await fetch(GET_SERVICES_URL);
        if (!response.ok) {
            throw new Error(`Failed to get services: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error("Error in getServices:", error);
        displayError('Failed to load services.');
        throw error;
    }
}

async function getAppointments() {
    try {
        const response = await fetch(GET_APPOINTMENTS_URL);
        if (!response.ok) {
            throw new Error(`Failed to get appointments: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error("Error in getAppointments:", error);
        displayError('Failed to load appointments.');
        throw error;
    }
}

async function proposeAppointment(appointment) {
    try {
        const response = await fetch(PROPOSE_APPOINTMENT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(appointment),
        });
        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 409) {
                throw new ConflictError('Scheduling conflict detected.', errorData);
            } else {
                throw new Error(`Failed to propose appointment: ${response.status} - ${response.statusText}`);
            }
        }
        return response.json();
    } catch (error) {
        if (error instanceof ConflictError) {
            throw error; // Re-throw ConflictError to be handled by specific logic
        }
        console.error("Error in proposeAppointment:", error);
        displayError(`Error proposing appointment: ${error.message}`);
        throw error;
    }
}

async function createAppointment(appointment) {
    try {
        const response = await fetch(CREATE_APPOINTMENT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(appointment),
        });
        if (!response.ok) {
            throw new Error(`Failed to create appointment: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error("Error in createAppointment:", error);
        displayError(`Error creating appointment: ${error.message}`);
        throw error;
    }
}

async function updateAppointment(appointmentId, updatedAppointment) {
    try {
        const response = await fetch(`${UPDATE_APPOINTMENT_URL}/${appointmentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedAppointment),
        });
        if (!response.ok) {
            throw new Error(`Failed to update appointment: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error("Error in updateAppointment:", error);
        displayError(`Error updating appointment: ${error.message}`);
        throw error;
    }
}

async function deleteAppointment(appointmentId) {
    try {
        const response = await fetch(`${DELETE_APPOINTMENT_URL}/${appointmentId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`Failed to delete appointment: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error("Error in deleteAppointment:", error);
        displayError(`Error deleting appointment: ${error.message}`);
        throw error;
    }
}

/**
 * API Calls (adapted from GreenhouseAdminApp)
 */
async function getAppointmentById(appointmentId) {
    try {
        const response = await fetch(`${GET_APPOINTMENT_BY_ID_URL}/${appointmentId}`);
        if (!response.ok) {
            throw new Error(`Failed to get appointment: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error("Error in getAppointmentById:", error);
        displayError('Failed to get appointment details.');
        throw error;
    }
}

/**
 * @function validateField
 * @description Validates a single Wix form field based on its properties (e.g., required, type).
 * It also handles displaying/hiding error messages.
 * @param {object} field - The Wix form field element ($w component).
 * @param {object} errorElement - The Wix text element to display validation errors in.
 * @returns {boolean} True if the field is valid, false otherwise.
 */
function validateField(field, errorElement) {
    let isValid = true;
    let errorMessage = '';

    // Check if required field is empty
    if (field.required && (field.value === null || field.value === undefined || (typeof field.value === 'string' && field.value.trim() === ''))) {
        isValid = false;
        errorMessage = `${field.label || field.id} is required.`;
    }

    // Additional validation based on field type/id
    if (isValid && field.value) {
        switch (field.type) { // Assuming Wix input types like 'date', 'time'
            case 'date':
                const selectedDate = new Date(field.value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (selectedDate < today) {
                    isValid = false;
                    errorMessage = 'Please select a future date.';
                }
                break;
            case 'time': // Assuming time input or custom validation for time string
                const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
                if (typeof field.value === 'string' && !timeRegex.test(field.value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid time (HH:MM).';
                }
                break;
            // Add more validation types as needed (e.g., email, number)
        }
    }

    // Show/hide error message
    if (errorElement && errorElement.valid) {
        if (isValid) {
            errorElement.collapse();
        } else {
            errorElement.text = errorMessage;
            errorElement.expand();
        }
    } else if (errorElement && !errorElement.valid) {
        console.warn(`Scheduler: Error element for field ${field.id} not found or invalid.`);
    }

    return isValid;
}

/**
 * @function validateForm
 * @description Validates an entire form by iterating over its required fields.
 * It expects error elements to be associated with each field.
 * @param {string[]} fieldIds - An array of IDs for the form fields to validate.
 * @param {string} errorPrefix - The prefix for the error element IDs (e.g., 'errorPatientTitle').
 * @returns {boolean} True if the entire form is valid, false otherwise.
 */
function validateForm(fieldIds, errorPrefix) {
    let isFormValid = true;

    fieldIds.forEach(fieldId => {
        const field = $w(`#${fieldId}`);
        const errorEl = $w(`#${errorPrefix}${fieldId}`); // e.g., #errorPatientTitleInput
        if (field.valid && errorEl.valid) {
            if (!validateField(field, errorEl)) {
                isFormValid = false;
            }
        } else {
            console.warn(`Scheduler: Missing form field or error element for ID: ${fieldId}`);
        }
    });

    return isFormValid;
}

/**
 * Data Loading and Population (adapted from GreenhouseDashboardApp)
 */
async function triggerDataFetchAndPopulation() {
    displayInfo('Fetching dashboard data...', 0);
    const today = new Date();
    // Calculate start and end dates for the current week (Monday to Sunday)
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))); // Adjust for Sunday being 0
    const lastDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 7));

    const startDate = firstDayOfWeek.toISOString();
    const endDate = lastDayOfWeek.toISOString();

    let appointments = [];
    let conflicts = [];
    let serviceTypes = [];

    try {
        appointments = await getAppointmentsByDateRange(startDate, endDate);
    } catch (error) {
        console.error("Error fetching appointments for dashboard:", error);
        displayError('Failed to load dashboard appointments data.');
    }

    try {
        conflicts = await getConflictsForDateRange(startDate, endDate);
    } catch (error) {
        console.error("Error fetching conflicts for dashboard:", error);
        displayError('Failed to load dashboard conflicts data.');
    }

    try {
        serviceTypes = await getServiceTypes();
    } catch (error) {
        console.error("Error fetching service types for dashboard:", error);
        displayError('Failed to load dashboard service types data.');
    }

    // Always attempt to populate, even if data fetching failed
    populateWeeklySchedule(appointments, serviceTypes);
    populateConflictsList(conflicts);
    displaySuccess('Dashboard data loaded successfully!', 3000);
}

/**
 * Populates the dashboard calendar UI with dates for the given year and month.
 * @param {number} year - The year to display.
 * @param {number} month - The month to display (0-indexed).
 */
function populateDashboardCalendar(year, month) {
    const calendar = $w(schedulerState.uiElements.dashboardCalendar);
    const titleElement = $w(schedulerState.uiElements.dashboardCalendarTitle);

    if (!calendar.valid) {
        console.error('Scheduler: Dashboard calendar component not found or invalid.');
        return;
    }

    const date = new Date(year, month);
    const monthName = date.toLocaleString('default', { month: 'long' });
    const currentYear = date.getFullYear();

    if (titleElement.valid) {
        titleElement.text = `${monthName} ${currentYear}`;
    } else {
        console.warn('Scheduler: Dashboard calendar title element not found.');
    }

    // For a Wix calendar, we typically set the displayed month/year
    // and then disable/enable specific dates based on availability.
    calendar.value = new Date(year, month, 1); // Set to the first day of the month to display it
}

/**
 * Populates the weekly schedule UI with appointment data.
 * Assumes a Wix Table component with columns for Time and days of the week.
 * @param {Array<object>} appointments - List of appointment objects.
 * @param {Array<object>} serviceTypes - List of service type objects.
 */
function populateWeeklySchedule(appointments, serviceTypes) {
    const weeklyScheduleTable = $w(schedulerState.uiElements.weeklyScheduleTable);

    if (!weeklyScheduleTable.valid) {
        console.error('Scheduler: Weekly schedule table component not found or invalid.');
        return;
    }

    // Define table columns if not already defined (or ensure they match)
    weeklyScheduleTable.columns = [
        { "id": "time", "dataPath": "time", "label": "Time", "width": 80, "type": "text" },
        { "id": "sunday", "dataPath": "sunday", "label": "Sunday", "width": 120, "type": "text" },
        { "id": "monday", "dataPath": "monday", "label": "Monday", "width": 120, "type": "text" },
        { "id": "tuesday", "dataPath": "tuesday", "label": "Tuesday", "width": 120, "type": "text" },
        { "id": "wednesday", "dataPath": "wednesday", "label": "Wednesday", "width": 120, "type": "text" },
        { "id": "thursday", "dataPath": "thursday", "label": "Thursday", "width": 120, "type": "text" },
        { "id": "friday", "dataPath": "friday", "label": "Friday", "width": 120, "type": "text" },
        { "id": "saturday", "dataPath": "saturday", "label": "Saturday", "width": 120, "type": "text" },
    ];

    const tableRows = [];
    const workingHours = { start: 8, end: 17 }; // 8 AM to 5 PM, as in schedulerUI.js

    for (let hour = workingHours.start; hour <= workingHours.end; hour++) {
        const timeLabel = `${hour % 12 === 0 ? 12 : hour % 12}${hour < 12 ? ' AM' : ' PM'}`;
        const row = {
            _id: `hour-${hour}`, // Unique ID for repeater/table item
            time: timeLabel,
            sunday: '', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: ''
        };
        tableRows.push(row);
    }

    // Populate appointments into the rows
    if (appointments && appointments.length > 0) {
        appointments.forEach(appointment => {
            const apptDate = new Date(appointment.start);
            const apptDay = apptDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
            const apptHour = apptDate.getHours();

            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayColumn = dayNames[apptDay];

            const rowIndex = tableRows.findIndex(row => row._id === `hour-${apptHour}`);
            if (rowIndex !== -1 && dayColumn) {
                const serviceName = serviceTypes.find(s => s._id === appointment.serviceRef)?.name || 'Unknown Service';
                tableRows[rowIndex][dayColumn] += `${appointment.title} (${apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) - ${serviceName}\n`;
            }
        });
    }

    weeklyScheduleTable.rows = tableRows;
}

/**
 * Populates the conflicts list UI with conflict data.
 * Assumes a Wix Repeater component.
 * @param {Array<object>} conflicts - List of conflict objects.
 */
function populateConflictsList(conflicts) {
    const conflictRepeater = $w(schedulerState.uiElements.conflictRepeater);

    if (!conflictRepeater.valid) {
        console.error('Scheduler: Conflict repeater component not found or invalid.');
        return;
    }

    if (conflicts && conflicts.length > 0) {
        const repeaterData = conflicts.map((conflict, index) => ({
            _id: conflict.id || `conflict-${index}`, // Ensure unique ID
            title: conflict.title,
            date: conflict.date,
            time: conflict.time,
            reason: conflict.reason || 'N/A',
            conflictId: conflict.id // For event handling
        }));
        conflictRepeater.data = repeaterData;
        conflictRepeater.expand(); // Ensure repeater is visible
    } else {
        conflictRepeater.data = [{ _id: 'no-conflicts', title: 'No conflicts found.', date: '', time: '', reason: '' }];
        conflictRepeater.collapse(); // Hide repeater if no conflicts
    }

    // Set up itemReady for the repeater
    conflictRepeater.onItemReady(($item, itemData, index) => {
        $item('#conflictTitle').text = itemData.title; // Assuming text element for title
        $item('#conflictDate').text = `Date: ${itemData.date}`; // Assuming text element for date
        $item('#conflictTime').text = `Time: ${itemData.time}`; // Assuming text element for time
        $item('#conflictReason').text = `Reason: ${itemData.reason}`; // Assuming text element for reason
        $item('#resolveConflictButton').onClick(() => { // Assuming a button to resolve conflict
            displayInfo(`Resolving conflict ${itemData.conflictId}...`);
            // Implement actual conflict resolution logic here
            // After resolution, refresh data
            triggerDataFetchAndPopulation();
        });
    });
}

/**
 * Function to initialize the Dashboard application.
 * Sets up event listeners and initial UI state.
 */
function initializeDashboardApp() {
    // Event listener for fetching data
    const fetchDataButton = $w(schedulerState.uiElements.dashboardFetchDataButton);
    if (fetchDataButton.valid) {
        fetchDataButton.onClick(triggerDataFetchAndPopulation);
    } else {
        console.warn('Scheduler: Dashboard fetch data button not found.');
    }

    // Event listeners for calendar navigation
    const prevButton = $w(schedulerState.uiElements.dashboardCalendarPrevButton);
    const nextButton = $w(schedulerState.uiElements.dashboardCalendarNextButton);
    const calendar = $w(schedulerState.uiElements.dashboardCalendar);

    if (prevButton.valid) {
        prevButton.onClick(() => {
            schedulerState.dashboard.currentMonth = (schedulerState.dashboard.currentMonth - 1 + 12) % 12;
            if (schedulerState.dashboard.currentMonth === 11) {
                schedulerState.dashboard.currentYear--;
            }
            populateDashboardCalendar(schedulerState.dashboard.currentYear, schedulerState.dashboard.currentMonth);
        });
    }
    if (nextButton.valid) {
        nextButton.onClick(() => {
            schedulerState.dashboard.currentMonth = (schedulerState.dashboard.currentMonth + 1) % 12;
            if (schedulerState.dashboard.currentMonth === 0) {
                schedulerState.dashboard.currentYear++;
            }
            populateDashboardCalendar(schedulerState.dashboard.currentYear, schedulerState.dashboard.currentMonth);
        });
    }

    if (calendar.valid) {
        calendar.onChange((event) => {
            const selectedDate = event.target.value;
            displayInfo(`Dashboard: Selected date: ${selectedDate.toDateString()}`);
            // Implement logic to load appointments for the selected date if needed
        });
    }

    // Initial population of calendar UI
    populateDashboardCalendar(schedulerState.dashboard.currentYear, schedulerState.dashboard.currentMonth);
}

/**
 * Function to initialize the patient application (combines UI setup and event listeners)
 */
function initializePatientApp() {
    // Populate services dropdown and appointments list
    populateServicesDropdown();
    populateAppointments();

    // Set up event listeners for the patient form and other interactive elements
    setupPatientEventListeners();

    // Expand the patient form and instructions panel if they are initially collapsed
    $w(schedulerState.uiElements.patientFormContainer).expand();
    $w(schedulerState.uiElements.instructionsPanel).expand();
}

/**
 * Renamed setupEventListeners to setupPatientEventListeners to clarify its scope
 */
function setupPatientEventListeners() {
    // When a service is selected, populate the therapist dropdown
    $w(schedulerState.uiElements.serviceSelect).onChange((event) => {
        const serviceId = event.target.value;
        if (serviceId) {
            populateTherapistsDropdown(serviceId);
            $w(schedulerState.uiElements.therapistDropdown).enable();
        } else {
            $w(schedulerState.uiElements.therapistDropdown).disable();
        }
    });

    // When a therapist is selected, load their calendar availability
    $w(schedulerState.uiElements.therapistDropdown).onChange((event) => {
        const therapistId = event.target.value;
        if (therapistId) {
            loadCalendarAvailability(therapistId, new Date());
            $w(schedulerState.uiElements.calendar).enable();
        } else {
            $w(schedulerState.uiElements.calendar).disable();
        }
    });

    // When a date is selected in the calendar, show available time slots
    $w(schedulerState.uiElements.calendar).onChange((event) => {
        const selectedDate = event.target.value;
        const therapistId = $w(schedulerState.uiElements.therapistDropdown).value;
        loadTimeSlotsForDate(selectedDate, therapistId);
    });

    // Handle patient form submission
    $w(schedulerState.uiElements.proposeAppointmentButton).onClick(async (event) => {
        const patientFormFields = [
            schedulerState.uiElements.patientTitleInput.substring(schedulerState.uiElements.schedulingContainer.length + 1),
            schedulerState.uiElements.patientDateInput.substring(schedulerState.uiElements.schedulingContainer.length + 1),
            schedulerState.uiElements.patientTimeInput.substring(schedulerState.uiElements.schedulingContainer.length + 1),
            schedulerState.uiElements.patientPlatformInput.substring(schedulerState.uiElements.schedulingContainer.length + 1),
            schedulerState.uiElements.serviceSelect.substring(schedulerState.uiElements.schedulingContainer.length + 1)
        ];
        const errorPrefix = 'error'; // e.g., #errorPatientTitleInput

        if (validateForm(patientFormFields, errorPrefix)) {
            showLoadingSpinner(true);
            displayInfo('Submitting appointment request...', 0); // Sticky info message

            const proposeButton = $w(schedulerState.uiElements.proposeAppointmentButton);
            const isUpdate = proposeButton.id === 'updateAppointmentButton';
            const appointmentId = proposeButton.dataset.appointmentId;

            const appointmentData = {
                title: $w(schedulerState.uiElements.patientTitleInput).value,
                date: $w(schedulerState.uiElements.patientDateInput).value.toISOString().split('T')[0], // YYYY-MM-DD
                time: $w(schedulerState.uiElements.patientTimeInput).value, // HH:MM
                platform: $w(schedulerState.uiElements.patientPlatformInput).value,
                serviceRef: $w(schedulerState.uiElements.serviceSelect).value,
                therapist: $w(schedulerState.uiElements.therapistDropdown).value // Assuming therapist is selected
            };

            const startDateTime = new Date(`${appointmentData.date}T${appointmentData.time}:00`);
            const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Assuming 1-hour appointments

            const fullAppointment = {
                ...appointmentData,
                start: startDateTime.toISOString(),
                end: endDateTime.toISOString(),
            };

            try {
                // Always propose first to check for conflicts
                await proposeAppointment(fullAppointment);

                if (isUpdate) {
                    await updateAppointment(appointmentId, fullAppointment);
                    displaySuccess('Appointment updated successfully!', 3000);
                } else {
                    await createAppointment(fullAppointment);
                    displaySuccess('Appointment requested successfully!', 3000);
                }
                resetForm();
                populateAppointments(); // Refresh list
            } catch (error) {
                if (error instanceof ConflictError) {
                    // Since lightboxes are not used, display conflict as a sticky error message
                    displayError(`Scheduling conflict detected: ${error.message}. Please choose a different time.`, 0);
                } else {
                    console.error("Error during appointment operation:", error);
                    displayError(`Failed to ${isUpdate ? 'update' : 'request'} appointment: ${error.message}`);
                }
            } finally {
                showLoadingSpinner(false);
                $w(schedulerState.uiElements.notificationBox).collapse(); // Collapse sticky info message
            }
        } else {
            displayError('Please correct the errors in the form.');
        }
    });

    // Real-time validation on blur and input for patient form fields
    const patientFormInputIds = [
        schedulerState.uiElements.patientTitleInput,
        schedulerState.uiElements.patientDateInput,
        schedulerState.uiElements.patientTimeInput,
        schedulerState.uiElements.patientPlatformInput,
        schedulerState.uiElements.serviceSelect
    ];

    patientFormInputIds.forEach(id => {
        const field = $w(id);
        const errorEl = $w(`#error${id.substring(schedulerState.uiElements.schedulingContainer.length + 1)}`); // e.g., #errorPatientTitleInput
        if (field.valid && errorEl.valid) {
            field.onCustomValidation((value, reject) => {
                if (!validateField(field, errorEl)) {
                    reject(errorEl.text); // Use the error message set by validateField
                }
            });
            field.onBlur(() => {
                validateField(field, errorEl);
            });
            field.onChange(() => { // Clear error on change
                if (errorEl.valid) errorEl.collapse();
            });
        }
    });

    // When a time slot is clicked, open the booking form
    $w(schedulerState.uiElements.timeSlotsRepeater).onItemReady(($item, itemData, index) => {
        $item('#timeSlotButton').label = itemData.time; // e.g., "9:00 AM"
        $item('#timeSlotButton').onClick(() => {
            // Since lightboxes are not used for booking form,
            // we would typically populate a form section on the page directly.
            // For now, we'll just display an info message.
            displayInfo(`Selected time slot: ${itemData.time}. Proceeding to book... (Booking form lightbox removed)`, 3000);
            // A full implementation would involve populating a hidden form on the page
            // and then expanding it, or navigating to a dedicated booking page.
        });
    });
}

async function populateServicesDropdown() {
    try {
        const services = await getServices(); // Use the new getServices API call
        const options = services.map(service => ({ label: service.name, value: service._id }));
        $w(schedulerState.uiElements.serviceSelect).options = [{ label: 'Select a Service', value: '' }, ...options];
        $w(schedulerState.uiElements.serviceSelect).enable();
    } catch (err) {
        console.error("Error fetching services:", err);
        displayError("Failed to load services.");
        $w(schedulerState.uiElements.serviceSelect).options = [{ label: 'Failed to load services.', value: '' }];
    }
}

async function populateTherapistsDropdown(serviceId) {
    try {
        const response = await fetch(`${GET_THERAPISTS_BY_SERVICE_URL}?serviceId=${serviceId}`, { method: 'get' });
        if (!response.ok) {
            throw new Error(`Failed to get therapists: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();
        const options = data.therapists.map(therapist => ({ label: therapist.name, value: therapist._id }));
        $w(schedulerState.uiElements.therapistDropdown).options = [{ label: 'Select a Therapist', value: '' }, ...options];
        $w(schedulerState.uiElements.therapistDropdown).enable();
    } catch (err) {
        console.error("Error fetching therapists:", err);
        displayError("Failed to load therapists.");
        $w(schedulerState.uiElements.therapistDropdown).options = [{ label: 'Failed to load therapists.', value: '' }];
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
    $w(schedulerState.uiElements.timeSlotsRepeater).data = timeSlots;
    $w(schedulerState.uiElements.timeSlotsRepeater).expand();
}

function showConfirmationMessage() {
    // Since lightboxes are not used, and #mainContent and #confirmationMessage are removed,
    // we'll use the notification system to display a success message.
    displaySuccess('Your appointment has been successfully confirmed!', 3000);
}

/**
 * UI Population Functions (adapted from GreenhousePatientApp)
 */
async function populateAppointments() {
    const appointmentsRepeater = $w(schedulerState.uiElements.patientAppointmentsRepeater);
    if (!appointmentsRepeater.valid) {
        console.error('Scheduler: Patient appointments repeater not found or invalid.');
        return;
    }

    try {
        const appointments = await getAppointments();
        if (appointments.length === 0) {
            appointmentsRepeater.data = [{ _id: 'no-appointments', message: 'No appointments scheduled.' }];
            appointmentsRepeater.onItemReady(($item, itemData, index) => {
                $item('#appointmentTitle').text = itemData.message; // Assuming a text element for message
                $item('#editAppointmentButton').collapse(); // Hide buttons
                $item('#deleteAppointmentButton').collapse();
            });
            appointmentsRepeater.expand();
            return;
        }

        const repeaterData = appointments.map(appointment => ({
            _id: appointment._id,
            title: appointment.title,
            date: new Date(appointment.start).toLocaleDateString(),
            time: new Date(appointment.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            platform: appointment.platform,
            serviceRef: appointment.serviceRef,
            originalAppointment: appointment // Store original object for editing
        }));
        appointmentsRepeater.data = repeaterData;
        appointmentsRepeater.expand();

        appointmentsRepeater.onItemReady(($item, itemData, index) => {
            $item('#appointmentTitle').text = itemData.title;
            $item('#appointmentDateTime').text = `Date: ${itemData.date} at ${itemData.time}`;
            $item('#appointmentPlatform').text = `Platform: ${itemData.platform}`;

            $item('#editAppointmentButton').onClick(() => {
                populateFormForEdit(itemData.originalAppointment);
                displayInfo('Editing appointment. Please update the form and click "Update Appointment".', 0);
            });

            $item('#deleteAppointmentButton').onClick(async () => {
                const confirmed = await showConfirmationDialog('Are you sure you want to delete this appointment?');
                if (confirmed) {
                    displayInfo('Deleting appointment...', 0);
                    try {
                        await deleteAppointment(itemData._id);
                        displaySuccess('Appointment deleted successfully!', 3000);
                        populateAppointments(); // Refresh list
                        resetForm();
                    } catch (error) {
                        displayError('Failed to delete appointment: ' + error.message);
                    } finally {
                        $w(schedulerState.uiElements.notificationBox).collapse();
                    }
                }
            });
        });
    } catch (error) {
        console.error("Error fetching appointments for patient view:", error);
        displayError("Failed to load your appointments.");
        appointmentsRepeater.data = [{ _id: 'error-loading', message: 'Failed to load appointments.' }];
        appointmentsRepeater.onItemReady(($item, itemData, index) => {
            $item('#appointmentTitle').text = itemData.message;
            $item('#editAppointmentButton').collapse();
            $item('#deleteAppointmentButton').collapse();
        });
        appointmentsRepeater.expand();
    }
}

function populateFormForEdit(appointment) {
    $w(schedulerState.uiElements.patientTitleInput).value = appointment.title;
    $w(schedulerState.uiElements.patientDateInput).value = new Date(appointment.start);
    $w(schedulerState.uiElements.patientTimeInput).value = new Date(appointment.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    $w(schedulerState.uiElements.patientPlatformInput).value = appointment.platform;
    $w(schedulerState.uiElements.serviceSelect).value = appointment.serviceRef;

    const proposeButton = $w(schedulerState.uiElements.proposeAppointmentButton);
    proposeButton.label = 'Update Appointment';
    proposeButton.id = 'updateAppointmentButton'; // Change ID for specific handling
    proposeButton.dataset.appointmentId = appointment._id;
}

function resetForm() {
    $w(schedulerState.uiElements.patientTitleInput).value = '';
    $w(schedulerState.uiElements.patientDateInput).value = null;
    $w(schedulerState.uiElements.patientTimeInput).value = '';
    $w(schedulerState.uiElements.patientPlatformInput).value = '';
    $w(schedulerState.uiElements.serviceSelect).value = '';

    const proposeButton = $w(schedulerState.uiElements.proposeAppointmentButton);
    proposeButton.label = 'Request Appointment';
    proposeButton.id = 'proposeAppointmentButton'; // Reset ID
    delete proposeButton.dataset.appointmentId;

    // Clear any validation messages
    const patientFormFields = [
        schedulerState.uiElements.patientTitleInput.substring(schedulerState.uiElements.schedulingContainer.length + 1),
        schedulerState.uiElements.patientDateInput.substring(schedulerState.uiElements.schedulingContainer.length + 1),
        schedulerState.uiElements.patientTimeInput.substring(schedulerState.uiElements.schedulingContainer.length + 1),
        schedulerState.uiElements.patientPlatformInput.substring(schedulerState.uiElements.schedulingContainer.length + 1),
        schedulerState.uiElements.serviceSelect.substring(schedulerState.uiElements.schedulingContainer.length + 1)
    ];
    patientFormFields.forEach(fieldId => {
        const errorEl = $w(`#error${fieldId}`);
        if (errorEl.valid) errorEl.collapse();
    });
}

function showLoadingSpinner(show) {
    const spinner = $w(schedulerState.uiElements.patientLoadingSpinner);
    const proposeButton = $w(schedulerState.uiElements.proposeAppointmentButton);
    if (spinner.valid && proposeButton.valid) {
        if (show) {
            spinner.expand();
            proposeButton.collapse();
        } else {
            spinner.collapse();
            proposeButton.expand();
        }
    } else {
        console.warn('Scheduler: Patient loading spinner or propose button not found.');
    }
}

// Modified: showConflictModal to use displayError as lightboxes are not used.
function showConflictModal(conflictData) {
    displayError(`Scheduling conflict detected: ${conflictData.message || 'Please choose a different time.'}`, 0);
    // In a full implementation without lightboxes, a custom UI for conflict resolution
    // would need to be built using existing page elements.
}

function hideConflictModal() {
    // No action needed as conflicts are displayed via sticky error messages.
}

/**
 * Data Loading and Population (adapted from GreenhouseAdminApp)
 */
async function loadAdminAppointmentData(appointmentId) {
    displayInfo('Loading appointment data...', 0);
    try {
        const [currentAppointment, serviceTypes] = await Promise.all([
            getAppointmentById(appointmentId),
            getServiceTypes()
        ]);

        schedulerState.admin.currentAppointment = currentAppointment;
        schedulerState.admin.serviceTypes = serviceTypes;

        if (!currentAppointment) {
            displayError('Appointment not found.');
            $w(schedulerState.uiElements.adminMessageText).text = 'Appointment not found.';
            $w(schedulerState.uiElements.adminMessageText).expand();
            $w(schedulerState.uiElements.adminAppointmentForm).collapse(); // Hide form if no appointment
            return;
        }

        // Populate the admin form with data
        populateAdminAppointmentForm(currentAppointment, serviceTypes);
        $w(schedulerState.uiElements.adminAppointmentForm).expand(); // Show form
        $w(schedulerState.uiElements.adminMessageText).collapse(); // Hide message

        displaySuccess('Appointment data loaded successfully!', 3000);

    } catch (error) {
        console.error("Error fetching admin appointment data:", error);
        displayError('Failed to load appointment details. Please check the console and try again.');
        $w(schedulerState.uiElements.adminMessageText).text = 'Failed to load appointment details. Please check the console and try again.';
        $w(schedulerState.uiElements.adminMessageText).expand();
        $w(schedulerState.uiElements.adminAppointmentForm).collapse();
    } finally {
        $w(schedulerState.uiElements.notificationBox).collapse(); // Collapse sticky info message
    }
}

/**
 * Populates the admin appointment form with data.
 * @param {object} appointment - The appointment data.
 * @param {Array<object>} serviceTypes - Available service types.
 */
function populateAdminAppointmentForm(appointment, serviceTypes) {
    $w(schedulerState.uiElements.adminTitleInput).value = appointment.title || '';
    $w(schedulerState.uiElements.adminStartInput).value = appointment.start ? new Date(appointment.start).toISOString().substring(0, 16) : '';
    $w(schedulerState.uiElements.adminEndInput).value = appointment.end ? new Date(appointment.end).toISOString().substring(0, 16) : '';
    $w(schedulerState.uiElements.adminPlatformInput).value = appointment.platform || '';

    const serviceSelect = $w(schedulerState.uiElements.adminServiceSelect);
    if (serviceSelect.valid) {
        const options = serviceTypes.map(st => ({ label: st.name, value: st._id }));
        serviceSelect.options = [{ label: 'Select a service...', value: '' }, ...options];
        serviceSelect.value = appointment.serviceRef || '';
    } else {
        console.warn('Scheduler: Admin service select element not found or invalid.');
    }

    $w(schedulerState.uiElements.adminConfirmedCheckbox).checked = appointment.confirmed || false;
    $w(schedulerState.uiElements.adminConflictsTextarea).value = appointment.conflicts ? JSON.stringify(appointment.conflicts, null, 2) : '';
    $w(schedulerState.uiElements.adminFirstNameInput).value = appointment.firstName || '';
    $w(schedulerState.uiElements.adminLastNameInput).value = appointment.lastName || '';
    $w(schedulerState.uiElements.adminContactInfoInput).value = appointment.contactInfo || '';
    $w(schedulerState.uiElements.adminAnonymousIdInput).value = appointment.anonymousId || '';

    // Store appointment ID on the form or a hidden element for update/delete actions
    const adminAppointmentForm = $w(schedulerState.uiElements.adminAppointmentForm);
    if (adminAppointmentForm.valid) {
        adminAppointmentForm.dataset.appointmentId = appointment._id;
    } else {
        console.warn('Scheduler: Admin appointment form element not found or invalid.');
    }
}

/**
 * Function to initialize the Admin application.
 * Checks for appointmentId in URL and loads data, or displays a message.
 * Sets up event listeners for the admin form.
 */
function initializeAdminApp() {
    const urlParams = new URLSearchParams(wixLocation.query);
    const appointmentId = urlParams.get('appointmentId');

    // Hide form and message initially
    $w(schedulerState.uiElements.adminAppointmentForm).collapse();
    $w(schedulerState.uiElements.adminMessageText).collapse();

    if (appointmentId) {
        loadAdminAppointmentData(appointmentId);
    } else {
        $w(schedulerState.uiElements.adminMessageText).text = 'Admin Appointment Form: Provide an appointment ID in the URL (e.g., ?appointmentId=123) to load and edit a specific appointment.';
        $w(schedulerState.uiElements.adminMessageText).expand();
        // Also populate an empty form for new appointments or general settings if needed
        populateAdminAppointmentForm({}, []); // Populate with empty data
        $w(schedulerState.uiElements.adminAppointmentForm).expand(); // Show empty form
    }

    // Set up event listeners for the admin form
    const adminForm = $w(schedulerState.uiElements.adminAppointmentForm);
    if (adminForm.valid) {
        // Assuming individual validation for admin form fields if needed
        // For now, relying on validateForm on submit

        $w(schedulerState.uiElements.adminSaveButton).onClick(async () => {
            const formFields = [
                schedulerState.uiElements.adminTitleInput.substring(schedulerState.uiElements.schedulingContainer.length + 1),
                schedulerState.uiElements.adminStartInput.substring(schedulerState.uiElements.schedulingContainer.length + 1),
                schedulerState.uiElements.adminEndInput.substring(schedulerState.uiElements.schedulingContainer.length + 1),
                schedulerState.uiElements.adminPlatformInput.substring(schedulerState.uiElements.schedulingContainer.length + 1),
                schedulerState.uiElements.adminServiceSelect.substring(schedulerState.uiElements.schedulingContainer.length + 1),
                schedulerState.uiElements.adminFirstNameInput.substring(schedulerState.uiElements.schedulingContainer.length + 1),
                schedulerState.uiElements.adminLastNameInput.substring(schedulerState.uiElements.schedulingContainer.length + 1),
                schedulerState.uiElements.adminContactInfoInput.substring(schedulerState.uiElements.schedulingContainer.length + 1)
            ];
            const errorPrefix = 'error'; // Assuming error elements like #errorAdminTitleInput

            if (validateForm(formFields, errorPrefix)) {
                displayInfo('Saving appointment changes...', 0);
                try {
                    const currentApptId = adminForm.dataset.appointmentId;
                    const updatedData = {
                        title: $w(schedulerState.uiElements.adminTitleInput).value,
                        start: $w(schedulerState.uiElements.adminStartInput).value,
                        end: $w(schedulerState.uiElements.adminEndInput).value,
                        platform: $w(schedulerState.uiElements.adminPlatformInput).value,
                        serviceRef: $w(schedulerState.uiElements.adminServiceSelect).value,
                        confirmed: $w(schedulerState.uiElements.adminConfirmedCheckbox).checked,
                        conflicts: JSON.parse($w(schedulerState.uiElements.adminConflictsTextarea).value || '[]'),
                        firstName: $w(schedulerState.uiElements.adminFirstNameInput).value,
                        lastName: $w(schedulerState.uiElements.adminLastNameInput).value,
                        contactInfo: $w(schedulerState.uiElements.adminContactInfoInput).value,
                        anonymousId: $w(schedulerState.uiElements.adminAnonymousIdInput).value
                    };
                    await updateAppointment(currentApptId, updatedData);
                    displaySuccess('Appointment updated successfully!', 3000);
                    // Optionally refresh dashboard or patient view if needed
                } catch (error) {
                    console.error("Error saving admin appointment:", error);
                    displayError('Failed to save appointment changes: ' + error.message);
                } finally {
                    $w(schedulerState.uiElements.notificationBox).collapse();
                }
            } else {
                displayError('Please correct the errors in the form.');
            }
        });

        $w(schedulerState.uiElements.adminDeleteButton).onClick(async () => {
            const confirmed = await showConfirmationDialog('Are you sure you want to delete this appointment? This action cannot be undone.');
            if (confirmed) {
                displayInfo('Deleting appointment...', 0);
                try {
                    const currentApptId = adminForm.dataset.appointmentId;
                    await deleteAppointment(currentApptId);
                    displaySuccess('Appointment deleted successfully!', 3000);
                    $w(schedulerState.uiElements.adminAppointmentForm).collapse();
                    $w(schedulerState.uiElements.adminMessageText).text = 'Appointment has been deleted.';
                    $w(schedulerState.uiElements.adminMessageText).expand();
                    // Optionally navigate away or refresh dashboard
                } catch (error) {
                    console.error("Error deleting admin appointment:", error);
                    displayError('Failed to delete appointment: ' + error.message);
                } finally {
                    $w(schedulerState.uiElements.notificationBox).collapse();
                }
            }
        });
    } else {
        console.warn('Scheduler: Admin appointment form component not found or invalid.');
        $w(schedulerState.uiElements.adminMessageText).text = 'Admin form components not found. Please ensure they are added to the page.';
        $w(schedulerState.uiElements.adminMessageText).expand();
    }
}

// Main initialization function for the scheduler application
async function initScheduler() {
    if (schedulerState.isInitialized || schedulerState.isLoading) {
        console.log('Scheduler: Already initialized or loading, skipping');
        return;
    }

    schedulerState.isLoading = true;
    try {
        // Ensure the main scheduling container is visible
        const schedulingContainer = $w(schedulerState.uiElements.schedulingContainer);
        if (schedulingContainer.valid) {
            schedulingContainer.expand();
        } else {
            console.error('Scheduler: Main #schedulingContainer not found. Aborting initialization.');
            displayError('Main scheduling container not found. Please ensure the #schedulingContainer element exists on the page.');
            return;
        }

        // Hide all main view containers initially
        $w(schedulerState.uiElements.patientContainer).collapse();
        $w(schedulerState.uiElements.dashboardContainer).collapse();
        $w(schedulerState.uiElements.adminContainer).collapse();
        $w(schedulerState.uiElements.notificationBox).collapse();

        // --- BEGIN: Display All Views (Temporary for Development) ---
        // As per user request, all scheduler UI components are displayed by default
        // until the application is completely developed and authorization checks are in place.
        // All UI elements are assumed to be children of #schedulingContainer.

        // Expand all relevant containers for development visibility
        $w(schedulerState.uiElements.patientContainer).expand();
        $w(schedulerState.uiElements.dashboardContainer).expand();
        $w(schedulerState.uiElements.adminContainer).expand();

        // Initialize all application logic
        initializePatientApp();
        initializeDashboardApp();
        initializeAdminApp();
        // --- END: Display All Views (Temporary for Development) ---

        schedulerState.isInitialized = true;
        displaySuccess('Scheduling application loaded successfully', 3000);

    } catch (error) {
        console.error('Scheduler: Initialization failed:', error);
        schedulerState.errors.push(error);
        displayError(`Failed to load the scheduling application: ${error.message}`);
    } finally {
        schedulerState.isLoading = false;
    }
}

$w.onReady(function () {
    initScheduler();
});
