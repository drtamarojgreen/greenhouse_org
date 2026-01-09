// docs/js/synapse.js
// Loader for Synapse Simulation Application

(async function () {
    'use strict';
    console.log('Synapse App: Loader execution started.');

    let GreenhouseUtils;

    // Function to wait for GreenhouseUtils to be available on the window object.
    const loadDependencies = async () => {
        console.log('Synapse App: loadDependencies started.');
        await new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 240; // 12 seconds timeout
            const interval = setInterval(() => {
                if (window.GreenhouseUtils) {
                    clearInterval(interval);
                    GreenhouseUtils = window.GreenhouseUtils;
                    resolve();
                } else if (attempts++ >= maxAttempts) {
                    clearInterval(interval);
                    console.error('Synapse App: GreenhouseUtils not available after 12 second timeout.');
                    reject(new Error('GreenhouseUtils load timeout'));
                }
            }, 50);
        });
        console.log('Synapse App: GreenhouseUtils loaded.');
    };

    // Function to capture necessary attributes from the script tag.
    const captureScriptAttributes = () => {
        // greenhouse.js passes attributes via loadScript, which adds them to the script tag.
        // We find our own script tag to read them.
        const scripts = document.querySelectorAll('script[src*="synapse.js"]');
        if (scripts.length > 0) {
            const script = scripts[scripts.length - 1];
            window._greenhouseSynapseAttributes = {
                baseUrl: script.getAttribute('data-base-url'),
                targetSelector: script.getAttribute('data-target-selector-left')
            };
            return true;
        }
        console.error('Synapse App: Could not find current script element to capture attributes.');
        return false;
    };

    async function main() {
        console.log('Synapse App: main() started.');
        try {
            if (!captureScriptAttributes()) {
                throw new Error("Could not capture script attributes.");
            }

            await loadDependencies();
            if (!GreenhouseUtils) {
                throw new Error("CRITICAL - Aborting main() due to missing GreenhouseUtils.");
            }

            const { baseUrl, targetSelector } = window._greenhouseSynapseAttributes;
            if (!baseUrl) {
                throw new Error("CRITICAL - Aborting main() due to missing data-base-url attribute.");
            }
            if (!targetSelector) {
                throw new Error("CRITICAL - Aborting main() due to missing target selector.");
            }

            // Load the modules required for the synapse application
            await GreenhouseUtils.loadScript('models_3d_math.js', baseUrl);
            // In the future, we would load more synapse-specific modules here, like camera controls, geometry, etc.
            await GreenhouseUtils.loadScript('synapse_app.js', baseUrl);

            // Check if all modules are loaded
            if (window.GreenhouseSynapseApp) {
                console.log('Synapse App: All modules loaded successfully.');
                // Initialize the application
                console.log('Synapse App: Initializing in 5 seconds...');
                setTimeout(() => {
                    window.GreenhouseSynapseApp.init(targetSelector);
                }, 5000);
            } else {
                throw new Error("Synapse application module failed to load.");
            }

        } catch (error) {
            console.error('Synapse App: Initialization failed:', error);
            if (GreenhouseUtils) {
                GreenhouseUtils.displayError(`Failed to load synapse components: ${error.message}`);
            }
        }
    }

    // --- Main Execution Logic ---
    main();

})();
