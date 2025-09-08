import { response } from 'wix-http-functions';

/**
 * Extracts the YouTube video ID from various URL formats.
 * @param {string} url The YouTube URL.
 * @returns {string|null} The video ID or null if not found.
 */
function getYouTubeVideoId(url) {
    if (!url) return null;
    let videoId = null;
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('youtube.com')) {
            videoId = urlObj.searchParams.get('v');
        } else if (urlObj.hostname.includes('youtu.be')) {
            videoId = urlObj.pathname.slice(1);
        } else if (urlObj.pathname.includes('/shorts/')) {
            const parts = urlObj.pathname.split('/');
            videoId = parts[parts.length - 1];
        }
    } catch (error) {
        // Fallback for non-standard or partial URLs
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/ ]{11})/;
        const match = url.match(regex);
        if (match) {
            videoId = match[1];
        }
    }
    return videoId;
}


/**
 * Processes a list of video feeds to create embeddable URLs.
 * @param {Array<Object>} feedData An array of video objects.
 * @returns {Array<Object>} The processed array with embedUrl.
 */
function processVideoFeeds(feedData) {
    return feedData.map(video => {
        const videoId = getYouTubeVideoId(video.link);
        const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : video.link;
        return {
            ...video,
            url: video.link, // Rename link to url for consistency
            embedUrl: embedUrl
        };
    });
}

/**
 * HTTP GET function to retrieve latest videos from a simulated YouTube RSS feed.
 * Endpoint: /_functions/getLatestVideosFromFeed
 * Note: Currently returns hardcoded data.
 */
export function get_getLatestVideosFromFeed(request) {
    try {
        // Hardcoded data with a mix of regular and shorts links
        const simulatedFeedData = [
            { id: "video_rss_1", title: "Latest Insights on Mental Well-being", description: "A new video discussing recent findings in mental health and practical tips for daily well-being.", link: "https://www.youtube.com/watch?v=latest_video_id_1", published: "2023-11-01T12:00:00Z" },
            { id: "video_rss_2", title: "Quick Tips for Managing Stress (Short)", description: "A short, digestible tip for stress management.", link: "https://www.youtube.com/shorts/short_video_id_2", published: "2023-10-29T10:00:00Z" },
            { id: "video_rss_3", title: "Quick Tips for Managing Stress", description: "Short and effective strategies to help you manage stress in your everyday life.", link: "https://www.youtube.com/watch?v=latest_video_id_2", published: "2023-10-28T15:30:00Z" },
            { id: "video_rss_4", title: "Understanding Emotional Resilience", description: "Explore what emotional resilience means and how you can cultivate it to navigate life's challenges.", link: "https://www.youtube.com/watch?v=latest_video_id_3", published: "2023-10-25T09:00:00Z" }
        ];

        const processedVideos = processVideoFeeds(simulatedFeedData);

        return response({
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: processedVideos // Return the processed array directly
        });

    } catch (error) {
        console.error("Error in getLatestVideosFromFeed:", error);
        return response({
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { message: "Failed to retrieve latest videos.", error: error.message }
        });
    }
}
