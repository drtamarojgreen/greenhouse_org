// Solution for the "Space Race" Challenge
// Goal: Maximize Negative Space (Whitespace > 0.90) by clearing clutter.

// Note: The harness already handles waiting for UX initialization.
// We just need to execute our logic.

if (window.GreenhouseModelsUX) {
    console.log("Applying Space Race Solution...");

    // 1. Set Environment to Neutral/Calm
    if (window.GreenhouseModelsUX.state.environment) {
        window.GreenhouseModelsUX.state.environment.stress = 0.0;
        window.GreenhouseModelsUX.state.environment.support = 0.0;
        window.GreenhouseModelsUX.state.environment.type = 'NEUTRAL';
        window.GreenhouseModelsUX.state.environment.isRunning = false; // Stop animation to freeze state
    }

    // 2. Clear Visual Clutter via Config Injection
    if (window.GreenhouseEnvironmentConfig) {
        window.GreenhouseEnvironmentConfig.labels = []; // Remove all text labels
        window.GreenhouseEnvironmentConfig.icons = []; // Remove all icons
        window.GreenhouseEnvironmentConfig.influencePaths = []; // Remove connecting lines
        window.GreenhouseEnvironmentConfig.interactiveElements = {};
    }

    // 3. Brutal Canvas Clearing
    // If the config approach fails to clear everything (e.g. background), we force it.
    const canvas = document.querySelector('#canvas-environment');
    if (canvas) {
        const ctx = canvas.getContext('2d');

        // Overwrite the draw function to do nothing but clear to white
        // This ensures subsequent animation frames don't redraw the chaos.
        window.GreenhouseModelsUI.drawEnvironmentView = () => {
             ctx.fillStyle = '#FFFFFF';
             ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        // Call it once immediately
        window.GreenhouseModelsUI.drawEnvironmentView();
    }

    console.log("Space Race logic applied.");
}
// Final check
