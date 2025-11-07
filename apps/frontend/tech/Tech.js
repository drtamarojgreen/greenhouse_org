/**
 * @file Velo page code for the /tech page (Frontend-Only).
 * @description This script runs on the /tech page. It populates the page with initial data
 * for the client-side application and sets promotional text content.
 */

$w.onReady(function () {
    console.log("Tech Page Velo Code: Page is ready.");

    try {
        // --- 1. Prepare Initial Data for Client-Side App ---
        const initialData = {
            source: "Velo Page Code",
            timestamp: new Date().toISOString(),
            configMessage: "This data was populated by the page's Velo code."
        };

        const dataElement = $w('#dataTextElement');
        if (dataElement) {
            dataElement.text = JSON.stringify(initialData);
            console.log("Tech Page Velo Code: Successfully populated #dataTextElement.");
        } else {
            console.error("Tech Page Velo Code: Critical error - #dataTextElement not found.");
        }

        // --- 2. Populate Promotional Text Fields ---
        // NOTE: Replace #promoText1, #promoText2, etc., with the actual IDs of the text
        // elements from the Wix Editor's properties panel.

        const promoTexts = [
            {
                id: "#promoText1", // First text element ID
                text: "**Component Testing Sandbox:** Interactively test client-side JavaScript modules, from utility functions to complex UI components, in a controlled and isolated environment."
            },
            {
                id: "#promoText2", // Second text element ID
                text: "**Velo Backend Simulation:** Develop and debug frontend logic with predictable mock data served directly from the page's Velo code, eliminating the need for a live backend."
            },
            {
                id: "#promoText3", // Third text element ID
                text: "**Dynamic Module Loading:** Verify the seamless integration of dynamically loaded applications, such as the Models Prototype, ensuring all dependencies are met and execution is flawless."
            },
            {
                id: "#promoText4", // Fourth text element ID
                text: "**Live DOM Interaction:** Safely manipulate and inspect the live page structure, perfect for developing DOM-sensitive utilities and ensuring compatibility with the Wix platform."
            }
        ];

        let populatedCount = 0;
        promoTexts.forEach(promo => {
            const textEl = $w(promo.id);
            if (textEl) {
                textEl.html = `<p>${promo.text}</p>`; // Use .html to support Markdown-like bolding
                populatedCount++;
            } else {
                console.warn(`Tech Page Velo Code: Could not find text element with ID: ${promo.id}`);
            }
        });

        if (populatedCount > 0) {
            console.log(`Tech Page Velo Code: Successfully populated ${populatedCount} promotional text fields.`);
        }

    } catch (error) {
        console.error("Tech Page Velo Code: An error occurred during page initialization.", error);
        const dataElement = $w('#dataTextElement');
        if (dataElement) {
            dataElement.text = JSON.stringify({ error: "Velo code initialization failed." });
        }
    }
});
