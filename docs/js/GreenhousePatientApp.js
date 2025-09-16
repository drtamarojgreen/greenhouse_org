const GreenhousePatientApp = (function() {
    'use strict';

    const GreenhouseUtils = window.GreenhouseUtils;
    const GreenhouseSchedulerUI = window.GreenhouseSchedulerUI;

    if (!GreenhouseUtils) {
        console.error('GreenhousePatientApp: GreenhouseUtils not found. Ensure GreenhouseUtils.js is loaded.');
        return;
    }
    if (!GreenhouseSchedulerUI) {
        console.error('GreenhousePatientApp: GreenhouseSchedulerUI not found. Ensure schedulerUI.js is loaded.');
        return;
    }

    console.log("Loading GreenhousePatientApp.js - Version 0.0.0.2"); // Updated version

    const patientAppState = {
        leftAppContainer: null,
        rightAppContainer: null,
        patientFormContainer: null,
        patientAppointmentForm: null,
        serviceSelect: null,
        titleInput: null,
        dateInput: null,
        timeInput: null,
        platformInput: null,
        proposeAppointmentBtn: null,
        loadingSpinner: null,
        appointmentsList: null,
        conflictModal: null,
        conflictDetailsDiv: null,
        conflictModalCloseBtn: null,
        conflictModalCancelBtn: null,
        conflictModalResolveBtn: null,
    };

    /**
     * API Calls
     */
    async function getServices() {
        try {
            const response = await fetch(`/_functions/getServices`);
            if (!response.ok) {
                throw new Error(`Failed to get services: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            GreenhouseUtils.displayError(`Error fetching services: ${error.message}`);
            throw error;
        }
    }

    async function getAppointments() {
        try {
            const response = await fetch(`/_functions/getAppointments`);
            if (!response.ok) {
                throw new Error(`Failed to get appointments: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            GreenhouseUtils.displayError(`Error fetching appointments: ${error.message}`);
            throw error;
        }
    }

    async function proposeAppointment(appointment) {
        try {
            const response = await fetch(`/_functions/proposeAppointment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(appointment),
            });
            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 409) {
                    const error = new Error(`Conflict: ${response.statusText}`);
                    error.code = response.status;
                    error.data = errorData;
                    throw error;
                } else {
                    throw new Error(`Failed to propose appointment: ${response.statusText}`);
                }
            }
            return response.json();
        } catch (error) {
            if (error.code === 409) {
                throw error;
            }
            GreenhouseUtils.displayError(`Error proposing appointment: ${error.message}`);
            throw error;
        }
    }

    async function createAppointment(appointment) {
        try {
            const response = await fetch(`/_functions/createAppointment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(appointment),
            });
            if (!response.ok) {
                throw new Error(`Failed to create appointment: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            GreenhouseUtils.displayError(`Error creating appointment: ${error.message}`);
            throw error;
        }
    }

    async function updateAppointment(appointmentId, updatedAppointment) {
        try {
            const response = await fetch(`/_functions/updateAppointment/${appointmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedAppointment),
            });
            if (!response.ok) {
                throw new Error(`Failed to update appointment: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            GreenhouseUtils.displayError(`Error updating appointment: ${error.message}`);
            throw error;
        }
    }

    async function deleteAppointment(appointmentId) {
        try {
            const response = await fetch(`/_functions/deleteAppointment/${appointmentId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error(`Failed to delete appointment: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            GreenhouseUtils.displayError(`Error deleting appointment: ${error.message}`);
            throw error;
        }
    }

    /**
     * UI Population Functions
     */
    async function populateServices() {
        try {
            const services = await getServices();
            if (!patientAppState.serviceSelect) {
                console.error('PatientApp: Service select element not found for population.');
                return;
            }
            patientAppState.serviceSelect.innerHTML = '';

            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Please select a service...';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            patientAppState.serviceSelect.appendChild(defaultOption);

            services.forEach(service => {
                const option = document.createElement('option');
                option.value = service._id; // Assuming service objects have an _id
                option.textContent = service.name;
                patientAppState.serviceSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error fetching services:", error);
            GreenhouseUtils.displayError("Failed to load services.");
            if (patientAppState.serviceSelect) {
                patientAppState.serviceSelect.innerHTML = '<option value="">Failed to load services.</option>';
            }
        }
    }

    async function populateAppointments() {
        try {
            const appointments = await getAppointments();
            if (!patientAppState.appointmentsList) {
                console.error('PatientApp: Appointments list element not found for population.');
                return;
            }
            patientAppState.appointmentsList.innerHTML = '';

            if (appointments.length === 0) {
                patientAppState.appointmentsList.innerHTML = '<li>No appointments scheduled.</li>';
                return;
            }

            appointments.forEach(appointment => {
                const li = document.createElement('li');
                li.className = 'greenhouse-patient-app-appointment-item';
                const appointmentJsonString = JSON.stringify(appointment).replace(/'/g, "'");
                li.innerHTML = `
                    <strong>${appointment.title}</strong><br>
                    Date: ${appointment.date} at ${appointment.time}<br>
                    Meeting Platform: ${appointment.platform} (Service: ${appointment.serviceRef || 'N/A'})
                    <div style="margin-top: 5px;">
                        <button data-action='edit-appointment' data-appointment='${appointmentJsonString}' class="greenhouse-patient-app-button">Edit</button>
                        <button data-action='delete-appointment' data-appointment-id='${appointment._id}' class="greenhouse-patient-app-button">Delete</button>
                    </div>
                `;
                patientAppState.appointmentsList.appendChild(li);
            });
        } catch (error) {
            console.error("Error fetching appointments:", error);
            GreenhouseUtils.displayError("Failed to load appointments.");
            if (patientAppState.appointmentsList) {
                patientAppState.appointmentsList.innerHTML = '<li>Failed to load appointments.</li>';
            }
        }
    }

    function populateFormForEdit(appointment) {
        if (!patientAppState.titleInput || !patientAppState.dateInput || !patientAppState.timeInput || !patientAppState.platformInput || !patientAppState.serviceSelect) {
            console.error('PatientApp: Form input elements not found for edit population.');
            return;
        }
        patientAppState.titleInput.value = appointment.title;
        patientAppState.dateInput.value = appointment.date;
        patientAppState.timeInput.value = appointment.time;
        patientAppState.platformInput.value = appointment.platform;
        patientAppState.serviceSelect.value = appointment.serviceRef;

        patientAppState.proposeAppointmentBtn.textContent = 'Update Appointment';
        patientAppState.proposeAppointmentBtn.dataset.action = 'update-appointment';
        patientAppState.proposeAppointmentBtn.dataset.appointmentId = appointment._id;
    }

    function resetForm() {
        if (patientAppState.patientAppointmentForm) {
            patientAppState.patientAppointmentForm.reset();
            patientAppState.proposeAppointmentBtn.textContent = 'Request Appointment';
            patientAppState.proposeAppointmentBtn.dataset.action = 'propose-and-add-appointment';
            delete patientAppState.proposeAppointmentBtn.dataset.appointmentId;

            // Clear any validation messages
            patientAppState.patientAppointmentForm.querySelectorAll('.greenhouse-form-error').forEach(el => el.classList.add('greenhouse-hidden'));
            patientAppState.patientAppointmentForm.querySelectorAll('.greenhouse-form-error-input').forEach(el => el.classList.remove('greenhouse-form-error-input'));
        }
    }

    function showLoadingSpinner(show) {
        if (patientAppState.loadingSpinner) {
            if (show) {
                patientAppState.loadingSpinner.classList.remove('greenhouse-hidden');
                patientAppState.loadingSpinner.classList.add('greenhouse-flex');
                patientAppState.proposeAppointmentBtn.classList.add('greenhouse-hidden');
            } else {
                patientAppState.loadingSpinner.classList.add('greenhouse-hidden');
                patientAppState.loadingSpinner.classList.remove('greenhouse-flex');
                patientAppState.proposeAppointmentBtn.classList.remove('greenhouse-hidden');
            }
        }
    }

    function showConflictModal(conflictData) {
        if (!patientAppState.conflictModal || !patientAppState.conflictDetailsDiv) {
            console.error('PatientApp: Conflict modal elements not found.');
            return;
        }

        patientAppState.conflictDetailsDiv.innerHTML = '';
        if (conflictData && conflictData.conflicts && conflictData.conflicts.length > 0) {
            const ul = document.createElement('ul');
            conflictData.conflicts.forEach(conflict => {
                const li = document.createElement('li');
                li.textContent = `Conflict: ${conflict.title} on ${conflict.date} at ${conflict.time}`;
                ul.appendChild(li);
            });
            patientAppState.conflictDetailsDiv.appendChild(ul);
        } else {
            patientAppState.conflictDetailsDiv.textContent = 'No specific conflict details available.';
        }

        patientAppState.conflictModal.classList.remove('greenhouse-hidden');
        document.body.classList.add('greenhouse-modal-open');
    }

    function hideConflictModal() {
        if (patientAppState.conflictModal) {
            patientAppState.conflictModal.classList.add('greenhouse-hidden');
            document.body.classList.remove('greenhouse-modal-open');
        }
    }

    /**
     * Event Handlers
     */
    async function handleFormSubmission(event) {
        event.preventDefault();

        if (!GreenhouseUtils.validateForm(patientAppState.patientAppointmentForm, 'patient-app-error-')) {
            GreenhouseUtils.displayError('Please correct the errors in the form.');
            return;
        }

        showLoadingSpinner(true);

        const isUpdate = patientAppState.proposeAppointmentBtn.dataset.action === 'update-appointment';
        const appointmentId = patientAppState.proposeAppointmentBtn.dataset.appointmentId;

        const appointmentData = {
            title: patientAppState.titleInput.value,
            date: patientAppState.dateInput.value,
            time: patientAppState.timeInput.value,
            platform: patientAppState.platformInput.value,
            serviceRef: patientAppState.serviceSelect.value,
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
                GreenhouseUtils.displaySuccess('Appointment updated successfully!');
            } else {
                await createAppointment(fullAppointment);
                GreenhouseUtils.displaySuccess('Appointment requested successfully!');
            }
            resetForm();
            populateAppointments();
        } catch (error) {
            if (error.code === 409) {
                showConflictModal(error.data);
            } else {
                console.error("Error during appointment operation:", error);
                GreenhouseUtils.displayError(`Failed to ${isUpdate ? 'update' : 'request'} appointment: ${error.message}`);
            }
        } finally {
            showLoadingSpinner(false);
        }
    }

    function handleAction(event) {
        const target = event.target;
        const action = target.dataset.action;

        if (action) {
            switch (action) {
                case 'edit-appointment':
                    const appointment = JSON.parse(target.dataset.appointment);
                    populateFormForEdit(appointment);
                    break;
                case 'delete-appointment':
                    if (confirm('Are you sure you want to delete this appointment?')) {
                        const appointmentId = target.dataset.appointmentId;
                        (async () => {
                            try {
                                await deleteAppointment(appointmentId);
                                GreenhouseUtils.displaySuccess('Appointment deleted successfully!');
                                populateAppointments();
                            } catch (error) {
                                console.error("Error deleting appointment:", error);
                                GreenhouseUtils.displayError('Failed to delete appointment.');
                            }
                        })();
                    }
                    break;
                case 'conflict-modal-close':
                case 'conflict-modal-cancel':
                    hideConflictModal();
                    break;
                case 'conflict-modal-resolve':
                    hideConflictModal();
                    // Optionally, navigate user to a different part of the form or calendar
                    GreenhouseUtils.displayInfo('Please choose a different time for your appointment.');
                    break;
            }
        }
    }

    /**
     * @function init
     * @description Initializes the Patient application.
     * @param {HTMLElement} leftAppContainer - The main DOM element for the left panel (form).
     * @param {HTMLElement} rightAppContainer - The main DOM element for the right panel (instructions/appointments list).
     */
    async function init(leftAppContainer, rightAppContainer) {
        // Guard against null containers, which can happen during Wix initialization
        if (!leftAppContainer) {
            console.error("GreenhousePatientApp: init() called with a null leftAppContainer. Aborting initialization.");
            return;
        }

        patientAppState.leftAppContainer = leftAppContainer;
        patientAppState.rightAppContainer = rightAppContainer;

        // Get references to UI elements created by schedulerUI.js
        patientAppState.patientFormContainer = leftAppContainer.querySelector('[data-identifier="patient-form-container"]');
        patientAppState.patientAppointmentForm = leftAppContainer.querySelector('[data-identifier="patient-appointment-form"]');
        patientAppState.serviceSelect = leftAppContainer.querySelector('[data-identifier="patient-app-service"]');
        patientAppState.titleInput = leftAppContainer.querySelector('[data-identifier="patient-app-title"]');
        patientAppState.dateInput = leftAppContainer.querySelector('[data-identifier="patient-app-date"]');
        patientAppState.timeInput = leftAppContainer.querySelector('[data-identifier="patient-app-time"]');
        patientAppState.platformInput = leftAppContainer.querySelector('[data-identifier="patient-app-platform"]');
        patientAppState.proposeAppointmentBtn = leftAppContainer.querySelector('[data-identifier="propose-appointment-btn"]');
        if (patientAppState.proposeAppointmentBtn) {
            patientAppState.proposeAppointmentBtn.disabled = true;
        }
        patientAppState.loadingSpinner = leftAppContainer.querySelector('[data-identifier="loading-spinner"]');
        
        // Assuming an appointments list will be created in the right panel by schedulerUI.js
        // If right panel doesn't exist, we'll append the list to the left panel as a fallback.
        let appointmentsListElement = rightAppContainer ? rightAppContainer.querySelector('[data-identifier="appointment-list"]') : null;
        if (!appointmentsListElement) {
            appointmentsListElement = document.createElement('ul');
            appointmentsListElement.id = 'greenhouse-patient-app-appointments-list';
            appointmentsListElement.className = 'greenhouse-patient-app-appointments-list';
            appointmentsListElement.setAttribute('data-identifier', 'appointment-list');

            // Append to right container if it exists, otherwise append to the left as a fallback
            const targetContainer = rightAppContainer || leftAppContainer;
            targetContainer.appendChild(appointmentsListElement);
        }
        patientAppState.appointmentsList = appointmentsListElement;

        // Get references to conflict modal elements (created by scheduler.js and appended to body)
        patientAppState.conflictModal = document.querySelector('[data-identifier="conflict-modal"]');
        patientAppState.conflictDetailsDiv = document.querySelector('[data-identifier="conflict-details"]');
        patientAppState.conflictModalCloseBtn = document.querySelector('[data-identifier="conflict-modal-close-btn"]');
        patientAppState.conflictModalCancelBtn = document.querySelector('[data-identifier="conflict-modal-cancel-btn"]');
        patientAppState.conflictModalResolveBtn = document.querySelector('[data-identifier="conflict-modal-resolve-btn"]');


        // Add event listeners
        if (patientAppState.patientAppointmentForm) {
            patientAppState.patientAppointmentForm.addEventListener('submit', handleFormSubmission);
            // Real-time validation on blur
            const inputs = patientAppState.patientAppointmentForm.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    const errorEl = patientAppState.patientAppointmentForm.querySelector(`[data-identifier="patient-app-error-${input.name}"]`);
                    GreenhouseUtils.validateField(input, errorEl);
                });
                input.addEventListener('input', () => {
                    const errorEl = patientAppState.patientAppointmentForm.querySelector(`[data-identifier="patient-app-error-${input.name}"]`);
                    if (errorEl) {
                        errorEl.classList.add('greenhouse-hidden');
                        input.classList.remove('greenhouse-form-error-input');
                    }
                });
            });
        }

        // Delegate click events for edit/delete buttons on the appointments list
        if (patientAppState.appointmentsList) {
            patientAppState.appointmentsList.addEventListener('click', handleAction);
        }

        // Add event listeners for the conflict modal
        if (patientAppState.conflictModalCloseBtn) patientAppState.conflictModalCloseBtn.addEventListener('click', handleAction);
        if (patientAppState.conflictModalCancelBtn) patientAppState.conflictModalCancelBtn.addEventListener('click', handleAction);
        if (patientAppState.conflictModalResolveBtn) patientAppState.conflictModalResolveBtn.addEventListener('click', handleAction);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && patientAppState.conflictModal && !patientAppState.conflictModal.classList.contains('greenhouse-hidden')) {
                hideConflictModal();
            }
        });
        if (patientAppState.conflictModal) {
            patientAppState.conflictModal.addEventListener('click', (e) => {
                if (e.target === patientAppState.conflictModal) {
                    hideConflictModal();
                }
            });
        }


        resetForm(); // Ensure form is in a clean state

        const fetchButton = patientAppState.leftAppContainer.querySelector('[data-identifier="patient-fetch-data-btn"]');
        if (fetchButton) {
            fetchButton.addEventListener('click', async () => {
                fetchButton.disabled = true;
                fetchButton.textContent = 'Loading Data...';
                try {
                    await populateServices();
                    await populateAppointments();
                    fetchButton.textContent = 'Data Loaded Successfully';
                    // Optionally hide the button after a short delay
                    setTimeout(() => {
                        fetchButton.style.display = 'none';
                    }, 2000);
                } catch (error) {
                    fetchButton.textContent = 'Failed to Load Data. Please Try Again.';
                    fetchButton.disabled = false;
                    console.error("Failed to fetch and populate data on button click:", error);
                    GreenhouseUtils.displayError("Could not load appointment data. Please check the console and try again.");
                }
            }, { once: true }); // Use { once: true } to automatically remove the listener after it's invoked
        }
    }

    function fetchAndPopulateData() {
        const fetchButton = patientAppState.leftAppContainer.querySelector('[data-identifier="patient-fetch-data-btn"]');
        if (fetchButton) {
            fetchButton.click();
        }
    }

    return {
        init: init,
        fetchAndPopulateData: fetchAndPopulateData, // Expose for external triggering if needed
        populateAppointments: populateAppointments,
        populateServices: populateServices,
        showConflictModal: showConflictModal,
    };
})();
