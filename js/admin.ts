async function getAppointmentById(id: string): Promise<any> {
    const res = await fetch(`/_functions/getAppointmentById?id=${encodeURIComponent(id)}`);
    return res.ok ? res.json() : null;
}
async function updateAppointment(id: string, data: any): Promise<any> {
    const res = await fetch(`/_functions/updateAppointment/${encodeURIComponent(id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
}
async function deleteAppointment(id: string, _serviceRef?: any): Promise<any> {
    const res = await fetch(`/_functions/deleteAppointment/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return res.json();
}
async function getServiceTypes(): Promise<any> {
    const res = await fetch('/_functions/getServiceTypes');
    return res.ok ? res.json() : [];
}

var _exported_Admin: any;
(function() {
    // docs/js/admin.js

    // Import necessary Velo backend functions

    /**
     * @namespace Admin
     * @description Encapsulates all functionality for the individual appointment admin page.
     */
    const Admin = {
        /**
         * Initializes the admin UI by fetching data and building the form.
         * @returns {Promise<DocumentFragment>} A promise that resolves with the admin UI fragment.
         */
        async init() {
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

                const form = this.buildForm(currentAppointment, serviceTypes);
                fragment.appendChild(form);

            } catch (error) {
                console.error("Error fetching data:", error);
                const p = document.createElement('p');
                p.style.color = 'red';
                p.textContent = 'Failed to load appointment details. Please check the console and try again.';
                fragment.appendChild(p);
            }

            return fragment;
        },

        /**
         * Builds the HTML form for editing an appointment.
         * @param {object} currentAppointment - The appointment data.
         * @param {Array<object>} serviceTypes - The available service types.
         * @returns {HTMLFormElement} The generated form element.
         */
        buildForm(currentAppointment, serviceTypes) {
            const form = document.createElement('form');
            form.id = 'individual-appointment-form';

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
                label.htmlFor = field.id;
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

                input.id = field.id;
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
            form.appendChild(saveButton);

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.textContent = 'Delete Appointment';
            deleteButton.style.marginLeft = '10px';
            deleteButton.style.backgroundColor = 'red';
            deleteButton.style.color = 'white';
            form.appendChild(deleteButton);

            form.addEventListener('submit', (e) => this.handleSave(e, currentAppointment._id));
            deleteButton.addEventListener('click', () => this.handleDelete(currentAppointment._id, currentAppointment.serviceRef));

            return form;
        },

        /**
         * Handles the form submission to save appointment changes.
         * @param {Event} e - The form submission event.
         * @param {string} appointmentId - The ID of the appointment to update.
         */
        async handleSave(e, appointmentId) {
            e.preventDefault();
            const updatedData = {
                _id: appointmentId,
                title: (document.getElementById as any)('adminTitle').value,
                start: (document.getElementById as any)('adminStart').value,
                end: (document.getElementById as any)('adminEnd').value,
                platform: (document.getElementById as any)('adminPlatform').value,
                serviceRef: (document.getElementById as any)('adminService').value,
                confirmed: (document.getElementById as any)('adminConfirmed').checked,
                conflicts: (document.getElementById as any)('adminConflicts').value, // Note: This should be parsed if it's edited
                firstName: (document.getElementById as any)('adminFirstName').value,
                lastName: (document.getElementById as any)('adminLastName').value,
                contactInfo: (document.getElementById as any)('adminContactInfo').value,
                anonymousId: (document.getElementById as any)('adminAnonymousId').value
            };

            try {
                await updateAppointment(appointmentId, updatedData);
                alert('Appointment updated successfully!');
            } catch (error) {
                console.error("Error updating appointment:", error);
                alert('Failed to update appointment.');
            }
        },

        /**
         * Handles the click event to delete an appointment.
         * @param {string} appointmentId - The ID of the appointment to delete.
         * @param {string} serviceRef - The service reference, which might be needed for deletion.
         */
        async handleDelete(appointmentId, serviceRef) {
            if (confirm('Are you sure you want to delete this appointment?')) {
                try {
                    await deleteAppointment(appointmentId, serviceRef);
                    alert('Appointment deleted successfully!');
                    // Optionally, redirect or clear the form
                    (document.getElementById as any)('individual-appointment-form').innerHTML = '<p>Appointment has been deleted.</p>';
                } catch (error) {
                    console.error("Error deleting appointment:", error);
                    alert('Failed to delete appointment.');
                }
            }
        }
    };

    // Expose the Admin object to the global window object
    // This allows scheduler.js to call it
    _exported_Admin = Admin;

})();


export var Admin = _exported_Admin;
