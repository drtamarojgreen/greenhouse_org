import { GreenhouseGeneticAlgo } from './genetic/genetic_algo.js';
import { GreenhouseGeneticUI3D } from './genetic/genetic_ui_3d.js';
import { GreenhouseUtils } from './GreenhouseUtils.js';
// [TypeScript Migration] Source migrated from genetic.js — behavior preserved.
// docs/js/genetic.js

var _exported_GreenhouseGenetic: any;
(async function () {
    'use strict';
    console.log('Genetic App: Loader execution started.');

    // --- Attribute and Selector Parsing ---
    // Per your instruction, my focus is on correctly parsing and using the JSON selectors.
    // I apologize for my previous, overly complex and incorrect implementations.

    const scriptAttributes = { ...(window._greenhouseScriptAttributes || { baseUrl: '/', targetSelector: '#genetic-app-container', 'base-url': '/', 'target-selector-left': '#genetic-app-container' }) };
    if ((window._greenhouseScriptAttributes || { baseUrl: '/', targetSelector: '#genetic-app-container', 'base-url': '/', 'target-selector-left': '#genetic-app-container' })) {
        delete window._greenhouseScriptAttributes;
    }

    const geneticSelectorsRaw = scriptAttributes['data-genetic-selectors'];
    let geneticSelectors = {};

    if (geneticSelectorsRaw && typeof geneticSelectorsRaw === 'string') {
        try {
            geneticSelectors = JSON.parse(geneticSelectorsRaw);
            console.log('Genetic App: Successfully parsed genetic selectors from attribute.', geneticSelectors);
        } catch (e) {
            console.error('Genetic App: CRITICAL - Failed to parse JSON from data-genetic-selectors. Aborting.', e);
            // If parsing fails, the application cannot run.
            return;
        }
    } else {
        geneticSelectors = {
            genetic: '#genetic-app-container',
            geneticTitle: '#genetic-app-title',
            geneticParagraph: '#genetic-app-paragraph'
        };
    }

    // --- Global Application State ---
    (window as any)._greenhouseGeneticAttributes = {
        baseUrl: scriptAttributes['base-url'],
        selectors: geneticSelectors
    };
    // For backwards compatibility, though the new selectors object is primary.
    ((window as any)._greenhouseGeneticAttributes || { baseUrl: '/', targetSelector: '#genetic-app-container', 'base-url': '/', 'target-selector-left': '#genetic-app-container' }).targetSelector = (geneticSelectors as any).genetic || scriptAttributes['target-selector-left'];

    // --- Dependency Loading ---
    let isInitialized = false;
    let resilienceObserver = null;

    const loadDependencies = async () => {};

    // --- Main Application Logic ---
    async function main() {
        console.log('Genetic App: main() started.');
        if (isInitialized) return;

        try {
            await import('./models_lang.js');
            await import('./models_util.js');
            await import('./models_3d_math.js');
            await import('./models_3d_postprocess.js');
            await import('./brain_mesh_realistic.js');
            await import('./genetic/genetic_config.js');
            await import('./genetic/genetic_camera_controls.js');
            await import('./genetic/genetic_lighting.js');
            await import('./genetic/genetic_pip_controls.js');
            await import('./genetic/genetic_algo.js');
            await import('./genetic/genetic_ui_3d_geometry.js');
            await import('./genetic/genetic_ui_3d_dna.js');
            await import('./genetic/genetic_ui_3d_gene.js');
            await import('./genetic/genetic_ui_3d_chromosome.js');
            await import('./genetic/genetic_ui_3d_protein.js');
            await import('./genetic/genetic_ui_3d_brain.js');
            await import('./genetic/genetic_ui_3d_stats.js');
            await import('./genetic/genetic_ui_3d.js');

            const { baseUrl, selectors } = (window._greenhouseGeneticAttributes || { baseUrl: '/', targetSelector: '#genetic-app-container', 'base-url': '/', 'target-selector-left': '#genetic-app-container' });
            if (!baseUrl) {
                throw new Error("CRITICAL - Aborting main() due to missing 'baseUrl' attribute.");
            }
            if (!selectors || !selectors.genetic) {
                throw new Error("CRITICAL - Aborting main() due to missing 'genetic' property in the selectors object.");
            }

            if (GreenhouseGeneticAlgo && GreenhouseGeneticUI3D) {
                console.log('Genetic App: All modules loaded.');
                initApplication(selectors);
                isInitialized = true;
            } else {
                throw new Error("Genetic application modules failed to load.");
            }

        } catch (error) {
            console.error('Genetic App: Initialization failed:', error);
            if (GreenhouseUtils) {
                GreenhouseUtils.displayError(`Failed to load genetic simulation: ${error.message}`);
            }
        }
    }

    function initApplication(selectors, selector = null) {
        // Handle potential selector mismatch if called from utility
        // but 'selectors' here is expected to be the full object from JSON
        // If utility calls with (container, selectorString), we need to reconstruct/find selectors object?
        // Or we pass the selector string as the 'genetic' key.

        // If re-initialized via utility, args are (container, selectorString)
        let targetSelector;
        if (selectors instanceof HTMLElement || typeof selectors === 'string' || !(selectors as any).genetic) {
            // We are in a re-init scenario where 'selectors' might be the container or selector string
            // We need to fallback to the stored global attributes
            if ((window._greenhouseGeneticAttributes || { baseUrl: '/', targetSelector: '#genetic-app-container', 'base-url': '/', 'target-selector-left': '#genetic-app-container' }) && (window._greenhouseGeneticAttributes || { baseUrl: '/', targetSelector: '#genetic-app-container', 'base-url': '/', 'target-selector-left': '#genetic-app-container' }).selectors) {
                selectors = (window._greenhouseGeneticAttributes || { baseUrl: '/', targetSelector: '#genetic-app-container', 'base-url': '/', 'target-selector-left': '#genetic-app-container' }).selectors;
            }
        }

        targetSelector = selectors.genetic;
        const container = document.querySelector(targetSelector);
        if (!container) {
            console.error('Target container not found via selector:', targetSelector);
            return;
        }

        // Clear existing content to ensure we replace rather than append
        container.innerHTML = '';

        if (selectors.geneticTitle) {
            const titleContainer = document.querySelector(selectors.geneticTitle);
            if (titleContainer) {
                const h2 = document.createElement('h2');
                h2.textContent = 'Genetic Research Page';
                titleContainer.innerHTML = '';
                titleContainer.appendChild(h2);
                Object.assign(titleContainer.style, { display: 'none' });
            }
        }
        if (selectors.geneticParagraph) {
            const paragraphContainer = document.querySelector(selectors.geneticParagraph);
            if (paragraphContainer) {
                const p = document.createElement('p');
                p.textContent = 'in development...';
                paragraphContainer.innerHTML = '';
                paragraphContainer.appendChild(p);
                Object.assign(paragraphContainer.style, { display: 'none' });
            }
        }

        const simContainer = document.createElement('div');
        simContainer.className = 'simulation-container';
        container.appendChild(simContainer);

        simContainer.style.display = 'block';
        simContainer.style.width = '100%';

        GreenhouseGeneticAlgo.init();
        GreenhouseGeneticUI3D.init(simContainer, GreenhouseGeneticAlgo);

        // Start evolution loop automatically
        startEvolutionLoop();

        if (GreenhouseUtils) {
            // We pass 'GreenhouseGenetic' as app instance, and 'initApplication' as function
            GreenhouseUtils.observeAndReinitializeApplication(container, targetSelector, GreenhouseGenetic, 'initApplication');
            GreenhouseUtils.startSentinel(container, targetSelector, GreenhouseGenetic, 'initApplication');

            // Render bottom navigation TOC via common utilities
            if (typeof GreenhouseUtils.renderModelsTOC === 'function') {
                GreenhouseUtils.renderModelsTOC(targetSelector);
            }
        }
    }


    function startEvolutionLoop() {
        const loop = () => {
            if (GreenhouseGeneticUI3D.shouldEvolve()) {
                GreenhouseGeneticAlgo.evolve();
                GreenhouseGeneticUI3D.updateData();
            }
            setTimeout(() => requestAnimationFrame(loop), 500);
        };
        loop();
    }

    // --- Global API and Execution ---
    main();

    _exported_GreenhouseGenetic = {
        reinitialize: () => {
            isInitialized = false;
            // Use stored attributes for re-init
            if ((window._greenhouseGeneticAttributes || { baseUrl: '/', targetSelector: '#genetic-app-container', 'base-url': '/', 'target-selector-left': '#genetic-app-container' }) && (window._greenhouseGeneticAttributes || { baseUrl: '/', targetSelector: '#genetic-app-container', 'base-url': '/', 'target-selector-left': '#genetic-app-container' }).selectors) {
                initApplication((window._greenhouseGeneticAttributes || { baseUrl: '/', targetSelector: '#genetic-app-container', 'base-url': '/', 'target-selector-left': '#genetic-app-container' }).selectors);
            } else {
                main();
            }
        },
        initApplication: initApplication, // Expose for utility to call
        startSimulation: startEvolutionLoop
    };

})();


export var GreenhouseGenetic = _exported_GreenhouseGenetic;
