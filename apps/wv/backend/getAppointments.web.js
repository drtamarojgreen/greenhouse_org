// Version: 0.0.0.1
import wixData from 'wix-data';
import { response } from 'wix-http-functions';

console.log("Loading getAppointments.web.js - Version 0.0.0.1");

/**
 * HTTP GET function to retrieve all appointments from the "Appointments" collection.
 * Endpoint: /_functions/getAppointments
 */
export async function get(request) {
    try {
        const results = await wixData.query("Appointments").find();
        return response({
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: { items: results.items }
        });
    } catch (error) {
        console.error("Error fetching appointments via HTTP Function:", error);
        return response({
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { message: "Failed to retrieve appointments." }
        });
    }
}
