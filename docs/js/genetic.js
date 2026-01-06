// docs/js/genetic.js

(async function () {
    'use strict';
    console.log('Genetic App: Loader execution started.');

    let GreenhouseUtils;
    let isInitialized = false;
    let resilienceObserver = null;

    const loadDependencies = async () => {
        console.log('Genetic App: loadDependencies started.');
        if (window.GreenhouseDependencyManager) {
            try {
                await window.GreenhouseDependencyManager.waitFor('utils', 12000);
                console.log('Genetic App: GreenhouseUtils loaded via dependency manager');
            } catch (error) {
                console.error('Genetic App: Failed to load GreenhouseUtils via dependency manager:', error.message);
            }
        } else {
            // Fallback polling
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
        if (window._greenhouseGeneticAttributes) {
            return true;
        }

        // Immediately capture and then clean up the global attributes from the loader
        const scriptAttributes = { ...window._greenhouseScriptAttributes };
        if (window._greenhouseScriptAttributes) {
            delete window._greenhouseScriptAttributes;
        }

        const geneticSelectorsRaw = scriptAttributes['data-genetic-selectors'];
        let selectors = {};
        if (geneticSelectorsRaw) {
            try {
                // We are getting the raw string from the global var, so no decoding is needed
                selectors = JSON.parse(geneticSelectorsRaw);
            } catch (e) {
                console.error('Genetic App: Failed to parse genetic selectors.', e);
            }
        }

        window._greenhouseGeneticAttributes = {
            baseUrl: scriptAttributes['base-url'],
            selectors: selectors
        };

        // For backwards compatibility, also keep targetSelector
        window._greenhouseGeneticAttributes.targetSelector = window._greenhouseGeneticAttributes.selectors.genetic || scriptAttributes['target-selector-left'];

        return true;
    };

    async function main() {
        console.log('Genetic App: main() started.');
        if (isInitialized) return;

        try {
            if (!captureScriptAttributes()) {
                throw new Error("Could not capture script attributes.");
            }

            await loadDependencies();
            if (!GreenhouseUtils) {
                throw new Error("CRITICAL - Aborting main() due to missing GreenhouseUtils.");
            }

            const { baseUrl, selectors } = window._greenhouseGeneticAttributes;
            if (!baseUrl) {
                throw new Error("CRITICAL - Aborting main() due to missing data-base-url attribute.");
            }

            // Load Core 3D Math Module (reused)
            await GreenhouseUtils.loadScript('models_3d_math.js', baseUrl);

            // Load Configuration and Enhancement Modules
            await GreenhouseUtils.loadScript('genetic_config.js', baseUrl);
            await GreenhouseUtils.loadScript('genetic_camera_controls.js', baseUrl);
            await GreenhouseUtils.loadScript('genetic_lighting.js', baseUrl);
            await GreenhouseUtils.loadScript('genetic_pip_controls.js', baseUrl);

            // Load Genetic Modules
            await GreenhouseUtils.loadScript('genetic_algo.js', baseUrl);
            await GreenhouseUtils.loadScript('neuro_ui_3d_geometry.js', baseUrl);
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

                // Initialize Application
                setTimeout(() => {
                    initApplication(selectors);
                    isInitialized = true;
                }, 5000);
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
            console.error('Target container not found:', targetSelector);
            return;
        }

        // Handle Title and Paragraph
        if (selectors.geneticTitle) {
            const titleContainer = document.querySelector(selectors.geneticTitle);
            if (titleContainer) {
                const h2 = document.createElement('h2');
                h2.textContent = 'Genetic Research Page';
                titleContainer.innerHTML = ''; // Clear existing content
                titleContainer.appendChild(h2);
                Object.assign(titleContainer.style, { display: 'block', width: '20%', float: 'left' });
            }
        }
        if (selectors.geneticParagraph) {
            const paragraphContainer = document.querySelector(selectors.geneticParagraph);
            if (paragraphContainer) {
                const p = document.createElement('p');
                p.textContent = 'in development...';
                paragraphContainer.innerHTML = ''; // Clear existing content
                paragraphContainer.appendChild(p);
                Object.assign(paragraphContainer.style, { display: 'block', width: '20%', float: 'left' });
            }
        }

        // Hide loading screen
        const loadingScreen = container.querySelector('.loading-screen');
        if (loadingScreen) loadingScreen.style.display = 'none';

        // Show simulation container
        let simContainer = container.querySelector('.simulation-container');
        if (!simContainer) {
            simContainer = document.createElement('div');
            simContainer.className = 'simulation-container';
            container.appendChild(simContainer);
        }
        simContainer.style.display = 'block';

        // Initialize Genetic Algorithm
        window.GreenhouseGeneticAlgo.init();

        // Initialize 3D UI
        window.GreenhouseGeneticUI3D.init(simContainer, window.GreenhouseGeneticAlgo);

        // Start Evolution Loop
        // Start Evolution Loop
        // startEvolutionLoop(); // Started by UI overlay

        // Resilience
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
        let isRunning = true;

        const loop = () => {
            if (!isRunning) return;

            // Evolve one step if UI allows
            if (window.GreenhouseGeneticUI3D.shouldEvolve()) {
                window.GreenhouseGeneticAlgo.evolve();
                window.GreenhouseGeneticUI3D.updateData();
            }

            // Render is handled by UI's internal loop or requestAnimationFrame

            // Schedule next evolution step (slowed down for visualization)
            setTimeout(() => {
                requestAnimationFrame(loop);
            }, 100);
        };

        loop();
    }

    // Run Main
    main();

    // Global Resilience
    window.GreenhouseGenetic = {
        reinitialize: () => {
            if (resilienceObserver) {
                resilienceObserver.disconnect();
                resilienceObserver = null;
            }
            isInitialized = false;
            main();
        },
        startSimulation: () => {
            startEvolutionLoop();
        }
    };

})();
