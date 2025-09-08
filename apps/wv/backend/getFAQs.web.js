import wixData from 'wix-data'; // Assuming real data access later
import { response } from 'wix-http-functions';

/**
 * HTTP GET function to retrieve FAQs.
 * Endpoint: /_functions/getFAQs
 * Note: Currently returns hardcoded data.
 */
export async function get(request) {
    try {
        // Hardcoded data (as in original .jsw)
        const faqs = [
            { id: "1", question: "What technology powers the Greenhouse Mental Health website?", answer: "Our public-facing website is built on a robust technology stack including Wix, JavaScript, HTML/CSS for the frontend, and Wix Velo with Node.js for custom backend logic. We utilize Wix Data Collections and Firebase for secure data storage." },
            { id: "2", question: "How does Greenhouse Mental Health ensure data privacy and security for its online services?", answer: "We prioritize data privacy and security by implementing measures such as data encryption in transit and at rest, regular security audits, and adherence to industry best practices for web application security. Our systems are designed to protect all public interactions." },
            { id: "3", question: "Can I schedule appointments or access resources through the website's online services?", answer: "Yes, our online services enable online scheduling and appointment management for public services. We also provide access to a wide range of educational content, interactive tools, and community resources through our digital outreach initiatives." },
            { id: "4", question: "What are the core principles guiding Greenhouse Mental Health's technology development?", answer: "Our technology development is guided by User-Centricity, ensuring a seamless experience; Security, upholding high standards of data integrity; Accessibility, providing intuitive and inclusive digital experiences; and Continuous Improvement, fostering ongoing technological advancement." }
        ];

        return response({
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: { items: faqs }
        });
    } catch (error) {
        console.error("Error fetching FAQs via HTTP Function:", error);
        return response({
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { message: "Failed to retrieve FAQs." }
        });
    }
}
