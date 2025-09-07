
import { response } from 'wix-http-functions';

const newsData = [
    {
        title: "New Study on Mindfulness and Anxiety",
        source: "Journal of Mental Health",
        date: "2025-09-05",
        url: "#"
    },
    {
        title: "The Impact of Social Media on Teen Mental Health",
        source: "Mental Health Today",
        date: "2025-09-04",
        url: "#"
    },
    {
        title: "Research Finds Strong Link Between Exercise and Reduced Depression",
        source: "Science Daily",
        date: "2025-09-02",
        url: "#"
    }
];

export function get_getNews(request) {
    try {
        return response({
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: { items: newsData }
        });
    } catch (error) {
        console.error("Error fetching news via HTTP Function:", error);
        return response({
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { message: "Failed to retrieve news." }
        });
    }
}
