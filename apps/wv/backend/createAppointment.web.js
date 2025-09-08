import wixData from 'wix-data';
import { response } from 'wix-http-functions';

/**
 * HTTP POST function to create a new appointment.
 * Endpoint: /_functions/createAppointment
 */
export async function post(request) {
    try {
        const appointmentData = await request.body.json(); // Get JSON body from request

        // Assuming 'appointmentData' object already contains necessary fields like title, start, end, serviceRef, etc.
        const insertedAppointment = await wixData.insert("Appointments", appointmentData);

        return response({
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: insertedAppointment
        });
    } catch (error) {
        console.error("Error creating appointment via HTTP Function:", error);
        return response({
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { message: "Failed to create appointment." }
        });
    }
}
