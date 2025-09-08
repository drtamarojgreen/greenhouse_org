function GreenhouseAdminApp() {
    // Velo backend function wrappers
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

    async function deleteAppointment(appointmentId, serviceRef) {
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

            const form = GreenhouseSchedulerUI.buildAdminAppointmentForm(currentAppointment, serviceTypes);
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
        init: init
    };
}
