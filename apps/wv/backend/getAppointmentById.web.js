import wixData from 'wix-data';
import { response } from 'wix-http-functions';

/**
 * HTTP GET function to retrieve an appointment by its ID.
 * Endpoint: /_function/getAppointmentById/{appointmentId}
 */
export async function get(request) {
    try {
        const appointmentId = request.path[0]; // Get appointmentId from path

        if (!appointmentId) {
            return response({
                status: 400,
                headers: { "Content-Type": "application/json" },
                body: { message: "Appointment ID is required." }
            });
        }

        const appointment = await wixData.get("Appointments", appointmentId);

        if (appointment) {
            return response({
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: appointment
            });
        } else {
            return response({
                status: 404,
                headers: { "Content-Type": "application/json" },
                body: { message: "Appointment not found." }
            });
        }
    } catch (error) {
        console.error("Error fetching appointment by ID via HTTP Function:", error);
        return response({
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { message: "Failed to retrieve appointment." }
        });
    }
}
