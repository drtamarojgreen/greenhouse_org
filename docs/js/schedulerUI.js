window.GreenhouseSchedulerUI = (function() {
    'use strict';

    /**
     * Builds the main scheduler UI container.
     * @returns {HTMLElement} The main container element.
     */
    function buildSchedulerUI() {
        const mainContainer = document.createElement('section');
        mainContainer.id = 'greenhouse-app-container';
        mainContainer.className = 'greenhouse-app-container greenhouse-scheduler-main-container';
        return mainContainer;
    }

    /**
     * Builds the UI for the Patient Appointment Request Form.
     * @param {HTMLElement} targetElement - The DOM element to append the UI to.
     * @returns {HTMLElement} The patient form container.
     */
    function buildPatientFormUI(targetElement) {
        if (!targetElement) {
            console.error('SchedulerUI: Target element for patient form is null.');
            return null;
        }

        const formContainer = document.createElement('div');
        formContainer.id = 'greenhouse-patient-form';
        formContainer.setAttribute('data-identifier', 'patient-form-container');
        // formContainer.classList.add('greenhouse-hidden'); // Initial visibility handled by app

        const fetchDataButton = document.createElement('button');
        fetchDataButton.id = 'greenhouse-patient-fetch-data-btn';
        fetchDataButton.setAttribute('data-identifier', 'patient-fetch-data-btn');
        fetchDataButton.textContent = 'Load My Appointments & Services';
        fetchDataButton.className = 'greenhouse-btn greenhouse-btn-primary';
        formContainer.appendChild(fetchDataButton);

        const h1 = document.createElement('h1');
        h1.textContent = 'Request an Appointment';
        formContainer.appendChild(h1);

        const form = document.createElement('form');
        form.id = 'greenhouse-patient-appointment-form';
        form.className = 'greenhouse-form';
        form.noValidate = true;
        form.setAttribute('data-identifier', 'patient-appointment-form');

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
            input.setAttribute('data-identifier', `patient-app-${fieldInfo.id}`);
            fieldContainer.appendChild(input);

            const errorDiv = document.createElement('div');
            errorDiv.className = 'greenhouse-form-error greenhouse-hidden'; // Initially hidden via class
            errorDiv.id = `error-${fieldInfo.id}`;
            errorDiv.setAttribute('role', 'alert');
            errorDiv.setAttribute('data-identifier', `patient-app-error-${fieldInfo.id}`);
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
        submitButton.setAttribute('data-identifier', 'propose-appointment-btn');
        buttonContainer.appendChild(submitButton);

        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'greenhouse-loading-spinner greenhouse-hidden'; // Initially hidden
        loadingSpinner.setAttribute('data-identifier', 'loading-spinner');
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        loadingSpinner.appendChild(spinner);
        const spinnerText = document.createElement('span');
        spinnerText.textContent = 'Processing...';
        loadingSpinner.appendChild(spinnerText);
        buttonContainer.appendChild(loadingSpinner);

        form.appendChild(buttonContainer);
        formContainer.appendChild(form);
        targetElement.appendChild(formContainer); // Attach to targetElement

        return formContainer;
    }

    /**
     * Builds the UI for the Administrator Dashboard (left panel: schedule and conflicts).
     * @param {HTMLElement} targetElement - The DOM element to append the UI to.
     * @returns {Object} An object containing references to the created inner UI elements.
     */
    function buildDashboardLeftPanelUI(targetElement, view) {
        if (!targetElement) {
            console.error('SchedulerUI: Target element for left dashboard panel is null.');
            return {};
        }

        const h1 = document.createElement('h1');
        h1.textContent = 'Administrator Dashboard: Weekly Schedule & Conflict Resolution';
        targetElement.appendChild(h1);

        const description = document.createElement('p');
        description.textContent = 'Review and resolve scheduling conflicts for the week. Select a date range to view appointments.';
        targetElement.appendChild(description);

        // New Appointment Box (draggable)
        const newAppointmentBox = document.createElement('div');
        newAppointmentBox.id = 'greenhouse-dashboard-app-new-appointment-box';
        newAppointmentBox.textContent = 'New Appointment';
        newAppointmentBox.draggable = true;
        newAppointmentBox.setAttribute('data-identifier', 'new-appointment-box');
        targetElement.appendChild(newAppointmentBox);

        if (view === 'superadmin') {
            // Button to fetch and populate data
            const fetchButton = document.createElement('button');
            fetchButton.id = 'greenhouse-fetch-schedule-data-btn';
            fetchButton.className = 'greenhouse-btn greenhouse-btn-primary';
            fetchButton.textContent = 'Fetch and Populate Schedule Data';
            fetchButton.setAttribute('data-identifier', 'fetch-schedule-data-btn');
            targetElement.appendChild(fetchButton);
        }

        // Schedule Display Area
        const scheduleContainer = document.createElement('div');
        scheduleContainer.id = 'greenhouse-dashboard-app-schedule-container';
        scheduleContainer.setAttribute('data-identifier', 'schedule-container');

        // Create the basic weekly schedule table structure
        const scheduleTable = document.createElement('table');
        scheduleTable.className = 'greenhouse-schedule-table'; // Add a class for styling

        const tableHead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Time', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach(day => {
            const th = document.createElement('th');
            th.textContent = day;
            headerRow.appendChild(th);
        });
        tableHead.appendChild(headerRow);
        scheduleTable.appendChild(tableHead);

        const tableBody = document.createElement('tbody');
        tableBody.setAttribute('data-identifier', 'schedule-tbody'); // Important for populateWeekly to find it

        // Create rows for hours (e.g., 8 AM to 5 PM)
        for (let hour = 8; hour <= 17; hour++) { // Example: 8 AM to 5 PM
            const row = document.createElement('tr');
            const timeCell = document.createElement('td');
            timeCell.textContent = `${hour % 12 === 0 ? 12 : hour % 12}${hour < 12 ? ' AM' : ' PM'}`;
            row.appendChild(timeCell);

            for (let day = 0; day < 7; day++) { // 0 for Sunday, 6 for Saturday
                const dataCell = document.createElement('td');
                dataCell.className = 'schedule-cell';
                dataCell.dataset.day = day;
                dataCell.dataset.hour = hour;
                row.appendChild(dataCell);
            }
            tableBody.appendChild(row);
        }
        scheduleTable.appendChild(tableBody);
        scheduleContainer.appendChild(scheduleTable);
        targetElement.appendChild(scheduleContainer);

        // Conflict Resolution Area
        const conflictResolutionDiv = document.createElement('div');
        conflictResolutionDiv.id = 'greenhouse-dashboard-app-conflict-resolution-area';
        conflictResolutionDiv.setAttribute('data-identifier', 'conflict-resolution-area');

        const h2Conflicts = document.createElement('h2');
        h2Conflicts.textContent = 'Conflicts to Resolve';
        conflictResolutionDiv.appendChild(h2Conflicts);

        const ulConflictList = document.createElement('ul');
        ulConflictList.id = 'greenhouse-dashboard-app-conflict-list';
        ulConflictList.setAttribute('data-identifier', 'conflict-list');
        const liNoConflicts = document.createElement('li');
        liNoConflicts.textContent = 'No conflicts found.';
        ulConflictList.appendChild(liNoConflicts);
        conflictResolutionDiv.appendChild(ulConflictList);

        targetElement.appendChild(conflictResolutionDiv);

        return { scheduleContainer, conflictList: ulConflictList, conflictResolutionArea: conflictResolutionDiv };
    }

    /**
     * Builds the UI for the Administrator Dashboard (right panel: calendar).
     * @param {HTMLElement} targetElement - The DOM element to append the UI to.
     * @returns {Object} An object containing references to the created inner UI elements.
     */
    function buildDashboardRightPanelUI(targetElement) {
        if (!targetElement) {
            console.error('SchedulerUI: Target element for right dashboard panel is null.');
            return {};
        }

        // Calendar Container
        const calendarContainer = document.createElement('div');
        calendarContainer.id = 'greenhouse-dashboard-app-calendar-container';
        calendarContainer.setAttribute('data-identifier', 'calendar-container');
        calendarContainer.className = 'greenhouse-calendar-container'; // Added for consistent styling

        const header = document.createElement('div');
        header.className = 'calendar-header';

        const prevButton = document.createElement('button');
        prevButton.dataset.action = 'prev-month';
        prevButton.textContent = 'Prev';
        header.appendChild(prevButton);

        const title = document.createElement('h2');
        title.setAttribute('data-identifier', 'calendar-title');
        title.textContent = 'Month Year'; // Placeholder, will be populated by the app
        header.appendChild(title);

        const nextButton = document.createElement('button');
        nextButton.dataset.action = 'next-month';
        nextButton.textContent = 'Next';
        header.appendChild(nextButton);

        calendarContainer.appendChild(header);

        const table = document.createElement('table');
        table.className = 'calendar-table';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            const th = document.createElement('th');
            th.textContent = day;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        tbody.setAttribute('data-identifier', 'calendar-tbody'); // This is the crucial part for the app
        table.appendChild(tbody);

        calendarContainer.appendChild(table);
        targetElement.appendChild(calendarContainer);

        return { calendarContainer };
    }

    /**
     * Builds the UI for the Administrator Settings Form.
     * @param {HTMLElement} targetElement - The DOM element to append the UI to.
     * @returns {HTMLElement} The admin form container.
     */
    function buildAdminFormUI(targetElement) {
        if (!targetElement) {
            console.error('SchedulerUI: Target element for admin form is null.');
            return null;
        }

        const formContainer = document.createElement('div');
        formContainer.id = 'greenhouse-admin-form';
        formContainer.setAttribute('data-identifier', 'admin-form-container');
        // formContainer.classList.add('greenhouse-hidden'); // Initial visibility handled by app

        const h1 = document.createElement('h1');
        h1.textContent = 'Admin Settings';
        formContainer.appendChild(h1);

        const form = document.createElement('form');
        form.id = 'greenhouse-admin-settings-form';
        form.className = 'greenhouse-form';
        form.setAttribute('data-identifier', 'admin-settings-form');
        formContainer.appendChild(form);
        targetElement.appendChild(formContainer); // Attach to targetElement

        return formContainer;
    }

    /**
     * Creates hidden elements used by the application (e.g., conflict modal).
     * These elements are created but not attached to a specific target,
     * allowing the app-specific logic to manage their attachment and event listeners.
     * @returns {DocumentFragment} A document fragment containing the hidden elements.
     */
    function createHiddenElements() {
        const fragment = document.createDocumentFragment();

        const appointmentListDiv = document.createElement('div');
        appointmentListDiv.id = 'greenhouse-appointment-list';
        appointmentListDiv.className = 'greenhouse-appointment-list greenhouse-hidden';
        appointmentListDiv.setAttribute('data-identifier', 'appointment-list');
        fragment.appendChild(appointmentListDiv);

        const conflictModalDiv = document.createElement('div');
        conflictModalDiv.id = 'greenhouse-conflict-modal';
        conflictModalDiv.className = 'greenhouse-modal greenhouse-hidden';
        conflictModalDiv.setAttribute('role', 'dialog');
        conflictModalDiv.setAttribute('aria-labelledby', 'conflict-modal-title');
        conflictModalDiv.setAttribute('data-identifier', 'conflict-modal');

        const modalContent = document.createElement('div');
        modalContent.className = 'greenhouse-modal-content';

        const modalHeader = document.createElement('div');
        modalHeader.className = 'greenhouse-modal-header';
        const h2ModalTitle = document.createElement('h2');
        h2ModalTitle.id = 'conflict-modal-title';
        h2ModalTitle.textContent = 'Scheduling Conflict Detected';
        h2ModalTitle.setAttribute('data-identifier', 'conflict-modal-title');
        const closeButton = document.createElement('button');
        closeButton.className = 'greenhouse-modal-close';
        closeButton.type = 'button';
        closeButton.setAttribute('aria-label', 'Close modal');
        closeButton.textContent = '×'; // Times symbol
        closeButton.setAttribute('data-identifier', 'conflict-modal-close-btn');
        modalHeader.appendChild(h2ModalTitle);
        modalHeader.appendChild(closeButton);
        modalContent.appendChild(modalHeader);

        const modalBody = document.createElement('div');
        modalBody.className = 'greenhouse-modal-body';
        const pOverlap = document.createElement('p');
        pOverlap.textContent = 'The proposed appointment overlaps with the following existing appointment(s):';
        const conflictDetailsDiv = document.createElement('div');
        conflictDetailsDiv.id = 'greenhouse-conflict-details';
        conflictDetailsDiv.setAttribute('data-identifier', 'conflict-details');
        modalBody.appendChild(pOverlap);
        modalBody.appendChild(conflictDetailsDiv);
        modalContent.appendChild(modalBody);

        const modalFooter = document.createElement('div');
        modalFooter.className = 'greenhouse-modal-footer';
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'greenhouse-btn greenhouse-btn-secondary';
        cancelButton.id = 'greenhouse-conflict-cancel';
        cancelButton.textContent = 'Cancel';
        cancelButton.setAttribute('data-identifier', 'conflict-modal-cancel-btn');
        const resolveButton = document.createElement('button');
        resolveButton.type = 'button';
        resolveButton.className = 'greenhouse-btn greenhouse-btn-primary';
        resolveButton.id = 'greenhouse-conflict-resolve';
        resolveButton.textContent = 'Choose Different Time';
        resolveButton.setAttribute('data-identifier', 'conflict-modal-resolve-btn');
        modalFooter.appendChild(cancelButton);
        modalFooter.appendChild(resolveButton);
        modalContent.appendChild(modalFooter);

        conflictModalDiv.appendChild(modalContent);
        fragment.appendChild(conflictModalDiv);

        return fragment;
    }

    /**
     * @function createInstructionsPanel
     * @description Creates the instructional panel content.
     * @param {HTMLElement} targetElement - The DOM element to append the UI to.
     * @returns {DocumentFragment}
     */
    function createInstructionsPanel(targetElement) {
        if (!targetElement) {
            console.error('SchedulerUI: Target element for instructions panel is null.');
            return null;
        }

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
        instructionsList.setAttribute('data-identifier', 'instructions-list');

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

        // Add the appointments list container to the right panel as well
        const appointmentListDiv = document.createElement('ul'); // Changed to ul for a list
        appointmentListDiv.id = 'greenhouse-patient-app-appointments-list';
        appointmentListDiv.className = 'greenhouse-patient-app-appointments-list';
        appointmentListDiv.setAttribute('data-identifier', 'appointment-list');
        const noAppointmentsLi = document.createElement('li');
        noAppointmentsLi.textContent = 'No appointments scheduled.';
        appointmentListDiv.appendChild(noAppointmentsLi);
        fragment.appendChild(appointmentListDiv);

        targetElement.appendChild(fragment); // Attach to targetElement

        return fragment;
    }

    /**
     * Builds the UI for the Patient Calendar.
     * @param {HTMLElement} targetElement - The DOM element to append the UI to.
     * @returns {HTMLElement} The calendar container.
     */
    function buildPatientCalendarUI(targetElement) {
        if (!targetElement) {
            console.error('SchedulerUI: Target element for patient calendar is null.');
            return null;
        }

        const calendarContainer = document.createElement('div');
        calendarContainer.id = 'greenhouse-patient-app-calendar-container';
        calendarContainer.setAttribute('data-identifier', 'calendar-container');
        calendarContainer.className = 'greenhouse-calendar-container';

        const header = document.createElement('div');
        header.className = 'calendar-header';

        const prevButton = document.createElement('button');
        prevButton.dataset.action = 'prev-month';
        prevButton.textContent = 'Prev';
        header.appendChild(prevButton);

        const title = document.createElement('h2');
        title.setAttribute('data-identifier', 'calendar-title');
        title.textContent = 'Month Year'; // Placeholder
        header.appendChild(title);

        const nextButton = document.createElement('button');
        nextButton.dataset.action = 'next-month';
        nextButton.textContent = 'Next';
        header.appendChild(nextButton);

        calendarContainer.appendChild(header);

        const table = document.createElement('table');
        table.className = 'calendar-table';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            const th = document.createElement('th');
            th.textContent = day;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        tbody.setAttribute('data-identifier', 'calendar-tbody');
        table.appendChild(tbody);

        calendarContainer.appendChild(table);
        targetElement.appendChild(calendarContainer);

        return calendarContainer;
    }

    /**
     * Builds the HTML form for editing an appointment.
     * This function is now purely for UI creation and does not handle data population or event listeners.
     * @param {HTMLElement} targetElement - The DOM element to append the UI to.
     * @param {object} currentAppointment - The appointment data (used for initial values).
     * @param {Array<object>} serviceTypes - The available service types (used for select options).
     * @returns {HTMLFormElement} The generated form element.
     */
    function buildAdminAppointmentFormUI(targetElement, currentAppointment = {}, serviceTypes = []) {
        if (!targetElement) {
            console.error('SchedulerUI: Target element for admin appointment form is null.');
            return null;
        }

        const form = document.createElement('form');
        form.id = 'greenhouse-admin-app-individual-appointment-form';
        form.setAttribute('data-identifier', 'admin-appointment-form');
        if (currentAppointment._id) {
            form.dataset.appointmentId = currentAppointment._id;
        }

        const fields = [
            { label: 'Title', id: 'adminTitle', type: 'text', value: currentAppointment.title || '' },
            { label: 'Start Time', id: 'adminStart', type: 'datetime-local', value: currentAppointment.start ? currentAppointment.start.substring(0, 16) : '' },
            { label: 'End Time', id: 'adminEnd', type: 'datetime-local', value: currentAppointment.end ? currentAppointment.end.substring(0, 16) : '' },
            { label: 'Platform', id: 'adminPlatform', type: 'text', value: currentAppointment.platform || '' },
            { label: 'Service', id: 'adminService', type: 'select', value: currentAppointment.serviceRef || '', options: serviceTypes.map(st => ({ value: st._id, text: st.name })) },
            { label: 'Confirmed', id: 'adminConfirmed', type: 'checkbox', value: currentAppointment.confirmed || false },
            { label: 'Conflicts', id: 'adminConflicts', type: 'textarea', value: currentAppointment.conflicts ? JSON.stringify(currentAppointment.conflicts, null, 2) : '', readOnly: true },
            { label: 'First Name', id: 'adminFirstName', type: 'text', value: currentAppointment.firstName || '' },
            { label: 'Last Name', id: 'adminLastName', type: 'text', value: currentAppointment.lastName || '' },
            { label: 'Contact Info', id: 'adminContactInfo', type: 'text', value: currentAppointment.contactInfo || '' },
            { label: 'Anonymous ID', id: 'adminAnonymousId', type: 'text', value: currentAppointment.anonymousId || '', readOnly: true }
        ];

        fields.forEach(field => {
            const fieldContainer = document.createElement('div');
            fieldContainer.className = 'greenhouse-form-field';

            const label = document.createElement('label');
            label.htmlFor = `greenhouse-admin-app-${field.id}`;
            label.textContent = field.label + ':';
            label.className = 'greenhouse-form-label';
            fieldContainer.appendChild(label);

            let input;
            if (field.type === 'textarea') {
                input = document.createElement('textarea');
                input.rows = 3;
            } else if (field.type === 'select') {
                input = document.createElement('select');
                // Add a default "Select a service" option if not already present
                if (!field.options.some(opt => opt.value === '')) {
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = 'Select a service...';
                    input.appendChild(defaultOption);
                }
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

            input.id = `greenhouse-admin-app-${field.id}`;
            input.name = field.id;
            input.className = 'greenhouse-form-input';
            input.readOnly = field.readOnly || false;
            input.setAttribute('data-identifier', `admin-app-${field.id}`);

            if (field.type === 'checkbox') {
                input.checked = field.value;
            } else {
                input.value = field.value;
            }

            fieldContainer.appendChild(input);
            form.appendChild(fieldContainer);
        });

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'greenhouse-form-button-container';

        const saveButton = document.createElement('button');
        saveButton.type = 'submit';
        saveButton.textContent = 'Save Changes';
        saveButton.dataset.action = 'save-changes';
        saveButton.className = 'greenhouse-admin-app-button greenhouse-form-submit-btn';
        saveButton.setAttribute('data-identifier', 'admin-save-btn');
        buttonContainer.appendChild(saveButton);

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete Appointment';
        deleteButton.classList.add('greenhouse-admin-app-button', 'greenhouse-admin-app-button-delete');
        deleteButton.dataset.action = 'delete-appointment';
        if (currentAppointment.serviceRef) {
            deleteButton.dataset.serviceRef = currentAppointment.serviceRef;
        }
        deleteButton.setAttribute('data-identifier', 'admin-delete-btn');
        buttonContainer.appendChild(deleteButton);

        form.appendChild(buttonContainer);
        targetElement.appendChild(form); // Attach to targetElement

        return form;
    }

    /**
     * Placeholder function to initiate fetching and populating schedule data
     * by calling the corresponding function in GreenhouseDashboardApp.
     */
    function fetchAndPopulateScheduleData() {
        console.log('SchedulerUI: Initiating data fetch and population via GreenhouseDashboardApp...');
        // Assuming GreenhouseDashboardApp is globally accessible or passed appropriately
        if (window.GreenhouseDashboardApp && typeof window.GreenhouseDashboardApp.triggerDataFetchAndPopulation === 'function') {
            window.GreenhouseDashboardApp.triggerDataFetchAndPopulation();
        } else {
            console.error('GreenhouseSchedulerUI: GreenhouseDashboardApp.triggerDataFetchAndPopulation not found or not a function.');
        }
    }

    return {
        buildSchedulerUI,
        buildPatientFormUI,
        buildDashboardLeftPanelUI,
        buildDashboardRightPanelUI,
        buildAdminFormUI,
        createHiddenElements,
        createInstructionsPanel,
        buildAdminAppointmentFormUI,
        buildPatientCalendarUI, // Expose the patient calendar UI builder
        fetchAndPopulateScheduleData, // Expose the new function
    };
})();
