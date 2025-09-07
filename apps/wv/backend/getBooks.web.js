import { response } from 'wix-http-functions';

const bookData = [
    {
        title: "The Body Keeps the Score: Brain, Mind, and Body in the Healing of Trauma",
        author: "Bessel van der Kolk M.D.",
        url: "#"
    },
    {
        title: "Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones",
        author: "James Clear",
        url: "#"
    },
    {
        title: "Daring Greatly: How the Courage to Be Vulnerable Transforms the Way We Live, Love, Parent, and Lead",
        author: "Brené Brown",
        url: "#"
    }
];

export function get_getBooks(request) {
    try {
        return response({
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: { items: bookData }
        });
    } catch (error) {
        console.error("Error fetching books via HTTP Function:", error);
        return response({
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { message: "Failed to retrieve books." }
        });
    }
}
