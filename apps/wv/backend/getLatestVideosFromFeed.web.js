import wixData from 'wix-data'; // Assuming real data access later
import { response } from 'wix-http-functions';

/**
 * HTTP GET function to retrieve latest videos from a simulated YouTube RSS feed.
 * Endpoint: /_api/getLatestVideosFromFeed
 * Note: Currently returns hardcoded data.
 */
export async function get_getLatestVideosFromFeed(request) {
    try {
        // Hardcoded data (as in original .jsw)
        const simulatedFeedData = [
            { id: "video_rss_1", title: "Latest Insights on Mental Well-being", description: "A new video discussing recent findings in mental health and practical tips for daily well-being.", link: "https://www.youtube.com/watch?v=latest_video_id_1", published: "2023-11-01T12:00:00Z" },
            { id: "video_rss_2", title: "Quick Tips for Managing Stress", description: "Short and effective strategies to help you manage stress in your everyday life.", link: "https://www.youtube.com/watch?v=latest_video_id_2", published: "2023-10-28T15:30:00Z" },
            { id: "video_rss_3", title: "Understanding Emotional Resilience", description: "Explore what emotional resilience means and how you can cultivate it to navigate life's challenges.", link: "https://www.youtube.com/watch?v=latest_video_id_3", published: "2023-10-25T09:00:00Z" }
        ];

        return response({
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: { items: simulatedFeedData }
        });
    } catch (error) {
        console.error("Error fetching latest videos via HTTP Function:", error);
        return response({
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { message: "Failed to retrieve latest videos." }
        });
    }
}
