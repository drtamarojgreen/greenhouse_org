// docs/js/pathway.js
// Entry point and dependency loader for the Pathway Viewer application.

(function () {
    'use strict';

    const GreenhousePathwayApp = {

        loadScript(url) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = url;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        },

        async init(containerSelector, baseUrl) {
            try {
                const base = baseUrl && !baseUrl.endsWith('/') ? baseUrl + '/' : (baseUrl || '');
                // Define the correct loading order for the native 3D engine and our application
                const scriptsToLoad = [
                    'js/models_util.js',
                    'js/models_3d_math.js',
                    'js/brain_mesh_realistic.js',
                    'js/pathway_ui_3d_geometry.js',
                    'js/pathway_camera_controls.js',
                    'js/pathway_ui_3d_brain.js',
                    'js/pathway_viewer.js'
                ];

                for (const script of scriptsToLoad) {
                    await this.loadScript(base + script);
                }

                // All scripts are loaded, now initialize the main viewer
                if (window.GreenhousePathwayViewer) {
                    console.log('Pathway App: All modules loaded. Initializing...');
                    window.GreenhousePathwayViewer.init(containerSelector, base);

                    // Render bottom navigation TOC via common utilities
                    if (window.GreenhouseUtils && typeof window.GreenhouseUtils.renderModelsTOC === 'function') {
                        window.GreenhouseUtils.renderModelsTOC(containerSelector);
                    }
                } else {
                    console.error('Pathway App: GreenhousePathwayViewer failed to load.');
                }

            } catch (error) {
                console.error('Pathway App: Failed to load critical dependencies.', error);
            }
        }
    };

    window.GreenhousePathwayApp = GreenhousePathwayApp;

    // --- Main Execution Logic ---
    function captureAttributes() {
        // 1. Try global object (set by GreenhouseUtils)
        if (window._greenhouseScriptAttributes) {
            const attrs = window._greenhouseScriptAttributes;
            return {
                targetSelector: attrs['target-selector-left'],
                baseUrl: attrs['base-url']
            };
        }

        // 2. Try current script attributes
        const script = document.currentScript;
        if (script) {
            return {
                targetSelector: script.getAttribute('data-target-selector-left'),
                baseUrl: script.getAttribute('data-base-url')
            };
        }

        // 3. Fallback: Find script by src
        const scripts = document.querySelectorAll('script[src*="pathway.js"]');
        if (scripts.length > 0) {
            const lastScript = scripts[scripts.length - 1];
            return {
                targetSelector: lastScript.getAttribute('data-target-selector-left'),
                baseUrl: lastScript.getAttribute('data-base-url')
            };
        }

        return { targetSelector: null, baseUrl: null };
    }

    function main() {
        const { targetSelector, baseUrl } = captureAttributes();

        if (targetSelector && baseUrl) {
            console.log('Pathway App: Attributes captured. Starting init sequence.');
            GreenhousePathwayApp.init(targetSelector, baseUrl);
        } else {
            console.warn('Pathway App: Attributes not found immediately. Retrying in 100ms...');
            setTimeout(() => {
                const retry = captureAttributes();
                if (retry.targetSelector && retry.baseUrl) {
                    console.log('Pathway App: Attributes captured on retry.');
                    GreenhousePathwayApp.init(retry.targetSelector, retry.baseUrl);
                } else {
                    console.error('Pathway App: Missing configuration attributes after retry.', retry);
                }
            }, 100);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }
})();
