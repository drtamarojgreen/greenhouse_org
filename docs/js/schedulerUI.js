const GreenhouseSchedulerUI = (function() {
    'use strict';

    const components = {};

    function buildSchedulerUI() {
        const fragment = document.createDocumentFragment();

        // Main container
        const mainContainer = document.createElement('section');
        mainContainer.id = 'greenhouse-app-container';
        mainContainer.className = 'greenhouse-app-container';
        mainContainer.style.gridArea = '2 / 1 / 1 / 2'; // Added grid-area
        components.mainContainer = mainContainer;

        // Patient Form
        const patientForm = buildPatientForm();
        components.patientForm = patientForm;
        mainContainer.appendChild(patientForm);

        // Dashboard
        const dashboard = buildDashboardUI(); // Updated to use the new dashboard UI function
        components.dashboard = dashboard;
        mainContainer.appendChild(dashboard);

        // Admin Form
        const adminForm = buildAdminForm();
        components.adminForm = adminForm;
        mainContainer.appendChild(adminForm);

        fragment.appendChild(mainContainer);
        return fragment;
    }

    function buildPatientForm() {
        const formContainer = document.createElement('div');
        formContainer.id = 'greenhouse-patient-form';
        formContainer.style.display = 'none'; // Initially hidden

        const h1 = document.createElement('h1');
        h1.textContent = 'Request an Appointment';
        formContainer.appendChild(h1);

        const form = document.createElement('form');
        form.id = 'greenhouse-patient-appointment-form';
        form.className = 'greenhouse-form';
        form.noValidate = true;

        const fields = [
            { label: 'Title', id: 'title', type: 'text', placeholder: 'e.g., Initial Consultation', required: true },
            { label: 'Date', id: 'date', type: 'date', required: true },
            { label: 'Time', id: 'time', type: 'time', required: true },
            { label: 'Meeting Platform', id: 'platform', type: 'text', placeholder: 'e.g., Google Meet, Zoom', required: true },
            { label: 'Service', id: 'service', type: 'select', required: true, options: [
                { value: '', text: 'Please select a service...', disabled: true },
                { value: 'consultation', text: 'Initial Consultation' },
                { value: 'therapy', text: 'Therapy Session' },
                { value: 'followup', text: 'Follow-up Appointment' },
                { value: 'other', text: 'Other' }
            ] }
        ];

        fields.forEach(fieldInfo => {
            const fieldContainer = document.createElement('div');
            fieldContainer.className = 'greenhouse-form-field';

            const label = document.createElement('label');
            label.htmlFor = `greenhouse-patient-app-${fieldInfo.id}`;
            label.textContent = fieldInfo.label + (fieldInfo.required ? ' *' : '');
            label.className = 'greenhouse-form-label';
            fieldContainer.appendChild(label);

            let input;
            if (fieldInfo.type === 'select') {
                input = document.createElement('select');
                fieldInfo.options.forEach(optionInfo => {
                    const option = document.createElement('option');
                    option.value = optionInfo.value;
                    option.textContent = optionInfo.text;
                    if (optionInfo.disabled) {
                        option.disabled = true;
                    }
                    input.appendChild(option);
                });
            } else {
                input = document.createElement('input');
                input.type = fieldInfo.type;
                if (fieldInfo.placeholder) {
                    input.placeholder = fieldInfo.placeholder;
                }
            }
            input.id = `greenhouse-patient-app-${fieldInfo.id}`;
            input.name = fieldInfo.id;
            input.className = 'greenhouse-form-input';
            if (fieldInfo.required) {
                input.required = true;
            }
            fieldContainer.appendChild(input);

            const errorDiv = document.createElement('div');
            errorDiv.className = 'greenhouse-form-error';
            errorDiv.id = `error-${fieldInfo.id}`;
            errorDiv.setAttribute('role', 'alert');
            errorDiv.style.display = 'none';
            fieldContainer.appendChild(errorDiv);

            form.appendChild(fieldContainer);
        });

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'greenhouse-form-button-container';

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.id = 'greenhouse-propose-appointment-btn';
        submitButton.className = 'greenhouse-form-submit-btn';
        submitButton.textContent = 'Request Appointment';
        buttonContainer.appendChild(submitButton);

        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'greenhouse-loading-spinner';
        loadingSpinner.style.display = 'none';
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        loadingSpinner.appendChild(spinner);
        const spinnerText = document.createElement('span');
        spinnerText.textContent = 'Processing...';
        loadingSpinner.appendChild(spinnerText);
        buttonContainer.appendChild(loadingSpinner);

        form.appendChild(buttonContainer);
        formContainer.appendChild(form);

        return formContainer;
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

    function buildAdminForm() {
        const formContainer = document.createElement('div');
        formContainer.id = 'greenhouse-admin-form';
        formContainer.style.display = 'none'; // Initially hidden

        const h1 = document.createElement('h1');
        h1.textContent = 'Admin Settings';
        formContainer.appendChild(h1);

        const form = document.createElement('form');
        form.id = 'greenhouse-admin-settings-form';
        form.className = 'greenhouse-form';
        formContainer.appendChild(form);

        return formContainer;
    }

    /**
     * @function addFormValidation
     * @description Adds client-side validation to the form
     * @param {HTMLFormElement} form - The form to add validation to
     */
    function addFormValidation(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const isValid = validateForm(form);
            if (isValid) {
                handleFormSubmission(form);
            }
        });

        // Real-time validation on blur
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                validateField(input);
            });

            input.addEventListener('input', () => {
                // Clear error on input
                const errorEl = document.getElementById(`error-${input.name}`);
                if (errorEl) {
                    errorEl.style.display = 'none';
                    input.classList.remove('greenhouse-form-error-input');
                }
            });
        });
    }

    /**
     * @function validateForm
     * @description Validates the entire form
     * @param {HTMLFormElement} form - The form to validate
     * @returns {boolean} True if form is valid
     */
    function validateForm(form) {
        const inputs = form.querySelectorAll('input[required], select[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * @function validateField
     * @description Validates a single form field
     * @param {HTMLInputElement|HTMLSelectElement} field - The field to validate
     * @returns {boolean} True if field is valid
     */
    function validateField(field) {
        const errorEl = document.getElementById(`error-${field.name}`);
        let isValid = true;
        let errorMessage = '';

        // Check if required field is empty
        if (field.required && !field.value.trim()) {
            isValid = false;
            errorMessage = `${field.name.charAt(0).toUpperCase() + field.name.slice(1)} is required.`;
        }

        // Additional validation based on field type
        if (isValid && field.value.trim()) {
            switch (field.type) {
                case 'date':
                    const selectedDate = new Date(field.value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (selectedDate < today) {
                        isValid = false;
                        errorMessage = 'Please select a future date.';
                    }
                    break;
                case 'time':
                    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
                    if (!timeRegex.test(field.value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid time.';
                    }
                    break;
            }
        }

        // Show/hide error message
        if (errorEl) {
            if (isValid) {
                errorEl.style.display = 'none';
                field.classList.remove('greenhouse-form-error-input');
            } else {
                errorEl.textContent = errorMessage;
                errorEl.style.display = 'block';
                field.classList.add('greenhouse-form-error-input');
            }
        }

        return isValid;
    }

    /**
     * @function handleFormSubmission
     * @description Handles form submission with loading states
     * @param {HTMLFormElement} form - The form being submitted
     */
    async function handleFormSubmission(form) {
        const submitBtn = form.querySelector('#greenhouse-propose-appointment-btn');
        const loadingSpinner = form.querySelector('.greenhouse-loading-spinner');

        try {
            // Show loading state
            submitBtn.style.display = 'none';
            loadingSpinner.style.display = 'flex';

            // Collect form data
            const formData = new FormData(form);
            const appointmentData = Object.fromEntries(formData.entries());

            console.log('Scheduler: Form submitted with data:', appointmentData);

            // Simulate API call (replace with actual implementation)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Show success message
            // This will need to be passed from the main scheduler app
            // GreenhouseAppsScheduler.showSuccessMessage('Appointment request submitted successfully!');
            form.reset();

        } catch (error) {
            console.error('Scheduler: Form submission error:', error);
            // This will need to be passed from the main scheduler app
            // GreenhouseAppsScheduler.showErrorMessage('Failed to submit appointment request. Please try again.');
        } finally {
            // Hide loading state
            submitBtn.style.display = 'block';
            loadingSpinner.style.display = 'none';
        }
    }

    /**
     * @function createHiddenElements
     * @description Creates hidden elements used by the application (e.g., conflict modal)
     * @returns {DocumentFragment}
     */
    function createHiddenElements() {
        const fragment = document.createDocumentFragment();

        const appointmentListDiv = document.createElement('div');
        appointmentListDiv.id = 'greenhouse-appointment-list';
        appointmentListDiv.className = 'greenhouse-appointment-list';
        appointmentListDiv.style.display = 'none';
        fragment.appendChild(appointmentListDiv);

        const conflictModalDiv = document.createElement('div');
        conflictModalDiv.id = 'greenhouse-conflict-modal';
        conflictModalDiv.className = 'greenhouse-modal';
        conflictModalDiv.style.display = 'none';
        conflictModalDiv.setAttribute('role', 'dialog');
        conflictModalDiv.setAttribute('aria-labelledby', 'conflict-modal-title');

        const modalContent = document.createElement('div');
        modalContent.className = 'greenhouse-modal-content';
        modalContent.innerHTML = `
            <div class="greenhouse-modal-header">
                <h2 id="conflict-modal-title">Scheduling Conflict Detected</h2>
                <button class="greenhouse-modal-close" type="button" aria-label="Close modal">&times;</button>
            </div>
            <div class="greenhouse-modal-body">
                <p>The proposed appointment overlaps with the following existing appointment(s):</p>
                <div id="greenhouse-conflict-details"></div>
            </div>
            <div class="greenhouse-modal-footer">
                <button type="button" class="greenhouse-btn greenhouse-btn-secondary" id="greenhouse-conflict-cancel">Cancel</button>
                <button type="button" class="greenhouse-btn greenhouse-btn-primary" id="greenhouse-conflict-resolve">Choose Different Time</button>
            </div>
        `;

        conflictModalDiv.appendChild(modalContent);
        fragment.appendChild(conflictModalDiv);

        // Add modal event listeners
        addModalEventListeners(conflictModalDiv);

        return fragment;
    }

    /**
     * @function addModalEventListeners
     * @description Adds event listeners to modal elements
     * @param {HTMLElement} modal - The modal element
     */
    function addModalEventListeners(modal) {
        const closeBtn = modal.querySelector('.greenhouse-modal-close');
        const cancelBtn = modal.querySelector('#greenhouse-conflict-cancel');
        
        const closeModal = () => {
            modal.style.display = 'none';
            document.body.classList.remove('greenhouse-modal-open');
        };

        closeBtn?.addEventListener('click', closeModal);
        cancelBtn?.addEventListener('click', closeModal);

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display !== 'none') {
                closeModal();
            }
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    /**
     * @function createInstructionsPanel
     * @description Creates the instructional panel content
     * @returns {DocumentFragment}
     */
    function createInstructionsPanel() {
        const fragment = document.createDocumentFragment();
        
        const h2 = document.createElement('h2');
        h2.textContent = 'How to Request an Appointment';
        h2.className = 'greenhouse-instructions-title';
        fragment.appendChild(h2);

        const instructions = [
            {
                title: 'Fill Out the Form',
                text: 'Complete all required fields including your preferred date, time, and type of service.'
            },
            {
                title: 'Review Your Request',
                text: 'Double-check your information before submitting to ensure accuracy.'
            },
            {
                title: 'Wait for Confirmation',
                text: 'Our team will review your request and send you a confirmation within 24 hours.'
            },
            {
                title: 'Need Help?',
                text: 'If you have questions or need to make changes, please contact our office directly.'
            }
        ];

        const instructionsList = document.createElement('div');
        instructionsList.className = 'greenhouse-instructions-list';

        instructions.forEach((instruction, index) => {
            const instructionItem = document.createElement('div');
            instructionItem.className = 'greenhouse-instruction-item';

            const stepNumber = document.createElement('div');
            stepNumber.className = 'greenhouse-step-number';
            stepNumber.textContent = index + 1;

            const instructionContent = document.createElement('div');
            instructionContent.className = 'greenhouse-instruction-content';

            const instructionTitle = document.createElement('h3');
            instructionTitle.textContent = instruction.title;
            instructionTitle.className = 'greenhouse-instruction-title';

            const instructionText = document.createElement('p');
            instructionText.textContent = instruction.text;
            instructionText.className = 'greenhouse-instruction-text';

            instructionContent.appendChild(instructionTitle);
            instructionContent.appendChild(instructionText);

            instructionItem.appendChild(stepNumber);
            instructionItem.appendChild(instructionContent);
            instructionsList.appendChild(instructionItem);
        });

        fragment.appendChild(instructionsList);

        return fragment;
    }

    /**
     * Builds the HTML form for editing an appointment.
     * @param {object} currentAppointment - The appointment data.
     * @param {Array<object>} serviceTypes - The available service types.
     * @returns {HTMLFormElement} The generated form element.
     */
    function buildAdminAppointmentForm(currentAppointment, serviceTypes) {
        const form = document.createElement('form');
        form.id = 'greenhouse-admin-app-individual-appointment-form'; // Renamed ID
        form.dataset.appointmentId = currentAppointment._id; // Add appointment ID to form

        const fields = [
            { label: 'Title', id: 'adminTitle', type: 'text', value: currentAppointment.title },
            { label: 'Start Time', id: 'adminStart', type: 'datetime-local', value: currentAppointment.start ? currentAppointment.start.substring(0, 16) : '' },
            { label: 'End Time', id: 'adminEnd', type: 'datetime-local', value: currentAppointment.end ? currentAppointment.end.substring(0, 16) : '' },
            { label: 'Platform', id: 'adminPlatform', type: 'text', value: currentAppointment.platform },
            { label: 'Service', id: 'adminService', type: 'select', value: currentAppointment.serviceRef, options: serviceTypes.map(st => ({ value: st._id, text: st.name })) },
            { label: 'Confirmed', id: 'adminConfirmed', type: 'checkbox', value: currentAppointment.confirmed },
            { label: 'Conflicts', id: 'adminConflicts', type: 'textarea', value: JSON.stringify(currentAppointment.conflicts, null, 2) },
            { label: 'First Name', id: 'adminFirstName', type: 'text', value: currentAppointment.firstName },
            { label: 'Last Name', id: 'adminLastName', type: 'text', value: currentAppointment.lastName },
            { label: 'Contact Info', id: 'adminContactInfo', type: 'text', value: currentAppointment.contactInfo },
            { label: 'Anonymous ID', id: 'adminAnonymousId', type: 'text', value: currentAppointment.anonymousId, readOnly: true }
        ];

        fields.forEach(field => {
            const label = document.createElement('label');
            label.htmlFor = `greenhouse-admin-app-${field.id}`; // Renamed ID
            label.textContent = field.label + ':';
            form.appendChild(label);

            let input;
            if (field.type === 'textarea') {
                input = document.createElement('textarea');
                input.rows = 3;
            } else if (field.type === 'select') {
                input = document.createElement('select');
                field.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.text;
                    if (opt.value === field.value) {
                        option.selected = true;
                    }
                    input.appendChild(option);
                });
            } else {
                input = document.createElement('input');
                input.type = field.type;
            }

            input.id = `greenhouse-admin-app-${field.id}`; // Renamed ID
            input.name = field.id;
            input.readOnly = field.readOnly || false;

            if (field.type === 'checkbox') {
                input.checked = field.value;
            } else {
                input.value = field.value;
            }

            form.appendChild(input);
            form.appendChild(document.createElement('br'));
            form.appendChild(document.createElement('br'));
        });

        const saveButton = document.createElement('button');
        saveButton.type = 'submit';
        saveButton.textContent = 'Save Changes';
        saveButton.dataset.action = 'save-changes'; // Added data-action
        saveButton.className = 'greenhouse-admin-app-button'; // Added class
        form.appendChild(saveButton);

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete Appointment';
        deleteButton.style.marginLeft = '10px';
        deleteButton.style.backgroundColor = 'red';
        deleteButton.style.color = 'white';
        deleteButton.dataset.action = 'delete-appointment'; // Added data-action
        deleteButton.dataset.serviceRef = currentAppointment.serviceRef; // Added serviceRef
        deleteButton.className = 'greenhouse-admin-app-button'; // Added class
        form.appendChild(deleteButton);

        return form;
    }

    function setupModal() {
        const modal = document.getElementById('greenhouse-conflict-modal');
        const closeButton = modal.querySelector('.greenhouse-modal-close');
        const cancelButton = modal.querySelector('#greenhouse-conflict-cancel');
        const resolveButton = modal.querySelector('#greenhouse-conflict-resolve');

        closeButton.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.classList.remove('greenhouse-modal-open');
        });

        cancelButton.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.classList.remove('greenhouse-modal-open');
        });

        resolveButton.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.classList.remove('greenhouse-modal-open');
            // Optionally, navigate user to a different part of the form or calendar
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display !== 'none') {
                modal.style.display = 'none';
                document.body.classList.remove('greenhouse-modal-open');
            }
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.classList.remove('greenhouse-modal-open');
            }
        });
    }

    function showConflictModal(conflictData) {
        const modal = document.getElementById('greenhouse-conflict-modal');
        const conflictDetailsDiv = document.getElementById('greenhouse-conflict-details');

        if (conflictDetailsDiv) {
            conflictDetailsDiv.innerHTML = ''; // Clear previous content
            if (conflictData && conflictData.conflicts && conflictData.conflicts.length > 0) {
                const ul = document.createElement('ul');
                conflictData.conflicts.forEach(conflict => {
                    const li = document.createElement('li');
                    li.textContent = `Conflict: ${conflict.title} on ${conflict.date} at ${conflict.time}`;
                    ul.appendChild(li);
                });
                conflictDetailsDiv.appendChild(ul);
            } else {
                conflictDetailsDiv.textContent = 'No specific conflict details available.';
            }
        }

        if (modal) {
            modal.style.display = 'block';
            document.body.classList.add('greenhouse-modal-open');
        }
    }

    function clearFormInputs() {
        document.getElementById('greenhouse-patient-app-title-input').value = '';
        document.getElementById('greenhouse-patient-app-date-input').value = '';
        document.getElementById('greenhouse-patient-app-time-input').value = '';
        document.getElementById('greenhouse-patient-app-platform-input').value = '';
        document.getElementById('greenhouse-patient-app-service-select').value = ''; // Reset select to default
    }

    function resetForm() {
        const form = document.getElementById('greenhouse-patient-appointment-form');
        if (form) {
            form.reset();
            // Clear any validation messages
            form.querySelectorAll('.greenhouse-form-error').forEach(el => el.style.display = 'none');
            form.querySelectorAll('.greenhouse-form-error-input').forEach(el => el.classList.remove('greenhouse-form-error-input'));
        }
    }

    function editAppointment(appointment) {
        document.getElementById('greenhouse-patient-app-title-input').value = appointment.title;
        document.getElementById('greenhouse-patient-app-date-input').value = appointment.date;
        document.getElementById('greenhouse-patient-app-time-input').value = appointment.time;
        document.getElementById('greenhouse-patient-app-platform-input').value = appointment.platform;
        document.getElementById('greenhouse-patient-app-service-select').value = appointment.serviceRef;

        // Change button to "Update Appointment"
        const submitButton = document.getElementById('greenhouse-propose-appointment-btn');
        submitButton.textContent = 'Update Appointment';
        submitButton.dataset.action = 'update-appointment';
        submitButton.dataset.appointmentId = appointment._id; // Store ID for update
    }

    function showComponent(componentName) {
        for (const key in components) {
            if (key === componentName) {
                components[key].style.display = 'block';
            } else if (key !== 'mainContainer') {
                components[key].style.display = 'none';
            }
        }
    }

    return {
        buildSchedulerUI,
        showComponent,
        setupModal,
        showConflictModal,
        clearFormInputs,
        resetForm,
        editAppointment,
        buildPatientFormUI,
        createFormFields,
        addFormValidation,
        validateForm,
        validateField,
        handleFormSubmission,
        createHiddenElements,
        addModalEventListeners,
        createInstructionsPanel,
        buildAdminAppointmentForm
    };
})();

    