// docs/js/genetic.js
// REFACTORED Loader for the Genetic Simulation Application

(async function () {
    'use strict';

    // 1. Create a dedicated config object
    const geneticConfig = {
        baseUrl: './',
        targetSelector: null,
        utils: null
    };

    /**
     * Captures configuration from the script tag.
     */
    function captureAttributes() {
        const script = document.currentScript || document.querySelector('script[src*="genetic.js"]');
        if (script) {
            geneticConfig.baseUrl = script.getAttribute('data-base-url') || geneticConfig.baseUrl;
            geneticConfig.targetSelector = script.getAttribute('data-target-selector') || '#genetic-app-container';
        }
        console.log('Genetic App: Configured with', geneticConfig);
    }

    /**
     * Loads GreenhouseUtils using the dependency manager.
     */
    async function loadCoreDependencies() {
        if (!window.GreenhouseDependencyManager) {
            throw new Error('GreenhouseDependencyManager is required but not found.');
        }
        try {
            await window.GreenhouseDependencyManager.waitFor('utils', 8000);
            geneticConfig.utils = window.GreenhouseUtils;
        } catch (error) {
            console.error('Genetic App: Failed to load GreenhouseUtils.', error);
            throw error;
        }
    }

    /**
     * Main application logic.
     */
    async function main() {
        console.log('Genetic App: Loader main() started.');

        try {
            captureAttributes();

            if (!document.querySelector(geneticConfig.targetSelector)) {
                throw new Error(`Target selector "${geneticConfig.targetSelector}" not found in the DOM.`);
            }

            await loadCoreDependencies();
            const { utils, baseUrl } = geneticConfig;

            // Decoupled script list, using the new genetic_geometry.js
            const scriptsToLoad = [
                'js/models_3d_math.js',
                'js/brain_mesh_realistic.js', // Dependency for geometry
                'js/genetic_geometry.js',     // <-- USE THE NEW DECOUPLED GEOMETRY
                'js/genetic_config.js',
                'js/genetic_camera_controls.js',
                'js/genetic_lighting.js',
                'js/genetic_pip_controls.js',
                'js/genetic_algo.js',
                'js/genetic_ui_3d_dna.js',
                'js/genetic_ui_3d_gene.js',
                'js/genetic_ui_3d_chromosome.js',
                'js/genetic_ui_3d_protein.js',
                'js/genetic_ui_3d_brain.js',
                'js/genetic_ui_3d_stats.js',
                'js/genetic_ui_3d.js'
            ];

            for (const script of scriptsToLoad) {
                await utils.loadScript(script, baseUrl);
            }

            // Health Check
            const requiredModules = ['GreenhouseGeneticAlgo', 'GreenhouseGeneticUI3D', 'GreenhouseGeneticGeometry'];
            const missing = requiredModules.filter(m => !window[m]);
            if (missing.length > 0) {
                throw new Error(`Missing critical modules: ${missing.join(', ')}`);
            }

            console.log('Genetic App: All modules loaded successfully.');
            // Directly initialize the application now that everything is loaded.
            initApplication(geneticConfig.targetSelector);

        } catch (error) {
            console.error('Genetic App: CRITICAL FAILURE during initialization.', error);
            const target = document.querySelector(geneticConfig.targetSelector || 'body');
            if (target) {
                target.innerHTML = `<div style="color: red; padding: 20px;">Error: ${error.message}</div>`;
            }
        }
    }

    /**
     * Initializes the UI components.
     * @param {string} targetSelector - The CSS selector for the main container.
     */
    function initApplication(targetSelector) {
        const container = document.querySelector(targetSelector);
        if (!container) {
            console.error(`Genetic App: Container ${targetSelector} not found for init.`);
            return;
        }

        // Hide loading overlay and show the simulation container
        const loadingOverlay = container.querySelector('.loading-overlay');
        if (loadingOverlay) loadingOverlay.style.display = 'none';

        const simContainer = container.querySelector('.simulation-container');
        if (simContainer) simContainer.style.display = 'block';

        // Initialize the main application components
        window.GreenhouseGeneticAlgo.init();
        window.GreenhouseGeneticUI3D.init(simContainer || container, window.GreenhouseGeneticAlgo);

        console.log('Genetic App: UI Initialized.');

        // Expose a global controller for starting the simulation from the UI
        window.GreenhouseGenetic = {
            startSimulation: () => {
                const loop = () => {
                    if (window.GreenhouseGeneticUI3D.shouldEvolve()) {
                        window.GreenhouseGeneticAlgo.evolve();
                        window.GreenhouseGeneticUI3D.updateData();
                    }
                    requestAnimationFrame(loop);
                };
                loop();
            }
        };
    }

    // Defer execution until the DOM is ready.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }

})();

    function initApplication(selectors) {
        const targetSelector = selectors.genetic;
        const container = document.querySelector(targetSelector);
        if (!container) {
            console.error('Target container not found via selector:', targetSelector);
            return;
        }

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

        const loadingScreen = container.querySelector('.loading-screen');
        if (loadingScreen) loadingScreen.style.display = 'none';

        let simContainer = container.querySelector('.simulation-container');
        if (!simContainer) {
            simContainer = document.createElement('div');
            simContainer.className = 'simulation-container';
            container.appendChild(simContainer);
        }
        simContainer.style.display = 'block';
        simContainer.style.width = '100%';

        window.GreenhouseGeneticAlgo.init();
        window.GreenhouseGeneticUI3D.init(simContainer, window.GreenhouseGeneticAlgo);
        observeAndReinitializeApp(container);
    }

    function observeAndReinitializeApp(container) {
        if (!container) return;
        const observerCallback = (mutations) => {
            const wasRemoved = mutations.some(m => Array.from(m.removedNodes).some(n => n.nodeType === 1 && n.classList.contains('simulation-container')));
            if (wasRemoved) {
                if (resilienceObserver) resilienceObserver.disconnect();
                setTimeout(() => {
                    if (window.GreenhouseGenetic && typeof window.GreenhouseGenetic.reinitialize === 'function') {
                        window.GreenhouseGenetic.reinitialize();
                    }
                }, 5000);
            }
        };
        resilienceObserver = new MutationObserver(observerCallback);
        resilienceObserver.observe(container, { childList: true });
    }

    function startEvolutionLoop() {
        const loop = () => {
            if (window.GreenhouseGeneticUI3D.shouldEvolve()) {
                window.GreenhouseGeneticAlgo.evolve();
                window.GreenhouseGeneticUI3D.updateData();
            }
            setTimeout(() => requestAnimationFrame(loop), 500);
        };
        loop();
    }

    // --- Global API and Execution ---
    main();

    window.GreenhouseGenetic = {
        reinitialize: () => {
            isInitialized = false;
            main();
        },
        startSimulation: startEvolutionLoop
    };

})();
