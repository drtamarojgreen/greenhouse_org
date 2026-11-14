const GreenhouseAdminApp = (function() {
    'use strict';

    const GreenhouseUtils = window.GreenhouseUtils;
    const GreenhouseSchedulerUI = window.GreenhouseSchedulerUI;

    if (!GreenhouseUtils) {
        console.error('GreenhouseAdminApp: GreenhouseUtils not found. Ensure GreenhouseUtils.js is loaded.');
        return;
    }
    if (!GreenhouseSchedulerUI) {
        console.error('GreenhouseAdminApp: GreenhouseSchedulerUI not found. Ensure schedulerUI.js is loaded.');
        return;
    }

    const adminAppState = {
        leftAppContainer: null,
        adminFormContainer: null,
        adminAppointmentForm: null,
        currentAppointment: null,
        serviceTypes: [],
    };

    /**
     * API Calls
     */
    async function getAppointmentById(appointmentId) {
        const response = await fetch(`/_functions/getAppointmentById/${appointmentId}`);
        if (!response.ok) {
            throw new Error(`Failed to get appointment: ${response.statusText}`);
        }
        return response.json();
    }

    async function updateAppointment(appointmentId, updatedData) {
        const response = await fetch(`/_functions/updateAppointment/${appointmentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ appointmentId, updatedData }),
        });
        if (!response.ok) {
            throw new Error(`Failed to update appointment: ${response.statusText}`);
        }
        return response.json();
    }

    async function deleteAppointment(appointmentId) {
        const response = await fetch(`/_functions/deleteAppointment/${appointmentId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`Failed to delete appointment: ${response.statusText}`);
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
    async function loadAppointmentData(appointmentId) {
        try {
            const [currentAppointment, serviceTypes] = await Promise.all([
                getAppointmentById(appointmentId),
                getServiceTypes()
            ]);

            adminAppState.currentAppointment = currentAppointment;
            adminAppState.serviceTypes = serviceTypes;

            if (!currentAppointment) {
                GreenhouseUtils.displayError('Appointment not found.');
                adminAppState.adminFormContainer.innerHTML = '<p>Appointment not found.</p>';
                return;
            }

            // Build and append the form using schedulerUI, passing initial data
            GreenhouseSchedulerUI.buildAdminAppointmentFormUI(adminAppState.adminFormContainer, currentAppointment, serviceTypes);
            adminAppState.adminAppointmentForm = adminAppState.adminFormContainer.querySelector('[data-identifier="admin-appointment-form"]');

            // Attach event listeners to the form for delegation
            if (adminAppState.adminAppointmentForm) {
                adminAppState.adminAppointmentForm.addEventListener('click', handleAction);
                adminAppState.adminAppointmentForm.addEventListener('submit', handleAction);
            }

        } catch (error) {
            console.error("Error fetching data:", error);
            GreenhouseUtils.displayError('Failed to load appointment details. Please check the console and try again.');
            adminAppState.adminFormContainer.innerHTML = '<p style="color:red;">Failed to load appointment details. Please check the console and try again.</p>';
        }
    }

    /**
     * Event Handlers
     */
    async function handleDelete(appointmentId) {
        if (confirm('Are you sure you want to delete this appointment?')) {
            try {
                await deleteAppointment(appointmentId);
                GreenhouseUtils.displaySuccess('Appointment deleted successfully!');
                adminAppState.adminFormContainer.innerHTML = '<p>Appointment has been deleted.</p>';
            } catch (error) {
                console.error("Error deleting appointment:", error);
                GreenhouseUtils.displayError('Failed to delete appointment.');
            }
        }
    }

    async function handleAction(event) {
        const target = event.target;
        const action = target.dataset.action;
        const form = target.closest('form'); // Get the closest form element

        if (!form) {
            console.warn('GreenhouseAdminApp: Action triggered outside a form context.');
            return;
        }

        const appointmentId = form.dataset.appointmentId;

        if (event.type === 'submit' && action === 'save-changes') {
            event.preventDefault(); // Prevent default form submission

            if (!GreenhouseUtils.validateForm(form, 'admin-app-admin')) { // Assuming admin-app-admin as prefix
                GreenhouseUtils.displayError('Please correct the errors in the form.');
                return;
            }

            const updatedData = {
                _id: appointmentId,
                title: form.querySelector('[data-identifier="admin-app-adminTitle"]').value,
                start: form.querySelector('[data-identifier="admin-app-adminStart"]').value,
                end: form.querySelector('[data-identifier="admin-app-adminEnd"]').value,
                platform: form.querySelector('[data-identifier="admin-app-adminPlatform"]').value,
                serviceRef: form.querySelector('[data-identifier="admin-app-adminService"]').value,
                confirmed: form.querySelector('[data-identifier="admin-app-adminConfirmed"]').checked,
                conflicts: form.querySelector('[data-identifier="admin-app-adminConflicts"]').value,
                firstName: form.querySelector('[data-identifier="admin-app-adminFirstName"]').value,
                lastName: form.querySelector('[data-identifier="admin-app-adminLastName"]').value,
                contactInfo: form.querySelector('[data-identifier="admin-app-adminContactInfo"]').value,
                anonymousId: form.querySelector('[data-identifier="admin-app-adminAnonymousId"]').value
            };

            try {
                await updateAppointment(appointmentId, updatedData);
                GreenhouseUtils.displaySuccess('Appointment updated successfully!');
            } catch (error) {
                console.error("Error updating appointment:", error);
                GreenhouseUtils.displayError('Failed to update appointment.');
            }
            return;
        }

        switch (action) {
            case 'delete-appointment':
                handleDelete(appointmentId);
                break;
        }
    }

    /**
     * @function init
     * @description Initializes the Admin application.
     * @param {HTMLElement} leftAppContainer - The main DOM element for the left panel.
     * @param {HTMLElement} [rightAppContainer] - The main DOM element for the right panel (not used in Admin view).
     */
    async function init(leftAppContainer, rightAppContainer = null) {
        adminAppState.leftAppContainer = leftAppContainer;
        adminAppState.adminFormContainer = leftAppContainer.querySelector('[data-identifier="admin-form-container"]');

        // Defensive Programming: Check if the container was found
        if (!adminAppState.adminFormContainer) {
            console.error('GreenhouseAdminApp: Could not find the admin form container within the provided leftAppContainer.');
            // Optionally, display an error message in a more prominent way
            if (leftAppContainer) {
                leftAppContainer.innerHTML = '<p style="color: red; font-weight: bold;">Error: Admin application failed to initialize. The required form container is missing.</p>';
            }
            return; // Stop execution if the essential container is not found
        }

        const appointmentId = new URLSearchParams(window.location.search).get('appointmentId');

        // As per user request, display all UI elements by default.
        // If no appointmentId is provided, display a generic message in the admin form.
        if (!appointmentId) {
            if (adminAppState.adminFormContainer) {
                adminAppState.adminFormContainer.innerHTML = '<p>Admin Appointment Form: Provide an appointment ID in the URL (e.g., ?appointmentId=123) to load and edit a specific appointment.</p>';
            }
            // Also ensure the form UI is built, even if empty
            GreenhouseSchedulerUI.buildAdminAppointmentFormUI(adminAppState.adminFormContainer, {}, []);
            adminAppState.adminAppointmentForm = adminAppState.adminFormContainer.querySelector('[data-identifier="admin-appointment-form"]');
            if (adminAppState.adminAppointmentForm) {
                adminAppState.adminAppointmentForm.addEventListener('click', handleAction);
                adminAppState.adminAppointmentForm.addEventListener('submit', handleAction);
            }
            return;
        }

        // If an appointmentId is provided, proceed to load and populate data.
        await loadAppointmentData(appointmentId);
    }

    return {
        init: init,
        getAppointmentById: getAppointmentById,
        updateAppointment: updateAppointment,
        deleteAppointment: deleteAppointment,
        getServiceTypes: getServiceTypes,
    };
})();
