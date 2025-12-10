You // docs/js/neuro.js
    // Loader for Neuro Simulation Application
    // Modeled after models.js

    (async function () {
        'use strict';
        console.log('Neuro App: Loader execution started.');

        let GreenhouseUtils;

        const loadDependencies = async () => {
            console.log('Neuro App: loadDependencies started.');
            if (window.GreenhouseDependencyManager) {
                try {
                    await window.GreenhouseDependencyManager.waitFor('utils', 12000);
                    console.log('Neuro App: GreenhouseUtils loaded via dependency manager');
                } catch (error) {
                    console.error('Neuro App: Failed to load GreenhouseUtils via dependency manager:', error.message);
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
                            console.error('Neuro App: GreenhouseUtils not available after 12 second timeout');
                            reject(new Error('GreenhouseUtils load timeout'));
                        }
                    }, 50);
                });
            }
            GreenhouseUtils = window.GreenhouseUtils;
        };

        const captureScriptAttributes = () => {
            if (window._greenhouseNeuroAttributes) {
                console.log('Neuro App: Using pre-defined attributes.');
                return true;
            }
            const scriptElement = document.currentScript;
            if (!scriptElement) {
                // Fallback for when currentScript is not available (e.g. async load in some browsers)
                // But usually this script is injected by greenhouse.js with data attributes.
                // If called via loadScript in greenhouse.js, we rely on how greenhouse.js passes data.
                // greenhouse.js uses loadScript which creates a script tag.
                // Let's assume the script tag is the last one or we use the global fallback if we were passed data differently.
                // Actually, greenhouse.js loadScript sets attributes on the script tag.
                // We can try to find the script tag by src if currentScript is null.
                const scripts = document.querySelectorAll('script[src*="neuro.js"]');
                if (scripts.length > 0) {
                    const script = scripts[scripts.length - 1];
                    window._greenhouseNeuroAttributes = {
                        baseUrl: script.getAttribute('data-base-url'),
                        targetSelector: script.getAttribute('data-target-selector-left')
                    };
                    return true;
                }

                console.error('Neuro App: Could not find current script element to capture attributes.');
                return false;
            }
            window._greenhouseNeuroAttributes = {
                baseUrl: scriptElement.getAttribute('data-base-url'),
                targetSelector: scriptElement.getAttribute('data-target-selector-left')
            };
            return true;
        };

        async function main() {
            console.log('Neuro App: main() started.');
            try {
                if (!captureScriptAttributes()) {
                    throw new Error("Could not capture script attributes.");
                }

                await loadDependencies();
                if (!GreenhouseUtils) {
                    throw new Error("CRITICAL - Aborting main() due to missing GreenhouseUtils.");
                }

                const { baseUrl, targetSelector } = window._greenhouseNeuroAttributes;
                if (!baseUrl) {
                    throw new Error("CRITICAL - Aborting main() due to missing data-base-url attribute.");
                }

                // Load the modules sequentially
                await GreenhouseUtils.loadScript('models_3d_math.js', baseUrl);
                await GreenhouseUtils.loadScript('neuro_ga.js', baseUrl);
                await GreenhouseUtils.loadScript('neuro_ui_3d_geometry.js', baseUrl);
                await GreenhouseUtils.loadScript('neuro_ui_3d_brain.js', baseUrl);
                await GreenhouseUtils.loadScript('neuro_ui_3d_neuron.js', baseUrl);
                await GreenhouseUtils.loadScript('neuro_ui_3d_synapse.js', baseUrl);
                await GreenhouseUtils.loadScript('neuro_ui_3d_stats.js', baseUrl);
                await GreenhouseUtils.loadScript('neuro_ui_3d.js', baseUrl);
                await GreenhouseUtils.loadScript('neuro_app.js', baseUrl);

                // Check if all modules are loaded
                if (window.GreenhouseNeuroApp && window.NeuroGA && window.GreenhouseNeuroUI3D) {
                    console.log('Neuro App: All modules loaded successfully.');

                    // Initialize the application
                    // Use the selector captured from attributes
                    if (targetSelector) {
                        window.GreenhouseNeuroApp.init(targetSelector);
                    } else {
                        console.warn('Neuro App: No target selector provided, skipping auto-init.');
                    }

                } else {
                    throw new Error("One or more application modules failed to load.");
                }

            } catch (error) {
                console.error('Neuro App: Initialization failed:', error);
                if (GreenhouseUtils) {
                    GreenhouseUtils.displayError(`Failed to load neuro components: ${error.message}`);
                }
            }
        }

        // --- Main Execution Logic ---
        main();

    })();
