import wixData from 'wix-data';
import { response } from 'wix-http-functions';

/**
 * HTTP DELETE function to delete an appointment.
 * Endpoint: /_functions/deleteAppointment/{appointmentId}
 */
export async function del(request) { // 'del' is the function name for DELETE requests
    try {
        const appointmentId = request.path[0]; // Get appointmentId from path

        if (!appointmentId) {
            return response({
                status: 400,
                headers: { "Content-Type": "application/json" },
                body: { message: "Appointment ID is required." }
            });
        }

        // Check if the appointment exists before attempting to delete
        const results = await wixData.query("Appointments")
                                .eq("_id", appointmentId)
                                .find();

        if (results.items.length === 0) {
            return response({
                status: 404,
                headers: { "Content-Type": "application/json" },
                body: { message: "Appointment not found." }
            });
        }

        await wixData.remove("Appointments", appointmentId);

        return response({
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: { message: `Appointment ${appointmentId} deleted successfully.` }
        });
    } catch (error) {
        console.error("Error deleting appointment via HTTP Function:", error);
        return response({
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { message: "Failed to delete appointment." }
        });
    }
}
