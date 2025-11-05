// docs/js/models.js

(async function() {
    'use strict';
    console.log('Models App: Loader execution started.');

    let GreenhouseUtils;

    const loadDependencies = async () => {
        console.log('Models App: loadDependencies started.');
        if (window.GreenhouseDependencyManager) {
            try {
                await window.GreenhouseDependencyManager.waitFor('utils', 12000);
                console.log('Models App: GreenhouseUtils loaded via dependency manager');
            } catch (error) {
                console.error('Models App: Failed to load GreenhouseUtils via dependency manager:', error.message);
            }
        } else {
            // Fallback to a polling mechanism if the dependency manager is not available
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 240; // 12 seconds
                const interval = setInterval(() => {
                    if (window.GreenhouseUtils) {
                        clearInterval(interval);
                        resolve();
                    } else if (attempts++ >= maxAttempts) {
                        clearInterval(interval);
                        console.error('Models App: GreenhouseUtils not available after 12 second timeout');
                        reject(new Error('GreenhouseUtils load timeout'));
                    }
                }, 50);
            });
        }
        GreenhouseUtils = window.GreenhouseUtils;
    };

    const captureScriptAttributes = () => {
        if (window._greenhouseModelsAttributes) {
            console.log('Models App: Using pre-defined attributes.');
            return true;
        }
        const scriptElement = document.currentScript;
        if (!scriptElement) {
            console.error('Models App: Could not find current script element to capture attributes.');
            return false;
        }
        window._greenhouseModelsAttributes = {
            baseUrl: scriptElement.getAttribute('data-base-url'),
            targetSelector: scriptElement.getAttribute('data-target-selector-left')
        };
        return true;
    };

    async function main() {
        console.log('Models App: main() started.');
        try {
            if (!captureScriptAttributes()) {
                throw new Error("Could not capture script attributes.");
            }

            await loadDependencies();
            if (!GreenhouseUtils) {
                throw new Error("CRITICAL - Aborting main() due to missing GreenhouseUtils.");
            }

            const { baseUrl } = window._greenhouseModelsAttributes;
            if (!baseUrl) {
                throw new Error("CRITICAL - Aborting main() due to missing data-base-url attribute.");
            }

            // Load the new modules sequentially
            await GreenhouseUtils.loadScript('models_util.js', baseUrl);
            await GreenhouseUtils.loadScript('models_data.js', baseUrl);
            await GreenhouseUtils.loadScript('models_ui_synapse.js', baseUrl);
            await GreenhouseUtils.loadScript('models_ui_brain.js', baseUrl);
            await GreenhouseUtils.loadScript('models_ui_environment.js', baseUrl);
            await GreenhouseUtils.loadScript('models_ui.js', baseUrl);
            await GreenhouseUtils.loadScript('models_ux.js', baseUrl);

            // Check if all modules are loaded
            if (window.GreenhouseModelsData && window.GreenhouseModelsUI && window.GreenhouseModelsUX) {
                console.log('Models App: All modules loaded. Waiting for Velo data...');

                // Poll for the global data object populated by the Velo script
                const maxAttempts = 100; // Wait for 10 seconds
                let attempts = 0;
                const pollForData = setInterval(() => {
                    if (window._greenhouseModelsData || attempts >= maxAttempts) {
                        clearInterval(pollForData);
                        if (window._greenhouseModelsData) {
                            console.log('Models App: Velo data found. Initializing application.');
                            // Initialize data from global scope and then start the UX
                            GreenhouseModelsData.initializeVisualizationData();
                            GreenhouseModelsUX.init();
                        } else {
                            console.error('Models App: Timed out waiting for Velo data.');
                            GreenhouseUtils.displayError('Failed to load visualization data from the page.');
                        }
                    }
                    attempts++;
                }, 100);

            } else {
                throw new Error("One or more application modules failed to load.");
            }

        } catch (error) {
            console.error('Models App: Initialization failed:', error);
            if (GreenhouseUtils) {
                GreenhouseUtils.displayError(`Failed to load simulation components: ${error.message}`);
            }
        }
    }

    // --- Main Execution Logic ---
    main();

    // Expose a reinitialization function on the global scope
    window.GreenhouseModels = {
        reinitialize: () => {
            if (window.GreenhouseModelsUX) {
                console.log('Models App: Re-initializing from global scope.');
                window.GreenhouseModelsUX.reinitialize();
            }
        }
    };

})();
