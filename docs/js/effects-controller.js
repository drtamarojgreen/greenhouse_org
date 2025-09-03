// --- Main Effects Controller ---

// This script runs after the DOM is fully loaded to ensure all elements are available.
document.addEventListener('DOMContentLoaded', () => {
    // Get references to all the interactive elements
    const heading = document.getElementById('effect-heading');
    const vineBtn = document.getElementById('btn-vine');
    const canBtn = document.getElementById('btn-can');
    const flareBtn = document.getElementById('btn-flare');
    const resetBtn = document.getElementById('btn-reset');

    // Basic check to ensure the HTML is set up correctly
    if (!heading || !vineBtn || !canBtn || !flareBtn || !resetBtn) {
        console.error("Controller Error: One or more essential HTML elements are missing.");
        return;
    }

    // Store the original, clean text of the heading.
    const originalHeadingText = heading.textContent;

    // --- Central Reset Function ---
    // This function is crucial to ensure a clean state before activating a new effect.
    function deactivateAllEffects() {
        console.log("Deactivating all effects...");

        // Call the specific deactivation functions from the other JS files
        if (typeof deactivateVineEffect === 'function') {
            deactivateVineEffect();
        }
        if (typeof deactivateWateringCanEffect === 'function') {
            deactivateWateringCanEffect();
        }

        // Remove any classes from the body and heading that activate effects
        document.body.className = '';
        heading.className = '';
        
        // Restore the heading's original text content, as some effects modify it
        heading.textContent = originalHeadingText;
    }

    // --- Event Listeners for Buttons ---

    vineBtn.addEventListener('click', () => {
        deactivateAllEffects();
        console.log("Activating Vine Effect...");
        document.body.classList.add('vine-effect-active');
        if (typeof activateVineEffect === 'function') {
            activateVineEffect();
        }
    });

    canBtn.addEventListener('click', () => {
        deactivateAllEffects();
        console.log("Activating Watering Can Effect...");
        document.body.classList.add('can-effect-active');
        if (typeof activateWateringCanEffect === 'function') {
            activateWateringCanEffect();
        }
    });

    flareBtn.addEventListener('click', () => {
        deactivateAllEffects();
        console.log("Activating Sunlight Flare Effect...");
        // This effect is CSS-only and is triggered by a class directly on the heading.
        heading.classList.add('flare-effect-active');
    });

    resetBtn.addEventListener('click', () => {
        console.log("Resetting all effects.");
        deactivateAllEffects();
    });
});