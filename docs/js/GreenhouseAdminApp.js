function GreenhouseAdminApp() {
    // Velo backend function wrappers
    async function getAppointmentById(appointmentId) {
        const response = await fetch(`/_api/getAppointmentById/${appointmentId}`);
        if (!response.ok) {
            throw new Error(`Failed to get appointment: ${response.statusText}`);
        }
        return response.json();
    }

    async function updateAppointment(appointmentId, updatedData) {
        const response = await fetch(`/_api/updateAppointment/${appointmentId}`, {
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

    async function deleteAppointment(appointmentId, serviceRef) {
        const response = await fetch(`/_api/deleteAppointment/${appointmentId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`Failed to delete appointment: ${response.statusText}`);
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

    /**
     * Initializes the admin UI by fetching data and building the form.
     * @returns {Promise<DocumentFragment>} A promise that resolves with the admin UI fragment.
     */
    async function init() {
        const fragment = document.createDocumentFragment();

        const h1 = document.createElement('h1');
        h1.textContent = 'Individual Appointment Administration';
        fragment.appendChild(h1);

        const description = document.createElement('p');
        description.textContent = 'View and administer details for a specific appointment.';
        fragment.appendChild(description);

        const appointmentId = new URLSearchParams(window.location.search).get('appointmentId');

        if (!appointmentId) {
            const p = document.createElement('p');
            p.textContent = 'No appointment ID provided. Please navigate from the dashboard or provide an ID in the URL.';
            fragment.appendChild(p);
            return fragment;
        }

        try {
            const [currentAppointment, serviceTypes] = await Promise.all([
                getAppointmentById(appointmentId),
                getServiceTypes()
            ]);

            if (!currentAppointment) {
                const p = document.createElement('p');
                p.textContent = 'Appointment not found.';
                fragment.appendChild(p);
                return fragment;
            }

            const form = buildForm(currentAppointment, serviceTypes);
            fragment.appendChild(form);

            // Attach event listener to the form for delegation
            form.addEventListener('click', handleAction);
            form.addEventListener('submit', handleAction);


        } catch (error) {
            console.error("Error fetching data:", error);
            const p = document.createElement('p');
            p.style.color = 'red';
            p.textContent = 'Failed to load appointment details. Please check the console and try again.';
            fragment.appendChild(p);
        }

        return fragment;
    }

    /**
     * Builds the HTML form for editing an appointment.
     * @param {object} currentAppointment - The appointment data.
     * @param {Array<object>} serviceTypes - The available service types.
     * @returns {HTMLFormElement} The generated form element.
     */
    function buildForm(currentAppointment, serviceTypes) {
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

    /**
     * Handles the form submission to save appointment changes.
     * @param {Event} e - The form submission event.
     * @param {string} appointmentId - The ID of the appointment to update.
     */
    async function handleSave(e) {
        e.preventDefault();
        const form = e.target; // The form element itself
        const appointmentId = form.dataset.appointmentId; // Get appointmentId from form's dataset

        const updatedData = {
            _id: appointmentId,
            title: document.getElementById('greenhouse-admin-app-adminTitle').value,
            start: document.getElementById('greenhouse-admin-app-adminStart').value,
            end: document.getElementById('greenhouse-admin-app-adminEnd').value,
            platform: document.getElementById('greenhouse-admin-app-adminPlatform').value,
            serviceRef: document.getElementById('greenhouse-admin-app-adminService').value,
            confirmed: document.getElementById('greenhouse-admin-app-adminConfirmed').checked,
            conflicts: document.getElementById('greenhouse-admin-app-adminConflicts').value, // Note: This should be parsed if it's edited
            firstName: document.getElementById('greenhouse-admin-app-adminFirstName').value,
            lastName: document.getElementById('greenhouse-admin-app-adminLastName').value,
            contactInfo: document.getElementById('greenhouse-admin-app-adminContactInfo').value,
            anonymousId: document.getElementById('greenhouse-admin-app-adminAnonymousId').value
        };

        try {
            await updateAppointment(appointmentId, updatedData);
            GreenhouseUtils.displaySuccess('Appointment updated successfully!');
        } catch (error) {
            console.error("Error updating appointment:", error);
            GreenhouseUtils.displayError('Failed to update appointment.');
        }
    }

    /**
     * Handles the click event to delete an appointment.
     * @param {string} appointmentId - The ID of the appointment to delete.
     * @param {string} serviceRef - The service reference, which might be needed for deletion.
     */
    async function handleDelete(appointmentId, serviceRef) {
        if (confirm('Are you sure you want to delete this appointment?')) {
            try {
                await deleteAppointment(appointmentId, serviceRef);
                GreenhouseUtils.displaySuccess('Appointment deleted successfully!');
                // Optionally, redirect or clear the form
                document.getElementById('greenhouse-admin-app-individual-appointment-form').innerHTML = '<p>Appointment has been deleted.</p>';
            } catch (error) {
                console.error("Error deleting appointment:", error);
                GreenhouseUtils.displayError('Failed to delete appointment.');
            }
        }
    }

    function handleAction(event) {
        const target = event.target;
        const action = target.dataset.action;

        if (action) {
            // For submit events, the target is the form itself
            if (event.type === 'submit' && action === 'save-changes') {
                handleSave(event);
                return;
            }

            const appointmentId = target.dataset.appointmentId || target.closest('form').dataset.appointmentId;
            const serviceRef = target.dataset.serviceRef;

            switch (action) {
                case 'delete-appointment':
                    handleDelete(appointmentId, serviceRef);
                    break;
            }
        }
    }

    return {
        init: init,
        buildForm: buildForm // Expose buildForm for scheduler.js
    };
}
