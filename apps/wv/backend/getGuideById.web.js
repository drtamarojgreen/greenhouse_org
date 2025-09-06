import wixData from 'wix-data'; // Assuming real data access later
import { response } from 'wix-http-functions';

/**
 * HTTP GET function to retrieve a guide by its ID.
 * Endpoint: /_api/getGuideById/{guideId}
 * Note: Currently searches hardcoded data.
 */
export async function get(request) {
    try {
        const guideId = request.path[0]; // Get guideId from path

        if (!guideId) {
            return response({
                status: 400,
                headers: { "Content-Type": "application/json" },
                body: { message: "Guide ID is required." }
            });
        }

        // Hardcoded data (as in original .jsw)
        const guides = [
            { id: "1", title: "Dr. Green's Greenhouse for Mental Health Development Report", description: "A comprehensive report on the development of Greenhouse for Mental Health by Dr. Green.", fileUrl: "/assets/Dr Greens Greenhouse for Mental Health Development Report.pdf", category: "Reports", tags: ["report", "development", "Dr. Green"] },
            { id: "2", title: "End of Year 2024 Report: Mental Health Advocacy and Awareness", description: "An end-of-year report detailing mental health advocacy and awareness initiatives in 2024.", fileUrl: "/assets/End of Year 2024 Report_ Mental Health Advocacy and Awareness.pdf", category: "Reports", tags: ["report", "advocacy", "awareness", "2024"] },
            { id: "3", title: "Greenhouse for Mental Health Development YouTube Channel Report", description: "A report on the performance and content of the Greenhouse for Mental Health Development YouTube Channel.", fileUrl: "/assets/Greenhouse for Mental Health Development YouTube Channel Report.pdf", category: "Reports", tags: ["report", "YouTube", "channel", "media"] }
        ];

        const foundGuide = guides.find(guide => guide.id === guideId);

        if (foundGuide) {
            return response({
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: foundGuide
            });
        } else {
            return response({
                status: 404,
                headers: { "Content-Type": "application/json" },
                body: { message: "Guide not found." }
            });
        }
    } catch (error) {
        console.error("Error fetching guide by ID via HTTP Function:", error);
        return response({
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { message: "Failed to retrieve guide." }
        });
    }
}