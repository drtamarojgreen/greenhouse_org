import wixData from 'wix-data'; // Assuming real data access later
import { response } from 'wix-http-functions';

/**
 * HTTP GET function to retrieve events.
 * Endpoint: /_functions/getEvents?category={category}
 * Note: Currently returns hardcoded data.
 */
export async function get(request) {
    try {
        const categoryFilter = request.query.category;

        // Hardcoded data (as in original .jsw)
        const events = [
            { id: "1", title: "Mindfulness Meditation Workshop", date: "2023-11-10T14:00:00Z", location: "Online (Zoom)", description: "Join our expert-led workshop to learn practical mindfulness techniques for stress reduction.", category: "Workshop", tags: ["mindfulness", "meditation", "stress"] },
            { id: "2", title: "Understanding Anxiety: A Community Talk", date: "2023-11-15T18:30:00Z", location: "Community Center Hall", description: "A free community talk on understanding and managing anxiety, open to all.", category: "Community Event", tags: ["anxiety", "community", "education"] },
            { id: "3", title: "Support Group for Caregivers", date: "2023-11-22T10:00:00Z", location: "Online (Google Meet)", description: "A weekly support group providing a safe space for caregivers of individuals with mental health challenges.", category: "Support Group", tags: ["caregivers", "support", "group"] }
        ];

        let filteredEvents = events;
        if (categoryFilter) {
            filteredEvents = filteredEvents.filter(event => event.category === categoryFilter);
        }

        return response({
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: { items: filteredEvents }
        });
    } catch (error) {
        console.error("Error fetching events via HTTP Function:", error);
        return response({
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { message: "Failed to retrieve events." }
        });
    }
}
