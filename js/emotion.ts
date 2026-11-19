import { GreenhouseEmotionApp } from './emotion/emotion_app.js';
import { GreenhouseUtils } from './GreenhouseUtils.js';
// [TypeScript Migration] Source migrated from emotion.js — behavior preserved.
/**
 * @file emotion.js
 * @description Loader for Emotion Simulation Application.
 */

(async function () {
    'use strict';
    console.log('Emotion App: Loader execution started.');

    const loadDependencies = async () => {};

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
            await import('./models_lang.js');
            await import('./models_util.js');
            await import('./models_3d_math.js');
            await import('./brain_mesh_realistic.js');
            await import('./emotion/emotion_ui_3d_brain.js');
            await import('./emotion/emotion_diagrams.js');
            await import('./emotion/emotion_config.js');
            await import('./emotion/emotion_regions.js');
            await import('./emotion/emotion_interventions.js');
            await import('./emotion/emotion_theories.js');
            await import('./emotion/emotion_app.js');
            const { baseUrl, targetSelector } = captureScriptAttributes();
            

            if (!GreenhouseUtils) throw new Error("GreenhouseUtils not found.");

            // Load components

            if (GreenhouseEmotionApp) {
                GreenhouseEmotionApp.init(targetSelector);

                if (GreenhouseUtils.renderModelsTOC) {
                    GreenhouseUtils.renderModelsTOC(targetSelector);
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
