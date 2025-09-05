// Version: 0.0.0.0
function GreenhousePatientApp() {
    // All functions are now private to the GreenhousePatientApp scope.

    async function getServices() {
        const response = await fetch('/_api/getServices');
        if (!response.ok) {
            throw new Error(`Failed to get services: ${response.statusText}`);
        }
        return response.json();
    }

    async function getAppointments() {
        const response = await fetch('/_api/getAppointments');
        if (!response.ok) {
            throw new Error(`Failed to get appointments: ${response.statusText}`);
        }
        return response.json();
    }

    async function proposeAppointment(appointment) {
        const response = await fetch('/_api/proposeAppointment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(appointment),
        });
        if (!response.ok) {
            const errorData = await response.json();
            const error = new Error(`Failed to propose appointment: ${response.statusText}`);
            error.code = response.status;
            error.data = errorData;
            throw error;
        }
        return response.json();
    }

    async function createAppointment(appointment) {
        const response = await fetch('/_api/createAppointment', {
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
    }

    async function updateAppointment(appointmentId, updatedAppointment) {
        const response = await fetch(`/_api/updateAppointment/${appointmentId}`, {
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
    }

    async function deleteAppointmentFromService(serviceId, appointmentId) { // serviceId parameter is now unused
        const response = await fetch(`/_api/deleteAppointment/${appointmentId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`Failed to delete appointment: ${response.statusText}`);
        }
        return response.json();
    }

    function setupModal() {
        const modal = document.getElementById('conflict-modal'); // External ID
        const closeButton = document.querySelector('.close-button'); // External class

        if(closeButton){
            closeButton.onclick = () => {
                modal.style.display = 'none';
            };
        }

        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        };
    }

    function showConflictModal(conflictData) {
        const modal = document.getElementById('conflict-modal'); // External ID
        const conflictDetailsDiv = document.getElementById('conflict-details'); // External ID
        conflictDetailsDiv.innerHTML = ''; // Clear previous conflicts

        let conflictHtml = '<ul>';
        conflictData.conflicts.forEach(conflict => {
            const conflictingAppointment = conflict.conflictingAppointment;
            conflictHtml += `<li><strong>${conflictingAppointment.title}</strong> on ${conflictingAppointment.date} at ${conflictingAppointment.time} (Service: ${conflictingAppointment.serviceRef || 'N/A'})</li>`;
        });
        conflictHtml += '</ul>';

        conflictDetailsDiv.innerHTML = conflictHtml;
        modal.style.display = 'block';
    }

    async function fetchServices() {
        try {
            const services = await getServices();
            const select = document.getElementById('greenhouse-patient-app-service-select'); // Renamed ID
            select.innerHTML = '';

            services.forEach(service => {
                const option = document.createElement('option');
                option.value = service.id;
                option.textContent = service.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error("Error fetching services:", error);
            alert("Failed to load services.");
        }
    }

    async function fetchAppointments() {
        const appointments = await getAppointments();
        const ul = document.getElementById('greenhouse-patient-app-appointments-list'); // Renamed ID
        ul.innerHTML = '';

        if (appointments.length === 0) {
            ul.innerHTML = '<li>No appointments scheduled.</li>';
            return;
        }

        appointments.forEach(appointment => {
            const li = document.createElement('li');
            li.className = 'greenhouse-patient-app-appointment-item'; // Renamed class
            const appointmentJsonString = JSON.stringify(appointment).replace(/'/g, "&apos;");
            li.innerHTML = `
                <strong>${appointment.title}</strong><br>
                Date: ${appointment.date} at ${appointment.time}<br>
                Meeting Platform: ${appointment.platform} (Service: ${appointment.serviceRef || 'N/A'})
                <div style="margin-top: 5px;">
                    <button data-action='edit' data-appointment='${appointmentJsonString}' class="greenhouse-patient-app-button">Edit</button>
                    <button data-action='delete' data-appointment-id='${appointment._id}' data-service-id='${appointment.serviceRef}' class="greenhouse-patient-app-button">Delete</button>
                </div>
            `;
            ul.appendChild(li);
        });
    }

    function clearFormInputs() {
        document.getElementById('greenhouse-patient-app-title-input').value = '';
        document.getElementById('greenhouse-patient-app-date-input').value = '';
        document.getElementById('greenhouse-patient-app-time-input').value = '';
        document.getElementById('greenhouse-patient-app-platform-input').value = '';
        const serviceSelect = document.getElementById('greenhouse-patient-app-service-select');
        if (serviceSelect && serviceSelect.options.length > 0) {
            serviceSelect.selectedIndex = 0;
        }
    }

    function resetForm() {
        clearFormInputs();
        const form = document.getElementById('greenhouse-patient-app-appointment-form');
        let button = form.querySelector('button');
        button.textContent = 'Add Appointment';
        button.dataset.action = 'propose-and-add-appointment';

        const existingCancelButton = document.getElementById('greenhouse-patient-app-cancel-edit-button');
        if (existingCancelButton) {
            existingCancelButton.remove();
        }
    }

    function editAppointment(appointment) {
        document.getElementById('greenhouse-patient-app-title-input').value = appointment.title;
        document.getElementById('greenhouse-patient-app-date-input').value = appointment.date;
        document.getElementById('greenhouse-patient-app-time-input').value = appointment.time;
        document.getElementById('greenhouse-patient-app-platform-input').value = appointment.platform;
        document.getElementById('greenhouse-patient-app-service-select').value = appointment.serviceRef;

        const form = document.getElementById('greenhouse-patient-app-appointment-form');
        let button = form.querySelector('button');
        button.textContent = 'Update Appointment';
        button.dataset.action = 'update-appointment';
        button.dataset.appointmentId = appointment._id;

        if (!document.getElementById('greenhouse-patient-app-cancel-edit-button')) {
            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Cancel';
            cancelButton.id = 'greenhouse-patient-app-cancel-edit-button';
            cancelButton.type = 'button';
            cancelButton.dataset.action = 'reset-form';
            button.parentNode.insertBefore(cancelButton, button.nextSibling);
        }
        form.scrollIntoView({ behavior: 'smooth' });
    }

    async function updateAppointment(appointmentId) {
        const title = document.getElementById('greenhouse-patient-app-title-input').value;
        const date = document.getElementById('greenhouse-patient-app-date-input').value;
        const time = document.getElementById('greenhouse-patient-app-time-input').value;
        const platform = document.getElementById('greenhouse-patient-app-platform-input').value;
        const serviceId = document.getElementById('greenhouse-patient-app-service-select').value;

        if (!title || !date || !time || !platform || !serviceId) {
            alert('Please fill in all fields.');
            return;
        }

        const startDateTime = new Date(`${date}T${time}:00`);
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

        const updatedAppointment = {
            _id: appointmentId,
            title,
            date,
            time,
            platform: platform,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            serviceRef: serviceId
        };

        try {
            await proposeAppointment(updatedAppointment);
        } catch (error) {
            if (error.code === 409) {
                showConflictModal(error.data);
                return;
            } else {
                console.error("Error proposing appointment update:", error);
                alert('Failed to propose appointment update for conflict check.');
                return;
            }
        }

        try {
            await updateAppointment(appointmentId, updatedAppointment);
            resetForm();
            fetchAppointments();
        } catch (error) {
            console.error("Error updating appointment:", error);
            alert('Failed to update appointment.');
        }
    }

    async function deleteAppointment(appointmentId, serviceId) {
        if (!confirm('Are you sure you want to delete this appointment?')) {
            return;
        }

        try {
            await deleteAppointmentFromService(serviceId, appointmentId);
            fetchAppointments();
        } catch (error) {
            console.error("Error deleting appointment:", error);
            alert('Failed to delete appointment.');
        }
    }

    async function proposeAndAddAppointment() {
        const title = document.getElementById('greenhouse-patient-app-title-input').value;
        const date = document.getElementById('greenhouse-patient-app-date-input').value;
        const time = document.getElementById('greenhouse-patient-app-time-input').value;
        const platform = document.getElementById('greenhouse-patient-app-platform-input').value;
        const serviceId = document.getElementById('greenhouse-patient-app-service-select').value;

        if (!title || !date || !time || !platform || !serviceId) {
            alert('Please fill in all fields.');
            return;
        }

        const startDateTime = new Date(`${date}T${time}:00`);
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

        const proposedAppointment = {
            title,
            date,
            time,
            platform: platform,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            serviceRef: serviceId
        };

        try {
            await proposeAppointment(proposedAppointment);
        } catch (error) {
            if (error.code === 409) {
                showConflictModal(error.data);
                return;
            } else {
                console.error("Error proposing appointment:", error);
                alert('Failed to propose appointment for conflict check.');
                return;
            }
        }

        try {
            await createAppointment(proposedAppointment);
            clearFormInputs();
            fetchAppointments();
        } catch (error) {
            console.error("Error adding appointment:", error);
            alert('Failed to add appointment after conflict check.');
        }
    }

    function handleAction(event) {
        const target = event.target;
        const action = target.dataset.action;

        if (action) {
            const appointmentId = target.dataset.appointmentId;
            const serviceId = target.dataset.serviceId;
            const appointmentJson = target.dataset.appointment;

            switch (action) {
                case 'edit':
                    editAppointment(JSON.parse(appointmentJson));
                    break;
                case 'delete':
                    deleteAppointment(appointmentId, serviceId);
                    break;
                case 'propose-and-add-appointment':
                    proposeAndAddAppointment();
                    break;
                case 'update-appointment':
                    updateAppointment(appointmentId);
                    break;
                case 'reset-form':
                    resetForm();
                    break;
            }
        }
    }

    function init() {
        fetchAppointments();
        fetchServices();
        resetForm();
        setupModal();
        const container = document.getElementById('greenhouse-app-container'); // This is the main app container
        if(container){
            container.addEventListener('click', handleAction);
        }
        // The propose button is now handled by event delegation
    }

    return {
        init: init
    };
}
