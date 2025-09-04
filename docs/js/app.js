import { getServices } from 'backend/services';
import { getAppointments, proposeAppointment, createAppointment, updateAppointment, deleteAppointmentFromService } from 'backend/scheduling'; // Corrected import for deleteAppointmentFromService

const AppointmentApp = (function() { // Start of IIFE

    // Internal functions (private to this module)
    function setupModal() {
        const modal = document.getElementById('conflict-modal');
        const closeButton = document.querySelector('.close-button');

        closeButton.onclick = () => {
            modal.style.display = 'none';
        };

        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        };
    }

    function showConflictModal(conflictData) {
        const modal = document.getElementById('conflict-modal');
        const conflictDetailsDiv = document.getElementById('conflict-details');
        conflictDetailsDiv.innerHTML = ''; // Clear previous conflicts

        let conflictHtml = '<ul>';
        conflictData.conflicts.forEach(conflict => {
            const conflictingAppointment = conflict.conflictingAppointment; // Renamed variable
            conflictHtml += `<li><strong>${conflictingAppointment.title}</strong> on ${conflictingAppointment.date} at ${conflictingAppointment.time} (Service: ${conflictingAppointment.serviceRef || 'N/A'})</li>`; // Use serviceRef
        });
        conflictHtml += '</ul>';

        conflictDetailsDiv.innerHTML = conflictHtml;
        modal.style.display = 'block';
    }

    async function fetchServices() {
        try {
            const services = await getServices(); // Call Velo backend function
            const select = document.getElementById('service');
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
        const appointments = await getAppointments(); // Call Velo backend function
        const ul = document.getElementById('appointments'); // Changed from 'events'
        ul.innerHTML = '';

        if (appointments.length === 0) {
            ul.innerHTML = '<li>No appointments scheduled.</li>';
            return;
        }

        appointments.forEach(appointment => {
            const li = document.createElement('li');
            li.className = 'appointment-item'; // Renamed class
            const appointmentJsonString = JSON.stringify(appointment).replace(/'/g, "&apos;");
            li.innerHTML = `
                <strong>${appointment.title}</strong><br>
                Date: ${appointment.date} at ${appointment.time}<br>
                Meeting Platform: ${appointment.platform} (Service: ${appointment.serviceRef || 'N/A'}) // Use serviceRef
                <div style="margin-top: 5px;">
                    <button onclick='AppointmentApp.editAppointment(${appointmentJsonString})'>Edit</button>
                    <button onclick='AppointmentApp.deleteAppointment("${appointment._id}", "${appointment.serviceRef}")'>Delete</button> // Use _id and serviceRef
                </div>
            `;
            ul.appendChild(li);
        });
    }

    function clearFormInputs() {
        document.getElementById('title').value = '';
        document.getElementById('date').value = '';
        document.getElementById('time').value = '';
        document.getElementById('platform').value = '';
        if (document.getElementById('service').options.length > 0) {
            document.getElementById('service').selectedIndex = 0;
        }
    }

    function resetForm() {
        clearFormInputs();
        const form = document.getElementById('appointment-form'); // Changed from 'event-form'
        let button = form.querySelector('button');
        button.textContent = 'Add Appointment'; // Renamed text
        button.onclick = AppointmentApp.proposeAndAddAppointment; // Call via namespace

        const existingCancelButton = document.getElementById('cancel-edit-btn');
        if (existingCancelButton) {
            existingCancelButton.remove();
        }
    }

    function editAppointment(appointment) { // Renamed function and parameter
        document.getElementById('title').value = appointment.title;
        document.getElementById('date').value = appointment.date;
        document.getElementById('time').value = appointment.time;
        document.getElementById('platform').value = appointment.platform;
        document.getElementById('service').value = appointment.serviceRef; // Use serviceRef

        const form = document.getElementById('appointment-form'); // Changed from 'event-form'
        let button = form.querySelector('button');
        button.textContent = 'Update Appointment'; // Renamed text
        button.onclick = () => AppointmentApp.updateAppointment(appointment._id); // Call via namespace

        if (!document.getElementById('cancel-edit-btn')) {
            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Cancel';
            cancelButton.id = 'cancel-edit-btn';
            cancelButton.type = 'button';
            cancelButton.onclick = AppointmentApp.resetForm; // Call via namespace
            button.parentNode.insertBefore(cancelButton, button.nextSibling);
        }
        form.scrollIntoView({ behavior: 'smooth' });
    }

    async function updateAppointment(appointmentId) { // Renamed function and parameter
        const title = document.getElementById('title').value;
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;
        const platform = document.getElementById('platform').value;
        const serviceId = document.getElementById('service').value; // This is serviceRef now

        if (!title || !date || !time || !platform || !serviceId) {
            alert('Please fill in all fields.');
            return;
        }

        const startDateTime = new Date(`${date}T${time}:00`);
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

        const updatedAppointment = { // Renamed variable
            _id: appointmentId, // Use _id for Wix Data
            title,
            date,
            time,
            platform: platform,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            serviceRef: serviceId // Use serviceRef
        };

        try {
            await proposeAppointment(updatedAppointment); // Call Velo backend function
        } catch (error) {
            if (error.code === '409') { // Check for custom error code
                AppointmentApp.showConflictModal(error.data); // Call via namespace
                return;
            } else {
                console.error("Error proposing appointment update:", error);
                alert('Failed to propose appointment update for conflict check.');
                return;
            }
        }

        try {
            await updateAppointment(appointmentId, updatedAppointment); // Call Velo backend function
            AppointmentApp.resetForm(); // Call via namespace
            AppointmentApp.fetchAppointments(); // Call via namespace
        } catch (error) {
            console.error("Error updating appointment:", error);
            alert('Failed to update appointment.');
        }
    }

    async function deleteAppointment(appointmentId, serviceId) { // Renamed function and parameters
        if (!confirm('Are you sure you want to delete this appointment?')) { // Renamed text
            return;
        }

        try {
            await deleteAppointmentFromService(serviceId, appointmentId); // Call Velo backend function
            AppointmentApp.fetchAppointments(); // Call via namespace
        } catch (error) {
            console.error("Error deleting appointment:", error);
            alert('Failed to delete appointment.');
        }
    }

    async function proposeAndAddAppointment() { // Renamed function
        const title = document.getElementById('title').value;
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;
        const platform = document.getElementById('platform').value;
        const serviceId = document.getElementById('service').value; // This is serviceRef now

        if (!title || !date || !time || !platform || !serviceId) {
            alert('Please fill in all fields.');
            return;
        }

        const startDateTime = new Date(`${date}T${time}:00`);
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

        const proposedAppointment = { // Renamed variable
            title,
            date,
            time,
            platform: platform,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            serviceRef: serviceId // Use serviceRef
        };

        try {
            await proposeAppointment(proposedAppointment); // Call Velo backend function
        } catch (error) {
            if (error.code === '409') { // Check for custom error code
                AppointmentApp.showConflictModal(error.data); // Call via namespace
                return;
            } else {
                console.error("Error proposing appointment:", error);
                alert('Failed to propose appointment for conflict check.');
                return;
            }
        }

        try {
            await createAppointment(proposedAppointment); // Call Velo backend function
            AppointmentApp.clearFormInputs(); // Call via namespace
            AppointmentApp.fetchAppointments(); // Call via namespace
        } catch (error) {
            console.error("Error adding appointment:", error);
            alert('Failed to add appointment after conflict check.');
        }
    }

    // Initialization function for the app
    function init() {
        fetchAppointments();
        fetchServices();
        resetForm();
        setupModal();
    }

    // Return the public interface of the module
    return {
        init: init,
        fetchServices: fetchServices,
        fetchAppointments: fetchAppointments,
        editAppointment: editAppointment,
        updateAppointment: updateAppointment,
        deleteAppointment: deleteAppointment,
        proposeAndAddAppointment: proposeAndAddAppointment,
        showConflictModal: showConflictModal,
        resetForm: resetForm,
        clearFormInputs: clearFormInputs
    };

})(); // End of IIFE
