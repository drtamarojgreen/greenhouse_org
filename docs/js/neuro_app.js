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

            // Initialize ADHD UI
            this.initADHDUi(simContainer);

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
            const adhdBtn = document.getElementById('neuro-adhd-btn');
            if (adhdBtn) {
                adhdBtn.textContent = t('ADHD Lab');
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

        initADHDUi(container) {
            const adhdLab = document.createElement('div');
            adhdLab.id = 'neuro-adhd-lab';
            adhdLab.style.cssText = `
                position: absolute;
                top: 50px;
                left: 10px;
                width: 300px;
                max-height: 80vh;
                background: rgba(0, 0, 0, 0.9);
                border: 1px solid #4ca1af;
                border-radius: 8px;
                color: white;
                display: none;
                flex-direction: column;
                z-index: 1000;
                font-family: 'Quicksand', sans-serif;
            `;

            const header = document.createElement('div');
            header.style.padding = '10px';
            header.style.borderBottom = '1px solid #4ca1af';
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';
            header.innerHTML = `<h3 style="margin:0; font-size:16px;">ADHD Laboratory</h3>`;

            const closeBtn = document.createElement('button');
            closeBtn.textContent = '×';
            closeBtn.style.cssText = `background:none; border:none; color:white; font-size:20px; cursor:pointer;`;
            closeBtn.onclick = () => adhdLab.style.display = 'none';
            header.appendChild(closeBtn);
            adhdLab.appendChild(header);

            const searchInput = document.createElement('input');
            searchInput.placeholder = 'Search Enhancements...';
            searchInput.style.cssText = `
                margin: 10px;
                padding: 8px;
                border-radius: 4px;
                border: 1px solid #4ca1af;
                background: #111;
                color: white;
            `;
            adhdLab.appendChild(searchInput);

            const listContainer = document.createElement('div');
            listContainer.style.cssText = `overflow-y: auto; flex-grow: 1; padding: 10px;`;
            adhdLab.appendChild(listContainer);

            const renderList = (filter = '') => {
                listContainer.innerHTML = '';
                const data = window.GreenhouseADHDData;
                if (!data) return;

                Object.keys(data).forEach(cat => {
                    const catHeader = document.createElement('div');
                    catHeader.textContent = cat.toUpperCase();
                    catHeader.style.cssText = `font-weight: bold; margin-top: 10px; color: #4ca1af; border-bottom: 1px solid #333;`;
                    listContainer.appendChild(catHeader);

                    data[cat].forEach(item => {
                        if (filter && !item.name.toLowerCase().includes(filter.toLowerCase())) return;

                        const row = document.createElement('div');
                        row.style.cssText = `display: flex; align-items: center; padding: 5px 0; font-size: 12px;`;

                        const toggle = document.createElement('input');
                        toggle.type = 'checkbox';
                        toggle.checked = this.ga?.adhdConfig?.activeEnhancements.has(item.id);
                        toggle.onchange = (e) => {
                            this.ga?.setADHDEnhancement(item.id, e.target.checked);
                            if (this.ui?.adhdEffects) {
                                if (e.target.checked) this.ui.adhdEffects.activeEnhancements.add(item.id);
                                else this.ui.adhdEffects.activeEnhancements.delete(item.id);
                            }
                        };

                        const label = document.createElement('label');
                        label.textContent = item.name;
                        label.style.marginLeft = '8px';
                        label.title = item.description;

                        row.appendChild(toggle);
                        row.appendChild(label);
                        listContainer.appendChild(row);
                    });
                });
            };

            searchInput.oninput = (e) => renderList(e.target.value);
            renderList();

            container.appendChild(adhdLab);
            this.adhdLab = adhdLab;
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

            const adhdBtn = document.createElement('button');
            adhdBtn.id = 'neuro-adhd-btn';
            adhdBtn.textContent = t('ADHD Lab');
            adhdBtn.className = 'greenhouse-btn greenhouse-btn-primary';
            adhdBtn.style.fontSize = isMobile ? '12px' : '14px';
            adhdBtn.style.padding = '6px 12px';
            adhdBtn.onclick = () => {
                if (this.adhdLab) {
                    this.adhdLab.style.display = this.adhdLab.style.display === 'none' ? 'flex' : 'none';
                }
            };
            btnGroup.appendChild(adhdBtn);

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
