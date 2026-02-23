/**
 * @file neuro.js
 * @description Loader for the Neuro Simulation (GA).
 */

(async function () {
    'use strict';
    console.log('Neuro App: Loader execution started.');

    let GreenhouseUtils;

    const loadDependencies = async () => {
        if (window.GreenhouseDependencyManager) {
            try {
                await window.GreenhouseDependencyManager.waitFor('utils', 12000);
            } catch (error) {
                console.error('Neuro App: Dependency manager timeout:', error);
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
        // Look for the script element by data-script-name (set by GreenhouseUtils.loadScript)
        // or fall back to src match if loaded normally.
        const scriptElement = document.currentScript ||
                            document.querySelector('script[data-script-name="neuro.js"]') ||
                            document.querySelector('script[src*="neuro.js"]');

        // Capture initial values from script element attributes
        let baseUrl = scriptElement ? (scriptElement.getAttribute('data-base-url') || '') : '';
        let targetSelector = scriptElement ? (scriptElement.getAttribute('data-target-selector-left') || '') : '';

        // Fallback to global attributes if currentScript/element attributes are missing
        // (standardized Greenhouse pattern for Blob/Async loading)
        const globalAttributes = window._greenhouseNeuroAttributes || window._greenhouseScriptAttributes || {};

        baseUrl = globalAttributes['base-url'] || globalAttributes.baseUrl || baseUrl || '';
        targetSelector = globalAttributes['target-selector-left'] || globalAttributes.targetSelector || targetSelector || '#neuro-app-container';

        // Production fallback if still missing
        if (!baseUrl && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            baseUrl = 'https://drtamarojgreen.github.io/greenhouse_org/';
        }

        // Ensure baseUrl ends with slash for correct path joining
        if (baseUrl && !baseUrl.endsWith('/')) {
            baseUrl += '/';
        }

        return { baseUrl, targetSelector };
    };

    async function main() {
        try {
            const { baseUrl, targetSelector } = captureScriptAttributes();
            await loadDependencies();

            if (!window.GreenhouseUtils) throw new Error("GreenhouseUtils not found.");

            // Load dependencies sequentially - Authoritative sequence for production stability
            await GreenhouseUtils.loadScript('models_lang.js', baseUrl);
            await GreenhouseUtils.loadScript('models_util.js', baseUrl);
            await GreenhouseUtils.loadScript('models_3d_math.js', baseUrl);
            await GreenhouseUtils.loadScript('brain_mesh_realistic.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_config.js', baseUrl);
            await GreenhouseUtils.loadScript('genetic_camera_controls.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_camera_controls.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_synapse_camera_controls.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_lighting.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_adhd_data.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_ga.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_ui_3d_geometry.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_ui_3d_brain.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_ui_3d_neuron.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_ui_3d_synapse.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_ui_3d_stats.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_ui_3d.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_controls.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_app.js', baseUrl);

            // Check if all modules are loaded
            if (window.GreenhouseNeuroApp && window.NeuroGA && window.GreenhouseNeuroUI3D) {
                console.log('Neuro App: All modules loaded successfully.');

                // Initialize the application
                // Use the selector captured from attributes
                if (targetSelector) {
                    window.GreenhouseNeuroApp.init(targetSelector, baseUrl);

                    // Render bottom navigation TOC via common utilities
                    if (GreenhouseUtils && typeof GreenhouseUtils.renderModelsTOC === 'function') {
                        GreenhouseUtils.renderModelsTOC(targetSelector);
                    }
                } else {
                    console.warn('Neuro App: No target selector provided, skipping auto-init.');
                }

            } else {
                throw new Error("One or more required Neuro App modules failed to load.");
            }
        } catch (error) {
            console.error('Neuro App: Initialization failed', error);
            // Optionally display a user-friendly error message on the page
            const container = document.querySelector(targetSelector) || document.getElementById('neuro-app-container');
            if (container) {
                container.innerHTML = `
                    <p style="color: red; text-align: center; margin-top: 50px;">
                        Error loading Neuro Simulation: ${error.message}.
                        Please ensure all dependencies are available.
                    </p>
                `;
            }
        }
    }

    // Delay main execution slightly to ensure all base scripts are parsed, especially important for WIX.
    // In many modern frameworks, this should be handled by dependency management.
    // For direct script injection, a slight delay can prevent race conditions.
    setTimeout(main, 100);

})();
