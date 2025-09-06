import wixData from 'wix-data';
import { response } from 'wix-http-functions';

/**
 * HTTP PUT function to update an appointment's status.
 * Endpoint: /_api/updateAppointmentStatus
 */
export async function put(request) {
    try {
        const { appointmentId, status } = await request.body.json();

        if (!appointmentId || !status) {
            return response({
                status: 400,
                headers: { "Content-Type": "application/json" },
                body: { message: "appointmentId and status are required." }
            });
        }

        // In a real application, you would query the Appointments collection
        // find the appointment by ID and update its status field.
        // For now, we'll simulate success.
        console.log(`Updating status for appointment ${appointmentId} to ${status}`);

        return response({
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: { success: true, message: "Appointment status updated (simulated)." }
        });
    } catch (error) {
        console.error("Error updating appointment status via HTTP Function:", error);
        return response({
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { message: "Failed to update appointment status." }
        });
    }
}