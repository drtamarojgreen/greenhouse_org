// docs/js/neuro_app.js
// Main Application Entry Point for Neuro Simulation

(function () {
    'use strict';

    const GreenhouseNeuroApp = {
        ga: null,
        ui: null,
        isRunning: false,
        isRunning: false,
        intervalId: null,
        resilienceObserver: null,

        init(selector) {
            console.log('NeuroApp: Initializing...');
            this.lastSelector = selector;

            setTimeout(() => {
                this._delayedInit(selector);
            }, 5000);
        },

        _delayedInit(selector) {

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

            // Start loop
            // Start loop
            // this.startSimulation(); // Started by UI overlay

            // Add control overlay
            this.createControls(selector);

            // Resilience
            this.observeAndReinitializeApp(document.querySelector(selector));
        },

        observeAndReinitializeApp(container) {
            if (!container) return;
            const observerCallback = (mutations) => {
                const wasRemoved = mutations.some(m => Array.from(m.removedNodes).some(n => n.nodeType === 1 && n.id === 'neuro-stats')); // Check for removal of controls or canvas
                if (wasRemoved) {
                    if (this.resilienceObserver) this.resilienceObserver.disconnect();
                    setTimeout(() => {
                        if (window.GreenhouseNeuroApp && typeof window.GreenhouseNeuroApp.reinitialize === 'function') {
                            window.GreenhouseNeuroApp.reinitialize();
                        }
                    }, 5000);
                }
            };
            this.resilienceObserver = new MutationObserver(observerCallback);
            this.resilienceObserver.observe(container, { childList: true });
        },

        reinitialize() {
            console.log('NeuroApp: Re-initializing...');
            if (this.resilienceObserver) {
                this.resilienceObserver.disconnect();
                this.resilienceObserver = null;
            }
            this.stopSimulation();
            // Re-run main logic if possible, or just re-call init if we have the selector.
            // Since init takes a selector, we need to store it or re-capture it.
            // But this object is global. We can just call init again with the stored selector if we had it.
            // However, the loader (neuro.js) calls init.
            // Let's look at how genetic.js does it: it calls main() which re-captures attributes.
            // neuro.js has a main() but it's not exposed.
            // We need to expose a way to re-run the loader logic or just re-init the app.
            // If we just re-init the app, we need the selector.
            // Let's assume the selector hasn't changed.
            // But wait, neuro.js is the one that captures attributes.
            // If we want to fully re-initialize, we should probably reload the script or re-run the loader.
            // But the loader is an IIFE.
            // Let's check neuro.js again. It doesn't expose a reinitialize on window.GreenhouseNeuroApp, it exposes it on window.GreenhouseNeuroApp (wait, no, neuro.js exposes nothing, neuro_app.js exposes GreenhouseNeuroApp).
            // neuro.js (the loader) doesn't expose anything.
            // So we can't easily re-run the loader.
            // However, we can make neuro_app.js handle the re-init if it knows the selector.
            // We should store the selector in init.
            if (this.lastSelector) {
                this.init(this.lastSelector);
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
