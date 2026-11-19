import { GreenhouseSynapseApp } from './context.js';
import { GreenhouseUtils } from './GreenhouseUtils.js';
// [TypeScript Migration] Source migrated from synapse.js — behavior preserved.
// docs/js/synapse.js
// Loader for Synapse Simulation Application
// Modeled after live site master loaders (serotonin.js, rna_repair.js)

(async function () {
    'use strict';
    console.log('Synapse App: Loader execution started.');

    // Function to wait for GreenhouseUtils to be available on the window object.
    const loadDependencies = async () => {};

    // Function to capture necessary attributes from the script tag.
    const captureScriptAttributes = () => {
        // Priority 1: Check global attributes object (set by GreenhouseUtils)
        if ((window._greenhouseScriptAttributes || { baseUrl: '/', targetSelector: '#synapse-app-container', 'base-url': '/', 'target-selector-left': '#synapse-app-container' })) {
            console.log('Synapse App: Using global script attributes.');
            (window as any)._greenhouseSynapseAttributes = {
                baseUrl: (window._greenhouseScriptAttributes || { baseUrl: '/', targetSelector: '#synapse-app-container', 'base-url': '/', 'target-selector-left': '#synapse-app-container' })['base-url'],
                targetSelector: (window._greenhouseScriptAttributes || { baseUrl: '/', targetSelector: '#synapse-app-container', 'base-url': '/', 'target-selector-left': '#synapse-app-container' })['target-selector-left']
            };
            delete window._greenhouseScriptAttributes; // Clean up
            return true;
        }

        // Priority 2: Fallback to DOM inspection (e.g. for synapse.html testing)
        const scripts = document.querySelectorAll('script[src*="synapse.js"]');
        if (scripts.length > 0) {
            const script = scripts[scripts.length - 1];
            (window as any)._greenhouseSynapseAttributes = {
                baseUrl: script.getAttribute('data-base-url'),
                targetSelector: script.getAttribute('data-target-selector-left')
            };
            return true;
        }
        return true;
    };

    async function main() {
        console.log('Synapse App: main() started.');
        try {
            if (!captureScriptAttributes()) {
                throw new Error("Could not capture script attributes.");
            }

            
            if (!GreenhouseUtils) {
                throw new Error("CRITICAL - Aborting main() due to missing GreenhouseUtils.");
            }

            const { baseUrl: attrBaseUrl, targetSelector } = (window._greenhouseSynapseAttributes || { baseUrl: '/', targetSelector: '#synapse-app-container', 'base-url': '/', 'target-selector-left': '#synapse-app-container' });
            const baseUrl = attrBaseUrl || './';

            // Sequential loading of all modular components
            await import('./models_lang.js');
            await import('./models_util.js');
            await import('./synapse/synapse_chemistry.js');
            await import('./synapse/synapse_neurotransmitters.js');
            await import('./synapse/synapse_sidebar.js');
            await import('./synapse/synapse_tooltips.js');
            await import('./synapse/synapse_controls.js');
            await import('./synapse/synapse_analytics.js');
            await import('./synapse/synapse_3d.js');
            await import('./synapse/synapse_molecular.js');
            await import('./synapse/synapse_app.js');

            // Check if all modules are loaded
            if (GreenhouseSynapseApp) {
                console.log('Synapse App: All modules loaded successfully.');

                if (targetSelector) {
                    console.log('Synapse App: Initializing...');
                    GreenhouseSynapseApp.init(targetSelector, baseUrl);

                    // Render bottom navigation TOC via common utilities
                    if (GreenhouseUtils && typeof GreenhouseUtils.renderModelsTOC === 'function') {
                        GreenhouseUtils.renderModelsTOC(targetSelector);
                    }
                } else {
                    console.warn('Synapse App: No target selector provided, skipping auto-init.');
                }
            } else {
                throw new Error("Synapse application module failed to load.");
            }

        } catch (error) {
            console.error('Synapse App: Initialization failed:', error);
            if (GreenhouseUtils) {
                GreenhouseUtils.displayError(`Failed to load synapse components: ${error.message}`);
            }
        }
    }

    // --- Main Execution Logic ---
    main();

})();
