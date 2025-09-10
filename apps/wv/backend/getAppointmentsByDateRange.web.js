import wixData from 'wix-data';
import { response } from 'wix-http-functions';

/**
 * HTTP GET function to retrieve appointments for a specific therapist within a date range.
 * Endpoint: /_functions/getAppointmentsByDateRange?startDate={startDate}&endDate={endDate}&therapistId={therapistId}
 */
export async function get(request) {
    try {
        const { startDate, endDate, therapistId } = request.query;

        if (!startDate || !endDate || !therapistId) {
            return response({
                status: 400,
                headers: { "Content-Type": "application/json" },
                body: { message: "startDate, endDate, and therapistId are required query parameters." }
            });
        }

        // Build the query
        const query = wixData.query("Appointments")
            .eq("therapistId", therapistId)
            .ge("startDate", new Date(startDate))
            .le("startDate", new Date(endDate)); // Changed 'end' to 'startDate' for more accurate daily view

        const results = await query.find();

        return response({
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: { items: results.items }
        });
    } catch (error) {
        console.error("Error fetching appointments by date range via HTTP Function:", error);
        return response({
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { message: "Failed to retrieve appointments by date range." }
        });
    }
}
