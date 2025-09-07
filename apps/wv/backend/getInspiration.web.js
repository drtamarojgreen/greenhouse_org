
import { response } from 'wix-http-functions';

const quotes = [
    {
        text: "The best way to predict the future is to create it.",
        author: "Peter Drucker"
    },
    {
        text: "You miss 100% of the shots you don’t take.",
        author: "Wayne Gretzky"
    },
    {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs"
    },
    {
        text: "Believe you can and you're halfway there.",
        author: "Theodore Roosevelt"
    }
];

export function get_getInspiration(request) {
    try {
        return response({
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: { items: quotes }
        });
    } catch (error) {
        console.error("Error fetching inspiration quotes via HTTP Function:", error);
        return response({
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { message: "Failed to retrieve inspiration quotes." }
        });
    }
}
