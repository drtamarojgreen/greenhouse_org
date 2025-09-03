// docs/js/admin.js

// Import necessary Velo backend functions (these are placeholders until implemented)
// import { getAppointmentById, updateAppointment, deleteAppointment } from 'backend/adminScheduling'; // Assuming an adminScheduling module

/**
 * Builds the UI for the Individual Appointment Admin page.
 * @returns {DocumentFragment} A DocumentFragment containing the admin UI.
 */
async function buildAdminUI() {
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

    const form = document.createElement('form');
    form.id = 'individual-appointment-form';
    fragment.appendChild(form);

    // Mock appointment data for now
    let currentAppointment = {
        _id: appointmentId,
        title: 'Mock Appointment Title',
        start: '2025-09-10T14:00:00Z',
        end: '2025-09-10T15:00:00Z',
        platform: 'Zoom',
        serviceRef: 'serviceA',
        confirmed: false,
        conflicts: 'None',
        firstName: 'John',
        lastName: 'Doe',
        contactInfo: 'john.doe@example.com',
        anonymousId: 'anonXYZ'
    };

    // Simulate fetching data
    // try {
    //     currentAppointment = await getAppointmentById(appointmentId);
    //     if (!currentAppointment) {
    //         const p = document.createElement('p');
    //         p.textContent = 'Appointment not found.';
    //         fragment.appendChild(p);
    //         return fragment;
    //     }
    // } catch (error) {
    //     console.error("Error fetching appointment:", error);
    //     const p = document.createElement('p');
    //     p.textContent = 'Failed to load appointment details.';
    //     fragment.appendChild(p);
    //     return fragment;
    // }

    const fields = [
        { label: 'Title', id: 'adminTitle', type: 'text', value: currentAppointment.title },
        { label: 'Start Time', id: 'adminStart', type: 'datetime-local', value: currentAppointment.start ? currentAppointment.start.substring(0, 16) : '' },
        { label: 'End Time', id: 'adminEnd', type: 'datetime-local', value: currentAppointment.end ? currentAppointment.end.substring(0, 16) : '' },
        { label: 'Platform', id: 'adminPlatform', type: 'text', value: currentAppointment.platform },
        { label: 'Service ID', id: 'adminServiceRef', type: 'text', value: currentAppointment.serviceRef, readOnly: true },
        { label: 'Confirmed', id: 'adminConfirmed', type: 'checkbox', value: currentAppointment.confirmed },
        { label: 'Conflicts', id: 'adminConflicts', type: 'textarea', value: currentAppointment.conflicts },
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
        } else {
            input = document.createElement('input');
            input.type = field.type;
        }
        input.id = field.id;
        input.name = field.id;
        input.value = field.value;
        input.readOnly = field.readOnly || false;
        if (field.type === 'checkbox') {
            input.checked = field.value;
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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updatedData = {
            _id: appointmentId,
            title: document.getElementById('adminTitle').value,
            start: document.getElementById('adminStart').value,
            end: document.getElementById('adminEnd').value,
            platform: document.getElementById('adminPlatform').value,
            serviceRef: document.getElementById('adminServiceRef').value,
            confirmed: document.getElementById('adminConfirmed').checked,
            conflicts: document.getElementById('adminConflicts').value,
            firstName: document.getElementById('adminFirstName').value,
            lastName: document.getElementById('adminLastName').value,
            contactInfo: document.getElementById('adminContactInfo').value,
            anonymousId: document.getElementById('adminAnonymousId').value
        };

        alert('Saving changes (Backend call to updateAppointment would go here)');
        // try {
        //     await updateAppointment(appointmentId, updatedData);
        //     alert('Appointment updated successfully!');
        // } catch (error) {
        //     console.error("Error updating appointment:", error);
        //     alert('Failed to update appointment.');
        // }
    });

    deleteButton.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this appointment?')) {
            alert('Deleting appointment (Backend call to deleteAppointment would go here)');
            // try {
            //     await deleteAppointment(appointmentId, currentAppointment.serviceRef); // serviceRef might be needed for delete
            //     alert('Appointment deleted successfully!');
            //     // Redirect or clear form after deletion
            // } catch (error) {
            //     console.error("Error deleting appointment:", error);
            //     alert('Failed to delete appointment.');
            // }
        }
    });

    return fragment;
}

// Expose globally for scheduler.js
window.buildAdminUI = buildAdminUI;