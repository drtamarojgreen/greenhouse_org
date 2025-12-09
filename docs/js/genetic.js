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
        const scriptElement = document.currentScript;
        if (!scriptElement) {
            console.error('Genetic App: Could not find current script element.');
            return false;
        }
        window._greenhouseGeneticAttributes = {
            baseUrl: scriptElement.getAttribute('data-base-url'),
            targetSelector: scriptElement.getAttribute('data-target-selector-left') || scriptElement.getAttribute('data-target-selector')
        };
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

            const { baseUrl, targetSelector } = window._greenhouseGeneticAttributes;
            if (!baseUrl) {
                throw new Error("CRITICAL - Aborting main() due to missing data-base-url attribute.");
            }

            // Load Core 3D Math Module (reused)
            await GreenhouseUtils.loadScript('models_3d_math.js', baseUrl);

            // Load Genetic Modules
            await GreenhouseUtils.loadScript('genetic_algo.js', baseUrl);
            await GreenhouseUtils.loadScript('genetic_ui_3d.js', baseUrl);

            if (window.GreenhouseGeneticAlgo && window.GreenhouseGeneticUI3D) {
                console.log('Genetic App: All modules loaded.');

                // Initialize Application
                setTimeout(() => {
                    initApplication(targetSelector);
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

    function initApplication(targetSelector) {
        const container = document.querySelector(targetSelector);
        if (!container) {
            console.error('Target container not found:', targetSelector);
            return;
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
