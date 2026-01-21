// docs/js/synapse.js
// Loader for Synapse Simulation Application
// Modeled after live site master loaders (serotonin.js, rna_repair.js)

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
        // Priority 1: Check global attributes object (set by GreenhouseUtils)
        if (window._greenhouseScriptAttributes) {
            console.log('Synapse App: Using global script attributes.');
            window._greenhouseSynapseAttributes = {
                baseUrl: window._greenhouseScriptAttributes['base-url'],
                targetSelector: window._greenhouseScriptAttributes['target-selector-left']
            };
            delete window._greenhouseScriptAttributes; // Clean up
            return true;
        }

        // Priority 2: Fallback to DOM inspection (e.g. for synapse.html testing)
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

            // Sequential loading of all modular components
            await GreenhouseUtils.loadScript('synapse_chemistry.js', baseUrl);
            await GreenhouseUtils.loadScript('synapse_neurotransmitters.js', baseUrl);
            await GreenhouseUtils.loadScript('synapse_sidebar.js', baseUrl);
            await GreenhouseUtils.loadScript('synapse_tooltips.js', baseUrl);
            await GreenhouseUtils.loadScript('synapse_controls.js', baseUrl);
            await GreenhouseUtils.loadScript('synapse_analytics.js', baseUrl);
            await GreenhouseUtils.loadScript('synapse_3d.js', baseUrl);
            await GreenhouseUtils.loadScript('synapse_molecular.js', baseUrl);
            await GreenhouseUtils.loadScript('synapse_app.js', baseUrl);

            // Check if all modules are loaded
            if (window.GreenhouseSynapseApp) {
                console.log('Synapse App: All modules loaded successfully.');

                if (targetSelector) {
                    console.log('Synapse App: Initializing in 5 seconds...');
                    setTimeout(() => {
                        window.GreenhouseSynapseApp.init(targetSelector, baseUrl);
                    }, 5000);
                } else {
                    console.warn('Synapse App: No target selector provided, skipping auto-init.');
                }
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
