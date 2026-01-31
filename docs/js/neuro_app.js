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

        init(selector, selArg = null) {
            // Standardize selector argument handling if re-invoked
            if (typeof selector !== 'string' && selArg) selector = selArg;

            console.log('NeuroApp: Initializing...');
            this.lastSelector = selector;

            const container = document.querySelector(selector);
            if (!container) {
                console.error('NeuroApp: Target container not found:', selector);
                return;
            }

            this._delayedInit(container, selector);
        },

        _delayedInit(container, selector) {
            // Clear existing content to ensure we replace rather than append
            container.innerHTML = '';

            // Check dependencies
            if (!window.NeuroGA || !window.GreenhouseNeuroUI3D || !window.GreenhouseModels3DMath) {
                console.error('NeuroApp: Missing dependencies. Ensure NeuroGA, GreenhouseNeuroUI3D, and GreenhouseModels3DMath are loaded.');
                return;
            }

            this.ga = new window.NeuroGA();
            this.ui = window.GreenhouseNeuroUI3D;

            // Handle Language Change
            window.addEventListener('greenhouse:language-changed', () => {
                this.refreshUIText();
            });

            // Initialize UI
            this.ui.init(selector);

            // Initialize GA
            this.ga.init({
                populationSize: 50,
                bounds: { x: 500, y: 500, z: 500 }
            });

            // Add control overlay
            this.createControls(container);

            // Start simulation automatically
            this.startSimulation();

            // Resilience using shared GreenhouseUtils
            if (window.GreenhouseUtils) {
                window.GreenhouseUtils.observeAndReinitializeApplication(container, selector, this, 'init');
                window.GreenhouseUtils.startSentinel(container, selector, this, 'init');
            }
        },

        refreshUIText() {
            const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
            const btn = document.getElementById('neuro-pause-btn');
            if (btn) {
                btn.textContent = this.isRunning ? t('btn_pause') : t('btn_play');
            }
            const statsEl = document.getElementById('neuro-stats');
            if (statsEl && this.ga) {
                if (this.ga.generation === 0) {
                    statsEl.textContent = t('initializing');
                } else {
                    statsEl.textContent = `${t('gen')}: ${this.ga.generation} | ${t('best_fitness')}: ${Math.round(this.ga.bestGenome.fitness)}`;
                }
            }
        },

        startSimulation() {
            if (this.isRunning) return;
            this.isRunning = true;
            const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

            this.intervalId = setInterval(() => {
                const bestGenome = this.ga.step();
                this.ui.updateData(bestGenome);

                // Update stats
                const statsEl = document.getElementById('neuro-stats');
                if (statsEl) {
                    statsEl.textContent = `${t('gen')}: ${this.ga.generation} | ${t('best_fitness')}: ${Math.round(this.ga.bestGenome.fitness)}`;
                }
            }, 100); // 10 generations per second
        },

        stopSimulation() {
            this.isRunning = false;
            clearInterval(this.intervalId);
        },

        createControls(container) {
            const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
            const isMobile = window.GreenhouseUtils && window.GreenhouseUtils.isMobileUser();
            const controls = document.createElement('div');
            if (isMobile) controls.style.display = 'none';
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
            stats.textContent = t('initializing');
            controls.appendChild(stats);

            const btn = document.createElement('button');
            btn.id = 'neuro-pause-btn';
            btn.textContent = t('btn_pause');
            btn.style.marginTop = '10px';
            btn.onclick = () => {
                if (this.isRunning) {
                    this.stopSimulation();
                    btn.textContent = t('btn_play');
                } else {
                    this.startSimulation();
                    btn.textContent = t('btn_pause');
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
