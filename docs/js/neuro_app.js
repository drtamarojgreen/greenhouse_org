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
            const isMobile = window.GreenhouseUtils && window.GreenhouseUtils.isMobileUser();

            if (isMobile) {
                const staticTitle = document.querySelector('h1');
                if (staticTitle) staticTitle.style.display = 'none';
            }

            // Check dependencies
            if (!window.NeuroGA || !window.GreenhouseNeuroUI3D || !window.GreenhouseModels3DMath) {
                console.error('NeuroApp: Missing dependencies. Ensure NeuroGA, GreenhouseNeuroUI3D, and GreenhouseModels3DMath are loaded.');
                return;
            }

            // --- Create the protective wrapper div ---
            const simContainer = document.createElement('div');
            const simSelector = 'neuro-simulation-wrapper'; // A unique class for the wrapper
            simContainer.className = simSelector;
            simContainer.style.width = '100%';
            simContainer.style.height = '100%';
            simContainer.style.position = 'relative';
            container.appendChild(simContainer);
            // ---

            this.ga = new window.NeuroGA();
            this.ui = window.GreenhouseNeuroUI3D;

            // Handle Language Change
            window.addEventListener('greenhouseLanguageChanged', () => {
                this.refreshUIText();
            });

            // Initialize UI inside the new wrapper
            this.ui.init(`.${simSelector}`);

            // Initialize GA
            this.ga.init({
                populationSize: 50,
                bounds: { x: 500, y: 500, z: 500 }
            });

            // Add control overlay inside the new wrapper
            this.createControls(simContainer);

            // Start simulation automatically
            this.startSimulation();

            // Resilience should still observe the main container for removal
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
            const langBtn = document.getElementById('neuro-lang-toggle');
            if (langBtn) {
                langBtn.textContent = t('btn_language');
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

        switchMode(index) {
            if (!this.ga) return;
            // 0: Neural Network (Default), 1: Synaptic Density (Enhanced weights), 2: Burst Patterns (High activity)
            if (index === 1) {
                this.ga.populationSize = 80;
                console.log('NeuroApp: Mode -> Synaptic Density');
            } else if (index === 2) {
                this.ga.config = this.ga.config || {};
                this.ga.config.burstMode = true;
                console.log('NeuroApp: Mode -> Burst Patterns');
            } else {
                this.ga.populationSize = 50;
                if (this.ga.config) this.ga.config.burstMode = false;
                console.log('NeuroApp: Mode -> Neural Network');
            }
        },

        createControls(container) {
            const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
            const isMobile = window.GreenhouseUtils && window.GreenhouseUtils.isMobileUser();
            const controls = document.createElement('div');

            // Reduced layout for mobile: show controls but minimal
            controls.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                padding: ${isMobile ? '8px' : '15px'};
                border-radius: 12px;
                color: white;
                font-family: 'Quicksand', sans-serif;
                z-index: 100;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                border: 1px solid rgba(255,255,255,0.1);
                font-size: ${isMobile ? '12px' : '14px'};
            `;

            const stats = document.createElement('div');
            stats.id = 'neuro-stats';
            stats.textContent = t('initializing');
            stats.style.marginBottom = '8px';
            controls.appendChild(stats);

            const btnGroup = document.createElement('div');
            btnGroup.style.display = 'flex';
            btnGroup.style.flexDirection = isMobile ? 'row' : 'column';
            btnGroup.style.gap = '8px';

            const btn = document.createElement('button');
            btn.id = 'neuro-pause-btn';
            btn.textContent = t('btn_pause');
            btn.className = 'greenhouse-btn greenhouse-btn-primary';
            btn.style.fontSize = isMobile ? '12px' : '14px';
            btn.style.padding = '6px 12px';
            btn.onclick = () => {
                if (this.isRunning) {
                    this.stopSimulation();
                    btn.textContent = t('btn_play');
                } else {
                    this.startSimulation();
                    btn.textContent = t('btn_pause');
                }
            };
            btnGroup.appendChild(btn);

            // Minimal Language Toggle for the model
            const langBtn = document.createElement('button');
            langBtn.id = 'neuro-lang-toggle';
            langBtn.textContent = t('btn_language');
            langBtn.className = 'greenhouse-btn greenhouse-btn-secondary';
            langBtn.style.fontSize = isMobile ? '12px' : '14px';
            langBtn.style.padding = '6px 12px';
            langBtn.style.width = 'auto !important';
            langBtn.style.maxWidth = 'fit-content';
            langBtn.onclick = () => {
                if (window.GreenhouseModelsUtil) {
                    window.GreenhouseModelsUtil.toggleLanguage();
                }
            };
            btnGroup.appendChild(langBtn);

            controls.appendChild(btnGroup);

            // Ensure container is relative so absolute positioning works
            if (getComputedStyle(container).position === 'static') {
                container.style.position = 'relative';
            }

            container.appendChild(controls);
        }
    };

    window.GreenhouseNeuroApp = GreenhouseNeuroApp;
})();
