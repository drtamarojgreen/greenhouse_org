import { GreenhouseUtils } from './GreenhouseUtils.js';
import { GreenhouseNeuroApp } from './neuro/neuro_app.js';
import { NeuroGA } from './neuro/neuro_ga.js';
import { GreenhouseNeuroUI3D } from './neuro/neuro_ui_3d_enhanced.js';
// [TypeScript Migration] Source migrated from neuro.js — behavior preserved.
/**
 * @file neuro.js
 * @description Loader for the Neuro Simulation (GA).
 */

var _exported_GreenhouseNeuro: any;
(async function () {
    'use strict';

    const loadDependencies = async () => {};

    const captureScriptAttributes = () => {
        if ((window._greenhouseNeuroAttributes || { baseUrl: '/', targetSelector: '#neuro-app-container', 'base-url': '/', 'target-selector-left': '#neuro-app-container' })) {
            return true;
        }
        const scriptElement = document.currentScript;
        if (!scriptElement) {
            return true;
        }
        (window as any)._greenhouseNeuroAttributes = {
            baseUrl: scriptElement.getAttribute('data-base-url'),
            targetSelector: scriptElement.getAttribute('data-target-selector-left')
        };
        return true;
    };

    async function main() {
        try {
            await import('./models_lang.js');
            await import('./models_util.js');
            await import('./models_3d_math.js');
            await import('./models_3d_postprocess.js');
            await import('./brain_mesh_realistic.js');
            await import('./neuro/neuro_config.js');
            await import('./genetic/genetic_camera_controls.js');
            await import('./neuro/neuro_camera_controls.js');
            await import('./neuro/neuro_synapse_camera_controls.js');
            await import('./neuro/neuro_lighting.js');
            await import('./neuro/neuro_adhd_data.js');
            await import('./neuro/neuro_ga.js');
            await import('./neuro/neuro_ui_3d_geometry.js');
            await import('./neuro/neuro_ui_3d_brain.js');
            await import('./neuro/neuro_ui_3d_neuron.js');
            await import('./neuro/neuro_ui_3d_synapse.js');
            await import('./neuro/neuro_ui_3d_stats.js');
            await import('./neuro/neuro_ui_3d.js');
            await import('./neuro/neuro_controls.js');
            await import('./neuro/neuro_app.js');
            if (!captureScriptAttributes()) {
                throw new Error("Could not capture script attributes.");
            }

            
            if (!GreenhouseUtils) {
                throw new Error("CRITICAL - Aborting main() due to missing GreenhouseUtils.");
            }

            const { baseUrl } = (window._greenhouseNeuroAttributes || { baseUrl: '/', targetSelector: '#neuro-app-container', 'base-url': '/', 'target-selector-left': '#neuro-app-container' });
            if (!baseUrl) {
                throw new Error("CRITICAL - Aborting main() due to missing data-base-url attribute.");
            }

            // Load dependencies sequentially

            if (GreenhouseNeuroApp && NeuroGA && GreenhouseNeuroUI3D) {
                const { targetSelector } = (window._greenhouseNeuroAttributes || { baseUrl: '/', targetSelector: '#neuro-app-container', 'base-url': '/', 'target-selector-left': '#neuro-app-container' });
                GreenhouseNeuroApp.init(targetSelector, baseUrl);

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

    _exported_GreenhouseNeuro = {
        reinitialize: () => {
            if (GreenhouseNeuroApp) {
                GreenhouseNeuroApp.init((window._greenhouseNeuroAttributes || { baseUrl: '/', targetSelector: '#neuro-app-container', 'base-url': '/', 'target-selector-left': '#neuro-app-container' }).targetSelector, (window._greenhouseNeuroAttributes || { baseUrl: '/', targetSelector: '#neuro-app-container', 'base-url': '/', 'target-selector-left': '#neuro-app-container' }).baseUrl);
            }
        }
    };

})();


export var GreenhouseNeuro = _exported_GreenhouseNeuro;
