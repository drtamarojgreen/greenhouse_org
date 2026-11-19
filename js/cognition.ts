import { GreenhouseCognitionApp } from './cognition/cognition_app.js';
import { GreenhouseUtils } from './GreenhouseUtils.js';
// [TypeScript Migration] Source migrated from cognition.js — behavior preserved.
/**
 * @file cognition.js
 * @description Loader for Cognition Simulation Application.
 */

(async function () {
    'use strict';
    console.log('Cognition App: Loader execution started.');

    const loadDependencies = async () => {};

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
            await import('./models_lang.js');
            await import('./models_util.js');
            await import('./models_3d_math.js');
            await import('./brain_mesh_realistic.js');
            await import('./cognition/cognition_ui_3d_brain.js');
            await import('./cognition/cognition_drawing_utils.js');
            await import('./cognition/cognition_config.js');
            await import('./cognition/cognition_analytics.js');
            await import('./cognition/cognition_theories.js');
            await import('./cognition/cognition_development.js');
            await import('./cognition/cognition_interventions.js');
            await import('./cognition/cognition_medications.js');
            await import('./cognition/cognition_research.js');
            await import('./cognition/cognition_educational.js');
            await import('./cognition/cognition_app.js');
            const { baseUrl, targetSelector } = captureScriptAttributes();
            

            if (!GreenhouseUtils) throw new Error("GreenhouseUtils not found.");

            if (GreenhouseCognitionApp) {
                GreenhouseCognitionApp.init(targetSelector);

                if (GreenhouseUtils.renderModelsTOC) {
                    GreenhouseUtils.renderModelsTOC(targetSelector);
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
