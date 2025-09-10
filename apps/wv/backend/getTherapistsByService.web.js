import wixData from 'wix-data';
import { response } from 'wix-http-functions';

/**
 * HTTP GET function to retrieve therapists for a specific service.
 * Endpoint: /_functions/getTherapistsByService?serviceId={serviceId}
 */
export async function get(request) {
    try {
        const serviceId = request.query.serviceId;

        if (!serviceId) {
            return response({
                status: 400,
                headers: { "Content-Type": "application/json" },
                body: { message: "serviceId is a required query parameter." }
            });
        }

        // Query therapists that have a reference to the given serviceId.
        // This assumes the "Therapists" collection has a multi-reference field
        // named "services" that links to the "Services" collection.
        const results = await wixData.query("Therapists")
                                .hasSome("services", serviceId)
                                .find();

        return response({
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: { therapists: results.items }
        });
    } catch (error) {
        console.error("Error fetching therapists by service via HTTP Function:", error);
        return response({
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { message: "Failed to retrieve therapists." }
        });
    }
}
