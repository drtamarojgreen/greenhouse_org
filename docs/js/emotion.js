/**
 * @file emotion.js
 * @description Loader for Emotion Simulation Application.
 */

(async function () {
    'use strict';
    console.log('Emotion App: Loader execution started.');

    let GreenhouseUtils;

    const loadDependencies = async () => {
        if (window.GreenhouseDependencyManager) {
            try {
                await window.GreenhouseDependencyManager.waitFor('utils', 12000);
            } catch (error) {
                console.error('Emotion App: Dependency manager timeout:', error);
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
        const scriptElement = document.currentScript || document.querySelector('script[src*="emotion.js"]');
        if (!scriptElement) {
            console.error('Emotion App: Script element not found.');
            return { baseUrl: '', targetSelector: '#emotion-app-container' };
        }
        return {
            baseUrl: scriptElement.getAttribute('data-base-url') || '',
            targetSelector: scriptElement.getAttribute('data-target-selector-left') || '#emotion-app-container'
        };
    };

    async function main() {
        try {
            const { baseUrl, targetSelector } = captureScriptAttributes();
            await loadDependencies();

            if (!window.GreenhouseUtils) throw new Error("GreenhouseUtils not found.");

            // Load components
            await window.GreenhouseUtils.loadScript('models_util.js', baseUrl);
            await window.GreenhouseUtils.loadScript('models_3d_math.js', baseUrl);
            await window.GreenhouseUtils.loadScript('brain_mesh_realistic.js', baseUrl);
            await window.GreenhouseUtils.loadScript('emotion_ui_3d_brain.js', baseUrl);
            await window.GreenhouseUtils.loadScript('emotion_diagrams.js', baseUrl);
            await window.GreenhouseUtils.loadScript('emotion_config.js', baseUrl);
            await window.GreenhouseUtils.loadScript('emotion_regions.js', baseUrl);
            await window.GreenhouseUtils.loadScript('emotion_interventions.js', baseUrl);
            await window.GreenhouseUtils.loadScript('emotion_theories.js', baseUrl);
            await window.GreenhouseUtils.loadScript('emotion_app.js', baseUrl);

            if (window.GreenhouseEmotionApp) {
                window.GreenhouseEmotionApp.init(targetSelector);

                if (window.GreenhouseUtils.renderModelsTOC) {
                    window.GreenhouseUtils.renderModelsTOC(targetSelector);
                }
            } else {
                throw new Error("GreenhouseEmotionApp failed to load.");
            }

        } catch (error) {
            console.error('Emotion App: Initialization failed:', error);
        }
    }

    main();
})();
