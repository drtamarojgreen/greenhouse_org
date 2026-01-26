/**
 * @file cognition.js
 * @description Loader for Cognition Simulation Application.
 */

(async function () {
    'use strict';
    console.log('Cognition App: Loader execution started.');

    let GreenhouseUtils;

    const loadDependencies = async () => {
        if (window.GreenhouseDependencyManager) {
            try {
                await window.GreenhouseDependencyManager.waitFor('utils', 12000);
            } catch (error) {
                console.error('Cognition App: Dependency manager timeout:', error);
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
        const scriptElement = document.currentScript || document.querySelector('script[src*="cognition.js"]');
        if (!scriptElement) {
            console.error('Cognition App: Script element not found.');
            return { baseUrl: '', targetSelector: '#cognition-app-container' };
        }
        return {
            baseUrl: scriptElement.getAttribute('data-base-url') || '',
            targetSelector: scriptElement.getAttribute('data-target-selector-left') || '#cognition-app-container'
        };
    };

    async function main() {
        try {
            const { baseUrl, targetSelector } = captureScriptAttributes();
            await loadDependencies();

            if (!window.GreenhouseUtils) throw new Error("GreenhouseUtils not found.");

            await window.GreenhouseUtils.loadScript('models_3d_math.js', baseUrl);
            await window.GreenhouseUtils.loadScript('brain_mesh_realistic.js', baseUrl);
            await window.GreenhouseUtils.loadScript('cognition_ui_3d_brain.js', baseUrl);
            await window.GreenhouseUtils.loadScript('cognition_config.js', baseUrl);
            await window.GreenhouseUtils.loadScript('cognition_analytics.js', baseUrl);
            await window.GreenhouseUtils.loadScript('cognition_theories.js', baseUrl);
            await window.GreenhouseUtils.loadScript('cognition_development.js', baseUrl);
            await window.GreenhouseUtils.loadScript('cognition_interventions.js', baseUrl);
            await window.GreenhouseUtils.loadScript('cognition_medications.js', baseUrl);
            await window.GreenhouseUtils.loadScript('cognition_app.js', baseUrl);

            if (window.GreenhouseCognitionApp) {
                window.GreenhouseCognitionApp.init(targetSelector);

                if (window.GreenhouseUtils.renderModelsTOC) {
                    window.GreenhouseUtils.renderModelsTOC(targetSelector);
                }
            } else {
                throw new Error("GreenhouseCognitionApp failed to load.");
            }

        } catch (error) {
            console.error('Cognition App: Initialization failed:', error);
        }
    }

    main();
})();
