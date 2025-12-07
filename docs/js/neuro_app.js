// docs/js/neuro_app.js
// Main Application Entry Point for Neuro Simulation

(function() {
    'use strict';

    const GreenhouseNeuroApp = {
        ga: null,
        ui: null,
        isRunning: false,
        intervalId: null,

        init(selector) {
            console.log('NeuroApp: Initializing...');

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
            this.startSimulation();

            // Add control overlay
            this.createControls(selector);
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
