// Version: 0.0.0.1
console.log("Loading GreenhousePatientApp.js - Version 0.0.0.1");
function GreenhousePatientApp() {
    // All functions are now private to the GreenhousePatientApp scope.

    async function getServices() {
        try {
            const response = await fetch('/_functions/getServices');
            if (!response.ok) {
                GreenhouseUtils.displayError(`Failed to get services: ${response.statusText}`);
                return null; // Indicate failure
            }
            return response.json();
        } catch (error) {
            GreenhouseUtils.displayError(`Error fetching services: ${error.message}`);
            return null; // Indicate failure
        }
    }

    async function getAppointments() {
        try {
            const response = await fetch('/_functions/getAppointments');
            if (!response.ok) {
                GreenhouseUtils.displayError(`Failed to get appointments: ${response.statusText}`);
                return null; // Indicate failure
            }
            return response.json();
        } catch (error) {
            GreenhouseUtils.displayError(`Error fetching appointments: ${error.message}`);
            return null; // Indicate failure
        }
    }

    async function proposeAppointment(appointment) {
        try {
            const response = await fetch('/_functions/proposeAppointment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(appointment),
            });
            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 409) {
                    // For 409 conflicts, return the error data for specific handling
                    const error = new Error(`Conflict: ${response.statusText}`);
                    error.code = response.status;
                    error.data = errorData;
                    throw error; // Still throw for 409 to be caught by specific handlers
                } else {
                    GreenhouseUtils.displayError(`Failed to propose appointment: ${response.statusText}`);
                    return null; // Indicate general failure
                }
            }
            return response.json();
        } catch (error) {
            // If it's a 409 error re-thrown, re-throw it
            if (error.code === 409) {
                throw error;
            }
            GreenhouseUtils.displayError(`Error proposing appointment: ${error.message}`);
            return null; // Indicate general failure
        }
    }

    async function createAppointment(appointment) {
        try {
            const response = await fetch('/_functions/createAppointment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(appointment),
            });
            if (!response.ok) {
                GreenhouseUtils.displayError(`Failed to create appointment: ${response.statusText}`);
                return null; // Indicate failure
            }
            return response.json();
        } catch (error) {
            GreenhouseUtils.displayError(`Error creating appointment: ${error.message}`);
            return null; // Indicate failure
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
                GreenhouseUtils.displayError(`Failed to update appointment: ${response.statusText}`);
                return null; // Indicate failure
            }
            return response.json();
        } catch (error) {
            GreenhouseUtils.displayError(`Error updating appointment: ${error.message}`);
            return null; // Indicate failure
        }
    }

    async function deleteAppointmentFromService(serviceId, appointmentId) { // serviceId parameter is now unused
        try {
            const response = await fetch(`/_functions/deleteAppointment/${appointmentId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                GreenhouseUtils.displayError(`Failed to delete appointment: ${response.statusText}`);
                return null; // Indicate failure
            }
            return response.json();
        } catch (error) {
            GreenhouseUtils.displayError(`Error deleting appointment: ${error.message}`);
            return null; // Indicate failure
        }
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
            GreenhouseUtils.displayError("Failed to load services.");
            const select = document.getElementById('greenhouse-patient-app-service-select');
            if (select) {
                select.innerHTML = '<option value="">Failed to load services.</option>';
            }
        }
    }

    async function fetchAppointments() {
        try {
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
        } catch (error) {
            console.error("Error fetching appointments:", error);
            GreenhouseUtils.displayError("Failed to load appointments.");
            const ul = document.getElementById('greenhouse-patient-app-appointments-list');
            if (ul) {
                ul.innerHTML = '<li>Failed to load appointments.</li>';
            }
        }
    }

    async function proposeAndAddAppointment() {
        const title = document.getElementById('greenhouse-patient-app-title-input').value;
        const date = document.getElementById('greenhouse-patient-app-date-input').value;
        const time = document.getElementById('greenhouse-patient-app-time-input').value;
        const platform = document.getElementById('greenhouse-patient-app-platform-input').value;
        const serviceId = document.getElementById('greenhouse-patient-app-service-select').value;

        if (!title || !date || !time || !platform || !serviceId) {
            GreenhouseUtils.displayError('Please fill in all fields.');
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
                GreenhouseSchedulerUI.showConflictModal(error.data);
                return;
            } else {
                console.error("Error proposing appointment:", error);
                GreenhouseUtils.displayError('Failed to propose appointment for conflict check.');
                return;
            }
        }

        try {
            await createAppointment(proposedAppointment);
            GreenhouseSchedulerUI.clearFormInputs();
            fetchAppointments();
        } catch (error) {
            console.error("Error adding appointment:", error);
            GreenhouseUtils.displayError('Failed to add appointment after conflict check.');
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
                    GreenhouseSchedulerUI.editAppointment(JSON.parse(appointmentJson));
                    break;
                case 'delete':
                    // TODO: Replace with GreenhouseSchedulerUI.showConfirmationModal
                    // For now, assume confirmed to proceed with refactoring
                    deleteAppointment(appointmentId, serviceId);
                    break;
                case 'propose-and-add-appointment':
                    proposeAndAddAppointment();
                    break;
                case 'update-appointment':
                    // This updateAppointment is the local one, not the API one
                    // It needs to call the UI update function from schedulerUI
                    const title = document.getElementById('greenhouse-patient-app-title-input').value;
                    const date = document.getElementById('greenhouse-patient-app-date-input').value;
                    const time = document.getElementById('greenhouse-patient-app-time-input').value;
                    const platform = document.getElementById('greenhouse-patient-app-platform-input').value;
                    const serviceIdUpdate = document.getElementById('greenhouse-patient-app-service-select').value;

                    if (!title || !date || !time || !platform || !serviceIdUpdate) {
                        GreenhouseUtils.displayError('Please fill in all fields.');
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
                        serviceRef: serviceIdUpdate
                    };

                    // Call the API update function
                    (async () => {
                        try {
                            await proposeAppointment(updatedAppointment);
                        } catch (error) {
                            if (error.code === 409) {
                                GreenhouseSchedulerUI.showConflictModal(error.data);
                                return;
                            } else {
                                console.error("Error proposing appointment update:", error);
                                GreenhouseUtils.displayError('Failed to propose appointment update for conflict check.');
                                return;
                            }
                        }

                        try {
                            await updateAppointment(appointmentId, updatedAppointment); // This is the API call
                            GreenhouseSchedulerUI.resetForm();
                            fetchAppointments();
                        } catch (error) {
                            console.error("Error updating appointment:", error);
                            GreenhouseUtils.displayError('Failed to update appointment.');
                        }
                    })();
                    break;
                case 'reset-form':
                    GreenhouseSchedulerUI.resetForm();
                    break;
            }
        }
    }

    function init() {
        fetchAppointments();
        fetchServices();
        GreenhouseSchedulerUI.resetForm();
        GreenhouseSchedulerUI.setupModal();
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