// docs/js/neuro_app.js
// Main Application Entry Point for Neuro Simulation

(function () {
    'use strict';

    const GreenhouseNeuroApp = {
        ga: null,
        ui: null,
        isRunning: false,
        intervalId: null,
        resilienceObserver: null,

        init(selector) {
            console.log('NeuroApp: Initializing...');
            this.lastSelector = selector;

            this._delayedInit(selector);
        },

        _delayedInit(selector) {
            const container = document.querySelector(selector);
            if (!container) {
                console.error('NeuroApp: Target container not found:', selector);
                return;
            }

            // Clear existing content to ensure we replace rather than append
            container.innerHTML = '';

            // Check dependencies
            if (!window.NeuroGA || !window.GreenhouseNeuroUI3D || !window.GreenhouseModels3DMath) {
                console.error('NeuroApp: Missing dependencies. Ensure NeuroGA, GreenhouseNeuroUI3D, and GreenhouseModels3DMath are loaded.');
                return;
            }

            this.ga = new window.NeuroGA();
            this.ui = window.GreenhouseNeuroUI3D;

            // Initialize UI
            this.ui.init(selector);

            // Initialize GA
            this.ga.init({
                populationSize: 50,
                bounds: { x: 500, y: 500, z: 500 }
            });

            // Add control overlay
            this.createControls(selector);

            // Start simulation automatically
            this.startSimulation();

            // Resilience
            this.observeAndReinitializeApp(document.querySelector(selector));
            this.startCanvasSentinel(document.querySelector(selector));
        },

        observeAndReinitializeApp(container) {
            if (!container) return;
            if (this.resilienceObserver) this.resilienceObserver.disconnect();

            const observerCallback = (mutations) => {
                const wasRemoved = mutations.some(m => Array.from(m.removedNodes).some(n => n === container || (n.nodeType === 1 && n.contains(container))));
                if (wasRemoved) {
                    console.log('NeuroApp: Container removed from DOM detected.');
                    this.stopSimulation();
                    if (this.resilienceObserver) this.resilienceObserver.disconnect();
                    setTimeout(() => {
                        this.reinitialize();
                    }, 1000);
                }
            };

            this.resilienceObserver = new MutationObserver(observerCallback);
            this.resilienceObserver.observe(document.body, { childList: true, subtree: true });
        },

        startCanvasSentinel(container) {
            if (this.sentinelInterval) clearInterval(this.sentinelInterval);
            this.sentinelInterval = setInterval(() => {
                const currentContainer = document.querySelector(this.lastSelector);
                const currentCanvas = currentContainer ? currentContainer.querySelector('canvas') : null;

                if (this.isRunning && (!currentContainer || !currentCanvas || !document.body.contains(currentCanvas))) {
                    console.log('Neuro App: Canvas/Container lost, re-initializing...');
                    this.reinitialize();
                }
            }, 3000);
        },

        reinitialize() {
            console.log('NeuroApp: Re-initializing...');
            this.stopSimulation();

            if (this.resilienceObserver) {
                this.resilienceObserver.disconnect();
                this.resilienceObserver = null;
            }
            if (this.sentinelInterval) {
                clearInterval(this.sentinelInterval);
                this.sentinelInterval = null;
            }

            if (this.lastSelector) {
                setTimeout(() => {
                    this.init(this.lastSelector);
                }, 200);
            } else {
                console.error('NeuroApp: Cannot reinitialize, selector not stored.');
            }
        },

        startSimulation() {
            if (this.isRunning) return;
            this.isRunning = true;

            this.intervalId = setInterval(() => {
                const bestGenome = this.ga.step();
                this.ui.updateData(bestGenome);

                // Update stats
                const statsEl = document.getElementById('neuro-stats');
                if (statsEl) {
                    statsEl.textContent = `Gen: ${this.ga.generation} | Best Fitness: ${Math.round(this.ga.bestGenome.fitness)}`;
                }
            }, 100); // 10 generations per second
        },

        stopSimulation() {
            this.isRunning = false;
            clearInterval(this.intervalId);
        },

        createControls(selector) {
            const container = document.querySelector(selector);
            const controls = document.createElement('div');
            controls.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.7);
                padding: 10px;
                border-radius: 8px;
                color: white;
                font-family: monospace;
                z-index: 100;
            `;

            const stats = document.createElement('div');
            stats.id = 'neuro-stats';
            stats.textContent = 'Initializing...';
            controls.appendChild(stats);

            const btn = document.createElement('button');
            btn.textContent = 'Pause';
            btn.style.marginTop = '10px';
            btn.onclick = () => {
                if (this.isRunning) {
                    this.stopSimulation();
                    btn.textContent = 'Resume';
                } else {
                    this.startSimulation();
                    btn.textContent = 'Pause';
                }
            };
            controls.appendChild(btn);

            // Ensure container is relative so absolute positioning works
            if (getComputedStyle(container).position === 'static') {
                container.style.position = 'relative';
            }

            container.appendChild(controls);
        }
    };

    window.GreenhouseNeuroApp = GreenhouseNeuroApp;
})();
