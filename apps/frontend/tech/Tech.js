/**
 * @file Velo page code for the /tech page (Frontend-Only).
 * @description This script's sole responsibility is to provide initial data to the
 * client-side application (docs/js/tech.js) via a hidden text element.
 */

$w.onReady(function () {
    console.log("Tech Page Velo Code: Page is ready.");
    try {
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
    } catch (error) {
        console.error("Tech Page Velo Code: An error occurred during page initialization.", error);
        const dataElement = $w('#dataTextElement');
        if (dataElement) {
            dataElement.text = JSON.stringify({ error: "Velo code initialization failed." });
        }
    }
});
