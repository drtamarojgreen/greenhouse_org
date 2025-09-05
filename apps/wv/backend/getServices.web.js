import wixData from 'wix-data';
import { response } from 'wix-http-functions';

/**
 * HTTP GET function to retrieve all services from the "Services" collection.
 * Endpoint: /_api/getServices
 */
export async function get(request) {
    try {
        const results = await wixData.query("Services").find();
        return response({
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: { items: results.items.map(item => ({ id: item._id, name: item.name })) }
        });
    } catch (error) {
        console.error("Error fetching services via HTTP Function:", error);
        return response({
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { message: "Failed to retrieve services." }
        });
    }
}