// docs/js/genetic.js

(async function () {
    'use strict';
    console.log('Genetic App: Loader execution started.');

    // --- Attribute and Selector Parsing ---
    // Per your instruction, my focus is on correctly parsing and using the JSON selectors.
    // I apologize for my previous, overly complex and incorrect implementations.

    const scriptAttributes = { ...window._greenhouseScriptAttributes };
    if (window._greenhouseScriptAttributes) {
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
        console.error('Genetic App: CRITICAL - data-genetic-selectors attribute is missing, empty, or not a string. Aborting.');
        return;
    }

    // --- Global Application State ---
    window._greenhouseGeneticAttributes = {
        baseUrl: scriptAttributes['base-url'],
        selectors: geneticSelectors
    };
    // For backwards compatibility, though the new selectors object is primary.
    window._greenhouseGeneticAttributes.targetSelector = geneticSelectors.genetic || scriptAttributes['target-selector-left'];

    // --- Dependency Loading ---
    let GreenhouseUtils;
    let isInitialized = false;
    let resilienceObserver = null;

    const loadDependencies = async () => {
        // This function remains to ensure GreenhouseUtils is available for loading sub-modules.
        await new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 240;
            const interval = setInterval(() => {
                if (window.GreenhouseUtils) {
                    clearInterval(interval);
                    GreenhouseUtils = window.GreenhouseUtils;
                    resolve();
                } else if (attempts++ >= maxAttempts) {
                    clearInterval(interval);
                    reject(new Error('GreenhouseUtils load timeout'));
                }
            }, 50);
        });
    };

    // --- Main Application Logic ---
    async function main() {
        console.log('Genetic App: main() started.');
        if (isInitialized) return;

        try {
            await loadDependencies();

            const { baseUrl, selectors } = window._greenhouseGeneticAttributes;
            if (!baseUrl) {
                throw new Error("CRITICAL - Aborting main() due to missing 'baseUrl' attribute.");
            }
            if (!selectors || !selectors.genetic) {
                throw new Error("CRITICAL - Aborting main() due to missing 'genetic' property in the selectors object.");
            }

            await GreenhouseUtils.loadScript('models_3d_math.js', baseUrl);
            await GreenhouseUtils.loadScript('genetic_config.js', baseUrl);
            await GreenhouseUtils.loadScript('genetic_camera_controls.js', baseUrl);
            await GreenhouseUtils.loadScript('genetic_lighting.js', baseUrl);
            await GreenhouseUtils.loadScript('genetic_pip_controls.js', baseUrl);
            await GreenhouseUtils.loadScript('genetic_algo.js', baseUrl);
            await GreenhouseUtils.loadScript('genetic_ui_3d_geometry.js', baseUrl);
            await GreenhouseUtils.loadScript('genetic_ui_3d_dna.js', baseUrl);
            await GreenhouseUtils.loadScript('genetic_ui_3d_gene.js', baseUrl);
            await GreenhouseUtils.loadScript('genetic_ui_3d_chromosome.js', baseUrl);
            await GreenhouseUtils.loadScript('genetic_ui_3d_protein.js', baseUrl);
            await GreenhouseUtils.loadScript('genetic_ui_3d_brain.js', baseUrl);
            await GreenhouseUtils.loadScript('genetic_ui_3d_stats.js', baseUrl);
            await GreenhouseUtils.loadScript('genetic_ui_3d.js', baseUrl);

            if (window.GreenhouseGeneticAlgo && window.GreenhouseGeneticUI3D) {
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

    function initApplication(selectors) {
        const targetSelector = selectors.genetic;
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

        window.GreenhouseGeneticAlgo.init();
        window.GreenhouseGeneticUI3D.init(simContainer, window.GreenhouseGeneticAlgo);

        // Start evolution loop automatically
        startEvolutionLoop();

        observeAndReinitializeApp(container);
        startCanvasSentinel(container);
    }

    function observeAndReinitializeApp(container) {
        if (!container) return;
        if (resilienceObserver) resilienceObserver.disconnect();

        const observerCallback = (mutations) => {
            // Check if the main container or its specific child (sim container) was removed
            const wasRemoved = mutations.some(m => Array.from(m.removedNodes).some(n =>
                n === container ||
                (n.nodeType === 1 && n.contains(container)) ||
                (n.classList && n.classList.contains('simulation-container'))
            ));

            if (wasRemoved) {
                console.log('Genetic App: DOM element removal detected.');
                // We don't disconnect immediately if we are observing body, but we should pause logic
                if (window.GreenhouseGenetic && typeof window.GreenhouseGenetic.reinitialize === 'function') {
                    // Adding a small delay to allow React to finish operations
                    setTimeout(() => {
                        window.GreenhouseGenetic.reinitialize();
                    }, 1000);
                }
            }
        };

        resilienceObserver = new MutationObserver(observerCallback);
        resilienceObserver.observe(document.body, { childList: true, subtree: true });
    }

    let sentinelInterval = null;
    function startCanvasSentinel(container) {
        // Capture selector from global state or closure
        const selectors = window._greenhouseGeneticAttributes?.selectors || {};
        const targetSelector = selectors.genetic;

        if (sentinelInterval) clearInterval(sentinelInterval);
        sentinelInterval = setInterval(() => {
            // Check if Main Container exists in DOM
            const currentContainer = targetSelector ? document.querySelector(targetSelector) : null;

            // Check if Canvas exists
            const currentCanvas = currentContainer ? currentContainer.querySelector('canvas') : null;

            if (isInitialized) {
                if (!currentContainer || !currentCanvas || !document.body.contains(currentCanvas)) {
                    console.log('Genetic App: DOM lost, attempting re-initialization...');

                    // If the container is back (or different one found by selector), re-init
                    if (currentContainer && document.body.contains(currentContainer)) {
                        if (window.GreenhouseGenetic && typeof window.GreenhouseGenetic.reinitialize === 'function') {
                            window.GreenhouseGenetic.reinitialize();
                        }
                    } else {
                        // Container completely gone, wait for it to return (sentinel will keep checking)
                        // Maybe we need to actively try to re-run main() if container appears? 
                        // reinitialize() calls main(), which checks if container exists.
                        // So calling it is safe if it handles "container not found" gracefully.
                        if (window.GreenhouseGenetic && typeof window.GreenhouseGenetic.reinitialize === 'function') {
                            window.GreenhouseGenetic.reinitialize();
                        }
                    }
                }
            }
        }, 3000);
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
