import wixData from 'wix-data'; // Assuming real data access later
import { response } from 'wix-http-functions';

/**
 * HTTP GET function to retrieve an event by its ID.
 * Endpoint: /_function/getEventById/{eventId}
 * Note: Currently searches hardcoded data.
 */
export async function get(request) {
    try {
        const eventId = request.path[0]; // Get eventId from path

        if (!eventId) {
            return response({
                status: 400,
                headers: { "Content-Type": "application/json" },
                body: { message: "Event ID is required." }
            });
        }

        // Hardcoded data (as in original .jsw)
        const events = [
            { id: "1", title: "Mindfulness Meditation Workshop", date: "2023-11-10T14:00:00Z", location: "Online (Zoom)", description: "Join our expert-led workshop to learn practical mindfulness techniques for stress reduction.", category: "Workshop", tags: ["mindfulness", "meditation", "stress"] },
            { id: "2", title: "Understanding Anxiety: A Community Talk", date: "2023-11-15T18:30:00Z", location: "Community Center Hall", description: "A free community talk on understanding and managing anxiety, open to all.", category: "Community Event", tags: ["anxiety", "community", "education"] },
            { id: "3", title: "Support Group for Caregivers", date: "2023-11-22T10:00:00Z", location: "Online (Google Meet)", description: "A weekly support group providing a safe space for caregivers of individuals with mental health challenges.", category: "Support Group", tags: ["caregivers", "support", "group"] }
        ];

        const foundEvent = events.find(event => event.id === eventId);

        if (foundEvent) {
            return response({
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: foundEvent
            });
        } else {
            return response({
                status: 404,
                headers: { "Content-Type": "application/json" },
                body: { message: "Event not found." }
            });
        }
    } catch (error) {
        console.error("Error fetching event by ID via HTTP Function:", error);
        return response({
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { message: "Failed to retrieve event." }
        });
    }
}
