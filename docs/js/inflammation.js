/**
 * @file inflammation.js
 * @description Loader for the Neuroinflammation Simulation.
 */

(async function () {
    'use strict';
    console.log('Inflammation App: Loader execution started.');

    let GreenhouseUtils;

    const loadDependencies = async () => {
        if (window.GreenhouseDependencyManager) {
            try {
                await window.GreenhouseDependencyManager.waitFor('utils', 12000);
            } catch (error) {
                console.error('Inflammation App: Dependency manager timeout:', error);
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
        const scriptElement = document.currentScript || document.querySelector('script[src*="inflammation.js"]');
        if (!scriptElement) {
            console.error('Inflammation App: Script element not found.');
            return { baseUrl: '', targetSelector: '#inflammation-app-container' };
        }
        return {
            baseUrl: scriptElement.getAttribute('data-base-url') || '',
            targetSelector: scriptElement.getAttribute('data-target-selector-left') || '#inflammation-app-container'
        };
    };

    async function main() {
        try {
            const { baseUrl, targetSelector } = captureScriptAttributes();
            await loadDependencies();

            if (!window.GreenhouseUtils) throw new Error("GreenhouseUtils not found.");

            // Load dependencies sequentially
            await window.GreenhouseUtils.loadScript('models_lang.js', baseUrl);
            await window.GreenhouseUtils.loadScript('models_util.js', baseUrl);
            await window.GreenhouseUtils.loadScript('models_3d_math.js', baseUrl);
            await window.GreenhouseUtils.loadScript('brain_mesh_realistic.js', baseUrl);
            await window.GreenhouseUtils.loadScript('neuro_ui_3d_geometry.js', baseUrl);
            await window.GreenhouseUtils.loadScript('inflammation_geometry.js', baseUrl);
            await window.GreenhouseUtils.loadScript('neuro_ui_3d_brain.js', baseUrl);
            await window.GreenhouseUtils.loadScript('neuro_ui_3d_neuron.js', baseUrl);
            await window.GreenhouseUtils.loadScript('inflammation_config.js', baseUrl);
            await window.GreenhouseUtils.loadScript('inflammation_pathway.js', baseUrl);
            await window.GreenhouseUtils.loadScript('inflammation_ui_3d.js', baseUrl);
            await window.GreenhouseUtils.loadScript('inflammation_signaling.js', baseUrl);
            await window.GreenhouseUtils.loadScript('inflammation_macro.js', baseUrl);
            await window.GreenhouseUtils.loadScript('inflammation_micro.js', baseUrl);
            await window.GreenhouseUtils.loadScript('inflammation_molecular.js', baseUrl);
            await window.GreenhouseUtils.loadScript('inflammation_tooltips.js', baseUrl);
            await window.GreenhouseUtils.loadScript('inflammation_controls.js', baseUrl);
            await window.GreenhouseUtils.loadScript('inflammation_analysis.js', baseUrl);
            await window.GreenhouseUtils.loadScript('inflammation_test_harness.js', baseUrl);
            await window.GreenhouseUtils.loadScript('inflammation_app.js', baseUrl);

            if (window.GreenhouseInflammationApp) {
                window.GreenhouseInflammationApp.init(targetSelector, baseUrl);

                if (window.GreenhouseUtils.renderModelsTOC) {
                    window.GreenhouseUtils.renderModelsTOC(targetSelector);
                }
            } else {
                throw new Error("GreenhouseInflammationApp failed to load.");
            }

        } catch (error) {
            console.error('Inflammation App: Initialization failed:', error);
        }
    }

    main();
})();
