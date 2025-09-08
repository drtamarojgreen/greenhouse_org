import wixData from 'wix-data';
import { response } from 'wix-http-functions';
import { fetch } from 'wix-fetch'; // Import wix-fetch for backend HTTP calls

// Helper function for conflict checking, adapted from scheduling.jsw
async function checkAppointmentConflict(newAppointment) {
    const newAppointmentStart = new Date(newAppointment.start);
    const newAppointmentEnd = new Date(newAppointment.end);

    // Call the new HTTP function for getAppointments
    const apiResponse = await fetch('https://www.greenhousementalhealth.org/_functions/getAppointments'); // Use full URL for backend fetch
    if (!apiResponse.ok) {
        throw new Error(`Failed to fetch all appointments for conflict check: ${apiResponse.statusText}`);
    }
    const allAppointmentsData = await apiResponse.json();
    const allAppointments = allAppointmentsData.items || []; // Assuming the response body has an 'items' array

    return allAppointments
        .filter(existingAppointment => {
            if (newAppointment._id && newAppointment._id === existingAppointment._id) {
                return false;
            }
            const existingAppointmentStart = new Date(existingAppointment.start);
            const existingAppointmentEnd = new Date(existingAppointment.end);
            return newAppointmentStart < existingAppointmentEnd && newAppointmentEnd > existingAppointmentStart;
        })
        .map(conflictingAppointment => ({
            type: 'time_overlap',
            proposedAppointment: newAppointment,
            conflictingAppointment: conflictingAppointment
        }));
}

/**
 * HTTP POST function to propose an appointment and check for conflicts.
 * Endpoint: /_functions/proposeAppointment
 */
export async function post(request) {
    try {
        const proposedAppointment = await request.body.json(); // Get JSON body from request

        const conflicts = await checkAppointmentConflict(proposedAppointment);
        if (conflicts.length > 0) {
            return response({
                status: 409, // Conflict
                headers: { "Content-Type": "application/json" },
                body: {
                    message: 'Proposed appointment conflicts with existing appointments.',
                    proposedAppointment: proposedAppointment,
                    conflicts: conflicts
                }
            });
        }
        return response({
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: { message: 'No conflicts detected.' }
        });
    } catch (error) {
        console.error("Error proposing appointment via HTTP Function:", error);
        return response({
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { message: "Failed to propose appointment." }
        });
    }
}
