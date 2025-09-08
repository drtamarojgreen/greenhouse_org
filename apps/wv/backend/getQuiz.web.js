import wixData from 'wix-data'; // Assuming real data access later
import { response } from 'wix-http-functions';

/**
 * HTTP GET function to retrieve a quiz by its ID.
 * Endpoint: /_function/getQuiz/{quizId}
 * Note: Currently searches hardcoded data.
 */
export async function get(request) {
    try {
        const quizId = request.path[0]; // Get quizId from path

        if (!quizId) {
            return response({
                status: 400,
                headers: { "Content-Type": "application/json" },
                body: { message: "Quiz ID is required." }
            });
        }

        // Hardcoded data (as in original .jsw)
        const quizzes = {
            "mental-health-check": {
                id: "mental-health-check",
                title: "Quick Mental Health Check-in",
                description: "A short quiz to help you reflect on your current mental well-being.",
                questions: [
                    { id: "q1", text: "Over the last two weeks, how often have you felt down, depressed, or hopeless?", options: [{ text: "Not at all", value: 0 }, { text: "Several days", value: 1 }, { text: "More than half the days", value: 2 }, { text: "Nearly every day", value: 3 }] },
                    { id: "q2", text: "Over the last two weeks, how often have you had little interest or pleasure in doing things?", options: [{ text: "Not at all", value: 0 }, { text: "Several days", value: 1 }, { text: "More than half the days", value: 2 }, { text: "Nearly every day", value: 3 }] }
                ],
                getScore: (answers) => {
                    let score = 0;
                    for (const qId in answers) { score += answers[qId]; }
                    return score;
                },
                getFeedback: (score) => {
                    if (score <= 1) return "You seem to be doing well. Keep up healthy habits!";
                    if (score <= 3) return "You might be experiencing some mild symptoms. Consider exploring our resources.";
                    return "It sounds like you're going through a tough time. We recommend reaching out to a professional.";
                }
            }
        };

        const foundQuiz = quizzes[quizId];

        if (foundQuiz) {
            // Remove functions before sending as JSON
            const { getScore, getFeedback, ...quizData } = foundQuiz;
            return response({
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: quizData
            });
        } else {
            return response({
                status: 404,
                headers: { "Content-Type": "application/json" },
                body: { message: "Quiz not found." }
            });
        }
    } catch (error) {
        console.error("Error fetching quiz by ID via HTTP Function:", error);
        return response({
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { message: "Failed to retrieve quiz." }
        });
    }
}
