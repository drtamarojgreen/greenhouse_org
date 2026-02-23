/**
 * @file neuro.js
 * @description Loader for the Neuro Simulation (GA).
 */

(async function () {
    'use strict';

    let GreenhouseUtils;

    const loadDependencies = async () => {
        if (window.GreenhouseDependencyManager) {
            try {
                await window.GreenhouseDependencyManager.waitFor('utils', 12000);
            } catch (error) {
                // Dependency manager failed
            }
        } else {
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 240;
                const interval = setInterval(() => {
                    if (window.GreenhouseUtils) {
                        clearInterval(interval);
                        resolve();
                    } else if (attempts++ >= maxAttempts) {
                        clearInterval(interval);
                        reject(new Error('GreenhouseUtils load timeout'));
                    }
                }, 50);
            });
        }
        GreenhouseUtils = window.GreenhouseUtils;
    };

    const captureScriptAttributes = () => {
        if (window._greenhouseNeuroAttributes) {
            return true;
        }
        const scriptElement = document.currentScript;
        if (!scriptElement) {
            return false;
        }
        window._greenhouseNeuroAttributes = {
            baseUrl: scriptElement.getAttribute('data-base-url'),
            targetSelector: scriptElement.getAttribute('data-target-selector-left')
        };
        return true;
    };

    async function main() {
        try {
            if (!captureScriptAttributes()) {
                throw new Error("Could not capture script attributes.");
            }

            await loadDependencies();
            if (!GreenhouseUtils) {
                throw new Error("CRITICAL - Aborting main() due to missing GreenhouseUtils.");
            }

            const { baseUrl } = window._greenhouseNeuroAttributes;
            if (!baseUrl) {
                throw new Error("CRITICAL - Aborting main() due to missing data-base-url attribute.");
            }

            // Load dependencies sequentially
            await GreenhouseUtils.loadScript('models_lang.js', baseUrl);
            await GreenhouseUtils.loadScript('models_util.js', baseUrl);
            await GreenhouseUtils.loadScript('models_3d_math.js', baseUrl);
            await GreenhouseUtils.loadScript('brain_mesh_realistic.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_config.js', baseUrl);
            await GreenhouseUtils.loadScript('genetic_camera_controls.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_camera_controls.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_synapse_camera_controls.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_lighting.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_adhd_data.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_ga.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_ui_3d_geometry.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_ui_3d_brain.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_ui_3d_neuron.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_ui_3d_synapse.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_ui_3d_stats.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_ui_3d.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_controls.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_app.js', baseUrl);

            if (window.GreenhouseNeuroApp && window.NeuroGA && window.GreenhouseNeuroUI3D) {
                const { targetSelector } = window._greenhouseNeuroAttributes;
                window.GreenhouseNeuroApp.init(targetSelector, baseUrl);

                if (GreenhouseUtils && typeof GreenhouseUtils.renderModelsTOC === 'function') {
                    GreenhouseUtils.renderModelsTOC(targetSelector);
                }
            } else {
                throw new Error("One or more required Neuro App modules failed to load.");
            }
        } catch (error) {
            // Silently fail or log to error reporting service if available
        }
    }

    main();

    window.GreenhouseNeuro = {
        reinitialize: () => {
            if (window.GreenhouseNeuroApp) {
                window.GreenhouseNeuroApp.init(window._greenhouseNeuroAttributes.targetSelector, window._greenhouseNeuroAttributes.baseUrl);
            }
        }
    };

})();
