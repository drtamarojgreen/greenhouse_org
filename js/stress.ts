import { GreenhouseUtils } from './GreenhouseUtils.js';
import { GreenhouseStressApp } from './stress/stress_app.js';
// [TypeScript Migration] Source migrated from stress.js — behavior preserved.
/**
 * @file stress.js
 * @description Loader for the Stress Dynamics Simulation.
 */

(async function () {
    'use strict';
    console.log('Stress App: Loader execution started.');

    const loadDependencies = async () => {};

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
            await import('./models_lang.js');
            await import('./models_util.js');
            await import('./models_3d_math.js');
            await import('./brain_mesh_realistic.js');
            await import('./neuro/neuro_ui_3d_geometry.js');
            await import('./stress/stress_geometry.js');
            await import('./neuro/neuro_ui_3d_brain.js');
            await import('./graph_parser.js');
            await import('./model_graph_viewer.js');
            await import('./stress/stress_config.js');
            await import('./stress/stress_ui_3d.js');
            await import('./stress/stress_macro.js');
            await import('./stress/stress_pathway.js');
            await import('./stress/stress_systemic.js');
            await import('./stress/stress_tooltips.js');
            await import('./stress/stress_controls.js');
            await import('./stress/stress_app.js');
            const { baseUrl, targetSelector } = captureScriptAttributes();
            

            if (!GreenhouseUtils) throw new Error("GreenhouseUtils not found.");

            // Load dependencies sequentially

            // Graph Visualization Modules

            if (GreenhouseStressApp) {
                GreenhouseStressApp.init(targetSelector, baseUrl);

                if (GreenhouseUtils.renderModelsTOC) {
                    GreenhouseUtils.renderModelsTOC(targetSelector);
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
