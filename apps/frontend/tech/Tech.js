/**
 * @file Velo page code for the /tech page (Frontend-Only).
 * @description This script runs on the /tech page in the Wix editor. It generates mock data
 * directly and passes it to the client-side application (docs/js/tech.js) via a hidden
 * text element. This version has no backend dependencies.
 */

$w.onReady(function () {
    console.log("Tech Page Velo Code (Frontend-Only): Page is ready.");

    try {
        // 1. Define a function to generate mock data locally.
        const getMockUserData = () => {
            return {
                userId: "test-frontend-123",
                role: "admin",
                preferences: { theme: "dark" },
                source: "Generated directly in Velo Page Code"
            };
        };

        const mockUserData = getMockUserData();
        console.log("Tech Page Velo Code: Generated mock user data locally.", mockUserData);

        // 2. Prepare the initial configuration object to be passed to the client-side script.
        const initialData = {
            source: "Velo Page Code (Frontend-Only)",
            timestamp: new Date().toISOString(),
            configMessage: "This data was populated by the page's Velo code without a backend call.",
            userData: mockUserData
        };

        // 3. Find the hidden text element and populate it with the stringified JSON data.
        const dataElement = $w('#dataTextElement');
        if (dataElement) {
            dataElement.text = JSON.stringify(initialData, null, 2);
            console.log("Tech Page Velo Code: Successfully populated #dataTextElement.");
        } else {
            console.error("Tech Page Velo Code: Critical error - #dataTextElement not found on the page.");
        }

        // 4. Apply tech-themed text to text boxes within the 'techAboutStrip'
        const techAboutStrip = $w("#techAboutStrip");
        if (techAboutStrip) {
            const textElements = techAboutStrip.children.filter(child => child.type === '$w.Text');
            textElements.forEach(textElement => {
                textElement.text = "Our technology stack is built on a foundation of robust and scalable solutions. We leverage cutting-edge frameworks and cloud infrastructure to deliver a seamless user experience. Our team is passionate about innovation and dedicated to building the future of mental healthcare technology.";
            });
            console.log("Tech Page Velo Code: Applied tech-themed text to text boxes in #techAboutStrip.");
        } else {
            console.warn("Tech Page Velo Code: #techAboutStrip not found. Could not apply tech-themed text.");
        }

    } catch (error) {
        console.error("Tech Page Velo Code: An error occurred while initializing the page.", error);

        // Populate the data element with error information if something goes wrong
        const dataElement = $w('#dataTextElement');
        if (dataElement) {
            dataElement.text = JSON.stringify({
                error: "Failed to generate mock data in Velo page code.",
                errorMessage: error.message
            });
        }
    }
});
