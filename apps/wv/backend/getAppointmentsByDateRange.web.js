import wixData from 'wix-data';
import { response } from 'wix-http-functions';

/**
 * HTTP GET function to retrieve appointments within a specific date range.
 * Endpoint: /_api/getAppointmentsByDateRange?startDate={startDate}&endDate={endDate}
 */
export async function get(request) {
    try {
        const startDate = request.query.startDate;
        const endDate = request.query.endDate;

        if (!startDate || !endDate) {
            return response({
                status: 400,
                headers: { "Content-Type": "application/json" },
                body: { message: "startDate and endDate are required query parameters." }
            });
        }

        // Query appointments within the date range
        const results = await wixData.query("Appointments")
                                .ge("start", new Date(startDate))
                                .le("end", new Date(endDate))
                                .find();

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