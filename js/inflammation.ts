import { GreenhouseUtils } from './GreenhouseUtils.js';
import { GreenhouseInflammationApp } from './inflammation/inflammation_app.js';
// [TypeScript Migration] Source migrated from inflammation.js — behavior preserved.
/**
 * @file inflammation.js
 * @description Loader for the Neuroinflammation Simulation.
 */

(async function () {
    'use strict';
    console.log('Inflammation App: Loader execution started.');

    const loadDependencies = async () => {};

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
            await import('./models_lang.js');
            await import('./models_util.js');
            await import('./models_3d_math.js');
            await import('./brain_mesh_realistic.js');
            await import('./neuro/neuro_ui_3d_geometry.js');
            await import('./inflammation/inflammation_geometry.js');
            await import('./neuro/neuro_ui_3d_brain.js');
            await import('./neuro/neuro_ui_3d_neuron.js');
            await import('./inflammation/inflammation_config.js');
            await import('./inflammation/inflammation_pathway.js');
            await import('./inflammation/inflammation_ui_3d.js');
            await import('./inflammation/inflammation_signaling.js');
            await import('./inflammation/inflammation_macro.js');
            await import('./inflammation/inflammation_micro.js');
            await import('./inflammation/inflammation_molecular.js');
            await import('./inflammation/inflammation_tooltips.js');
            await import('./inflammation/inflammation_controls.js');
            await import('./inflammation/inflammation_analysis.js');
            await import('./inflammation/inflammation_test_harness.js');
            await import('./inflammation/inflammation_app.js');
            const { baseUrl, targetSelector } = captureScriptAttributes();
            

            if (!GreenhouseUtils) throw new Error("GreenhouseUtils not found.");

            // Load dependencies sequentially

            if (GreenhouseInflammationApp) {
                GreenhouseInflammationApp.init(targetSelector, baseUrl);

                if (GreenhouseUtils.renderModelsTOC) {
                    GreenhouseUtils.renderModelsTOC(targetSelector);
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
