import wixData from 'wix-data';
import { response } from 'wix-http-functions';

/**
 * HTTP GET function to retrieve scheduling conflicts for a given date range.
 * Endpoint: /_functions/getConflictsForDateRange?startDate={startDate}&endDate={endDate}
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

        const queryStartDate = new Date(startDate);
        const queryEndDate = new Date(endDate);

        // Query existing appointments within the specified date range
        const results = await wixData.query("Appointments")
                                .ge("start", queryStartDate)
                                .le("end", queryEndDate)
                                .find();

        return response({
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: { items: results.items }
        });
    } catch (error) {
        console.error("Error fetching conflicts for date range via HTTP Function:", error);
        return response({
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { message: "Failed to retrieve conflicts for date range." }
        });
    }
}
