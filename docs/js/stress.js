/**
 * @file stress.js
 * @description Loader for the Stress Dynamics Simulation.
 */

(async function () {
    'use strict';
    console.log('Stress App: Loader execution started.');

    let GreenhouseUtils;

    const loadDependencies = async () => {
        if (window.GreenhouseDependencyManager) {
            try {
                await window.GreenhouseDependencyManager.waitFor('utils', 12000);
            } catch (error) {
                console.error('Stress App: Dependency manager timeout:', error);
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
        const scriptElement = document.currentScript || document.querySelector('script[src*="stress.js"]');
        if (!scriptElement) {
            console.error('Stress App: Script element not found.');
            return { baseUrl: '', targetSelector: '#stress-app-container' };
        }
        return {
            baseUrl: scriptElement.getAttribute('data-base-url') || '',
            targetSelector: scriptElement.getAttribute('data-target-selector-left') || '#stress-app-container'
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
            await window.GreenhouseUtils.loadScript('stress_geometry.js', baseUrl);
            await window.GreenhouseUtils.loadScript('neuro_ui_3d_brain.js', baseUrl);
            await window.GreenhouseUtils.loadScript('stress_config.js', baseUrl);
            await window.GreenhouseUtils.loadScript('stress_ui_3d.js', baseUrl);
            await window.GreenhouseUtils.loadScript('stress_macro.js', baseUrl);
            await window.GreenhouseUtils.loadScript('stress_pathway.js', baseUrl);
            await window.GreenhouseUtils.loadScript('stress_systemic.js', baseUrl);
            await window.GreenhouseUtils.loadScript('stress_tooltips.js', baseUrl);
            await window.GreenhouseUtils.loadScript('stress_controls.js', baseUrl);
            await window.GreenhouseUtils.loadScript('stress_app.js', baseUrl);

            if (window.GreenhouseStressApp) {
                window.GreenhouseStressApp.init(targetSelector);

                if (window.GreenhouseUtils.renderModelsTOC) {
                    window.GreenhouseUtils.renderModelsTOC(targetSelector);
                }
            } else {
                throw new Error("GreenhouseStressApp failed to load.");
            }

        } catch (error) {
            console.error('Stress App: Initialization failed:', error);
        }
    }

    main();
})();
