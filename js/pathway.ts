import { GreenhouseUtils } from './GreenhouseUtils.js';
import { GreenhousePathwayViewer } from './pathway/pathway_viewer.js';
import { V8GraphRenderer } from './V8GraphRenderer.js';
// [TypeScript Migration] Source migrated from pathway.js — behavior preserved.
// docs/js/pathway.js
// Entry point and dependency loader for the Pathway Viewer application.

var _exported_GreenhousePathwayApp: any;
(function () {
    'use strict';

    const GreenhousePathwayApp = {

        
        async init(containerSelector: any, baseUrl: any) {
            try {
            await import('./models_lang.js');
            await import('./models_util.js');
            await import('./models_3d_math.js');
            await import('./brain_mesh_realistic.js');
            await import('./pathway/pathway_ui_3d_geometry.js');
            await import('./pathway/pathway_camera_controls.js');
            await import('./pathway/pathway_ui_3d_brain.js');
            await import('./reactome_parser.js');
            await import('./pathway/pathway_viewer.js');
            await import('./V8GraphRenderer.js');
                const base = baseUrl && !baseUrl.endsWith('/') ? baseUrl + '/' : (baseUrl || '');
                // Define the correct loading order for the native 3D engine and our application
                

                // All scripts are loaded, now initialize the main viewer
                if (GreenhousePathwayViewer) {
                    console.log('Pathway App: All modules loaded. Initializing...');
                    GreenhousePathwayViewer.init(containerSelector, base);

                    // Render bottom navigation TOC via common utilities
                    if (GreenhouseUtils && typeof GreenhouseUtils.renderModelsTOC === 'function') {
                        GreenhouseUtils.renderModelsTOC(containerSelector);
                    }
                } else {
                    console.error('Pathway App: GreenhousePathwayViewer failed to load.');
                }

            } catch (error) {
                console.error('Pathway App: Failed to load critical dependencies.', error);
            }
        }
    };

    _exported_GreenhousePathwayApp = GreenhousePathwayApp;

    // --- Main Execution Logic ---
    function captureAttributes() {
        // 1. Try global object (set by GreenhouseUtils)
        if ((window._greenhouseScriptAttributes || { baseUrl: '/', targetSelector: '#pathway-app-container', 'base-url': '/', 'target-selector-left': '#pathway-app-container' })) {
            const attrs = (window._greenhouseScriptAttributes || { baseUrl: '/', targetSelector: '#pathway-app-container', 'base-url': '/', 'target-selector-left': '#pathway-app-container' });
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


export var GreenhousePathwayApp = _exported_GreenhousePathwayApp;
