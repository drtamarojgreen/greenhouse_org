// docs/js/pathway.js
// Loader for Pathway Simulation Application

(async function () {
    'use strict';
    console.log('Pathway App: Loader execution started.');

    let GreenhouseUtils;

    // Function to wait for GreenhouseUtils to be available on the window object.
    const loadDependencies = async () => {
        console.log('Pathway App: loadDependencies started.');
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
                    console.error('Pathway App: GreenhouseUtils not available after 12 second timeout.');
                    reject(new Error('GreenhouseUtils load timeout'));
                }
            }, 50);
        });
        console.log('Pathway App: GreenhouseUtils loaded.');
    };

    // Function to capture necessary attributes from the script tag.
    const captureScriptAttributes = () => {
        const scripts = document.querySelectorAll('script[src*="pathway.js"]');
        if (scripts.length > 0) {
            const script = scripts[scripts.length - 1];
            window._greenhousePathwayAttributes = {
                baseUrl: script.getAttribute('data-base-url'),
                targetSelector: script.getAttribute('data-target-selector-left')
            };
            return true;
        }
        console.error('Pathway App: Could not find current script element to capture attributes.');
        return false;
    };

    async function main() {
        console.log('Pathway App: main() started.');
        try {
            if (!captureScriptAttributes()) {
                throw new Error("Could not capture script attributes.");
            }

            await loadDependencies();
            if (!GreenhouseUtils) {
                throw new Error("CRITICAL - Aborting main() due to missing GreenhouseUtils.");
            }

            const { baseUrl, targetSelector } = window._greenhousePathwayAttributes;
            if (!baseUrl) {
                throw new Error("CRITICAL - Aborting main() due to missing data-base-url attribute.");
            }
            if (!targetSelector) {
                throw new Error("CRITICAL - Aborting main() due to missing target selector.");
            }

            // Load the modules required for the pathway application
            await GreenhouseUtils.loadScript('models_3d_math.js', baseUrl);
            await GreenhouseUtils.loadScript('pathway_app.js', baseUrl);

            // Check if all modules are loaded
            if (window.GreenhousePathwayApp) {
                console.log('Pathway App: All modules loaded successfully.');
                // Initialize the application
                window.GreenhousePathwayApp.init(targetSelector);
            } else {
                throw new Error("Pathway application module failed to load.");
            }

        } catch (error) {
            console.error('Pathway App: Initialization failed:', error);
            if (GreenhouseUtils) {
                GreenhouseUtils.displayError(`Failed to load pathway components: ${error.message}`);
            }
        }
    }

    // --- Main Execution Logic ---
    main();

})();
