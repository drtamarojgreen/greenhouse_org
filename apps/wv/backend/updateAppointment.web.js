import wixData from 'wix-data';
import { response } from 'wix-http-functions';

/**
 * HTTP PUT function to update an existing appointment.
 * Endpoint: /_function/updateAppointment/{appointmentId}
 */
export async function put(request) {
    try {
        const appointmentId = request.path[0]; // Get appointmentId from path
        const updatedData = await request.body.json(); // Get JSON body from request

        if (!appointmentId) {
            return response({
                status: 400,
                headers: { "Content-Type": "application/json" },
                body: { message: "Appointment ID is required." }
            });
        }

        // Query for the appointment by its _id
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

        const appointmentToUpdate = results.items[0];
        const updatedAppointment = await wixData.update("Appointments", { ...appointmentToUpdate, ...updatedData });

        return response({
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: updatedAppointment
        });
    } catch (error) {
        console.error("Error updating appointment via HTTP Function:", error);
        return response({
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { message: "Failed to update appointment." }
        });
    }
}
