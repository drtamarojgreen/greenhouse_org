// docs/js/neuro.js
// REFACTORED Loader for Neuro Simulation Application

(function() {
    'use strict';

    // 1. Dedicated config object to manage state during loading
    const neuroConfig = {
        baseUrl: null,
        targetSelector: null,
        utils: null,
    };

    /**
     * Captures configuration from the script tag's data attributes.
     * Allows for a global override via `window._greenhouseNeuroAttributes` for testing.
     */
    function captureAttributes() {
        let script;
        if (document.currentScript) {
            script = document.currentScript;
        } else {
            const scripts = document.querySelectorAll('script[src*="neuro.js"]');
            script = scripts.length > 0 ? scripts[scripts.length - 1] : null;
        }

        if (script) {
            neuroConfig.baseUrl = script.getAttribute('data-base-url');
            neuroConfig.targetSelector = script.getAttribute('data-target-selector-left');
        }

        // Global override for test harnesses or special cases
        if (window._greenhouseNeuroAttributes) {
            neuroConfig.baseUrl = window._greenhouseNeuroAttributes.baseUrl || neuroConfig.baseUrl;
            neuroConfig.targetSelector = window._greenhouseNeuroAttributes.targetSelector || neuroConfig.targetSelector;
        }

        console.log('Neuro App: Configured with', {
            baseUrl: neuroConfig.baseUrl,
            targetSelector: neuroConfig.targetSelector
        });
    }

    /**
     * Loads critical dependencies. Aborts if GreenhouseDependencyManager is not available.
     */
    async function loadCoreDependencies() {
        if (!window.GreenhouseDependencyManager) {
            throw new Error('CRITICAL: GreenhouseDependencyManager is required but not found.');
        }
        try {
            console.log('Neuro App: Waiting for GreenhouseUtils...');
            await window.GreenhouseDependencyManager.waitFor('utils', 10000); // 10-second timeout
            neuroConfig.utils = window.GreenhouseUtils;
            console.log('Neuro App: GreenhouseUtils loaded successfully.');
        } catch (error) {
            console.error('Neuro App: Failed to load GreenhouseUtils via dependency manager.', error);
            throw error; // Re-throw to halt execution
        }
    }

    /**
     * Verifies that all required application modules are available on the window object.
     */
    function runHealthCheck() {
        const requiredModules = [
            'GreenhouseNeuroApp',
            'NeuroGA',
            'GreenhouseNeuroUI3D',
            'GreenhouseNeuroGeometry',
            'GreenhouseBrainMeshRealistic',
            'GreenhouseModels3DMath'
        ];

        const missing = requiredModules.filter(m => !window[m]);

        if (missing.length > 0) {
            throw new Error(`Health check failed. Missing critical modules: ${missing.join(', ')}`);
        }

        console.log('Neuro App: Health check passed. All modules are present.');
        return true;
    }

    /**
     * Main execution flow for loading and initializing the Neuro application.
     */
    async function main() {
        console.log('Neuro App: Loader main() sequence started.');
        try {
            captureAttributes();

            if (!neuroConfig.targetSelector) {
                throw new Error('Missing `data-target-selector-left` attribute. Cannot determine where to render the app.');
            }
            if (!neuroConfig.baseUrl) {
                console.warn('Neuro App: Missing `data-base-url`. Assuming scripts are in the same directory.');
                neuroConfig.baseUrl = ''; // Default to relative path
            }

            // Load GreenhouseUtils first, as it's needed for loading other scripts
            await loadCoreDependencies();
            const { utils, baseUrl } = neuroConfig;

            // List of scripts for the Neuro application, ensuring no cross-dependencies with Genetic.
            const scriptsToLoad = [
                'js/models_3d_math.js',
                'js/brain_mesh_realistic.js',
                'js/labeling_system.js',
                'js/neuro_config.js',
                'js/neuro_camera_controls.js',
                'js/neuro_synapse_camera_controls.js',
                'js/neuro_lighting.js',
                'js/neuro_ga.js',
                'js/neuro_ui_3d_geometry.js', // Belongs to Neuro, as per plan
                'js/neuro_ui_3d_brain.js',
                'js/neuro_ui_3d_neuron.js',
                'js/neuro_ui_3d_synapse.js',
                'js/neuro_ui_3d_stats.js',
                'js/neuro_ui_3d_enhanced.js',
                'js/neuro_app.js',
            ];

            console.log('Neuro App: Loading application scripts...');
            for (const script of scriptsToLoad) {
                await utils.loadScript(script, baseUrl);
            }

            // Final verification before initializing
            runHealthCheck();

            console.log('Neuro App: All modules loaded. Initializing application.');
            window.GreenhouseNeuroApp.init(neuroConfig.targetSelector, neuroConfig);

        } catch (error) {
            console.error('Neuro App: CRITICAL FAILURE during initialization.', error);
            if (neuroConfig.utils && typeof neuroConfig.utils.displayError === 'function') {
                neuroConfig.utils.displayError(`Failed to load Neuro components: ${error.message}`);
            } else {
                // Fallback error display if utils didn't even load
                const target = document.querySelector(neuroConfig.targetSelector || 'body');
                if (target) {
                    target.innerHTML = `<div style="padding: 20px; color: red; background: #330000; border: 1px solid red;">
                        <strong>Error:</strong> Failed to load Neuro application. ${error.message}
                    </div>`;
                }
            }
        }
    }

    // Delay start until DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }
})();
