/**
 * @file GreenhouseMobile.js
 * @description Specialized mobile experience handler for Greenhouse models. 
 * Provides high-performance 2D projection hubs and vertical gesture mode selection.
 */

(function () {
    'use strict';

    const GreenhouseMobile = {
        activeModels: new Map(),

        /**
         * @description Registry of models for direct canvas initialization on mobile devices.
         */
        modelRegistry: {
            genetic: {
                scripts: ['models_3d_math.js', 'genetic_config.js', 'genetic_camera_controls.js', 'genetic_lighting.js', 'genetic_pip_controls.js', 'genetic_algo.js', 'genetic_ui_3d_geometry.js', 'genetic_ui_3d_dna.js', 'genetic_ui_3d_gene.js', 'genetic_ui_3d_chromosome.js', 'genetic_ui_3d_protein.js', 'genetic_ui_3d_brain.js', 'genetic_ui_3d_stats.js', 'genetic_ui_3d.js'],
                modes: ['Phenotype Evolution', 'Genotype Mapping', 'Protein Synthesis'],
                init: (container, baseUrl) => {
                    if (window.GreenhouseGeneticAlgo && window.GreenhouseGeneticUI3D) {
                        window.GreenhouseGeneticAlgo.init();
                        window.GreenhouseGeneticUI3D.init(container, window.GreenhouseGeneticAlgo);

                        // Expose global controller if missing (mobile hub specific)
                        if (!window.GreenhouseGenetic) {
                            window.GreenhouseGenetic = {
                                startSimulation: () => {
                                    const loop = () => {
                                        if (window.GreenhouseGeneticUI3D.shouldEvolve()) {
                                            window.GreenhouseGeneticAlgo.evolve();
                                            window.GreenhouseGeneticUI3D.updateData();
                                        }
                                        setTimeout(() => requestAnimationFrame(loop), 100);
                                    };
                                    loop();
                                }
                            };
                        }

                        setTimeout(() => {
                            const overlay = container.querySelector('#genetic-start-overlay');
                            if (overlay) overlay.style.display = 'none';
                            window.GreenhouseGeneticUI3D.isEvolving = true;
                            window.GreenhouseGenetic.startSimulation();
                        }, 500);
                    }
                },
                onSelectMode: (modeIndex) => { /* Genetic specific logic */ }
            },
            neuro: {
                scripts: ['models_3d_math.js', 'neuro_config.js', 'neuro_camera_controls.js', 'neuro_lighting.js', 'neuro_ga.js', 'neuro_ui_3d_geometry.js', 'neuro_ui_3d_brain.js', 'neuro_ui_3d_neuron.js', 'neuro_ui_3d_synapse.js', 'neuro_ui_3d_stats.js', 'neuro_ui_3d_enhanced.js', 'neuro_app.js'],
                modes: ['Neural Network', 'Synaptic Density', 'Burst Patterns'],
                init: (container, baseUrl) => {
                    const uniqueId = 'neuro-canvas-' + Math.random().toString(36).substr(2, 9);
                    container.id = uniqueId;
                    if (window.GreenhouseNeuroApp) window.GreenhouseNeuroApp.init('#' + uniqueId);
                },
                onSelectMode: (index) => {
                    const modes = ['Neural Network', 'Synaptic Density', 'Burst Patterns'];
                    console.log(`[Mobile Hub] Neuro Mode Selected: ${modes[index]}`);
                    // Neuro app logic to switch modes could be added here
                }
            },
            pathway: {
                scripts: ['models_util.js', 'models_3d_math.js', 'brain_mesh_realistic.js', 'pathway_ui_3d_geometry.js', 'pathway_camera_controls.js', 'pathway_ui_3d_brain.js', 'pathway_viewer.js'],
                modes: ['Basal Ganglia', 'Dopamine Loop', 'Serotonin Path'],
                init: (container, baseUrl) => {
                    const uniqueId = 'pathway-canvas-' + Math.random().toString(36).substr(2, 9);
                    container.id = uniqueId;
                    if (window.GreenhousePathwayViewer) window.GreenhousePathwayViewer.init('#' + uniqueId, baseUrl);
                },
                onSelectMode: (index) => {
                    const internalIds = ['dopaminergic', 'hpa', 'serotonergic'];
                    if (window.GreenhousePathwayViewer) window.GreenhousePathwayViewer.switchPathway(internalIds[index]);
                }
            },
            synapse: {
                scripts: ['synapse_chemistry.js', 'synapse_neurotransmitters.js', 'synapse_sidebar.js', 'synapse_tooltips.js', 'synapse_controls.js', 'synapse_analytics.js', 'synapse_3d.js', 'synapse_molecular.js', 'synapse_app.js'],
                modes: ['Clean Signal', 'Inhibited', 'Excited'],
                init: (container, baseUrl) => {
                    const uniqueId = 'synapse-canvas-' + Math.random().toString(36).substr(2, 9);
                    container.id = uniqueId;
                    if (window.GreenhouseSynapseApp) window.GreenhouseSynapseApp.init('#' + uniqueId, baseUrl);
                },
                onSelectMode: (index) => {
                    const scenarios = ['healthy', 'alzheimers', 'schizophrenia'];
                    if (window.GreenhouseSynapseApp && window.GreenhouseSynapseApp.applyScenario) {
                        window.GreenhouseSynapseApp.applyScenario(scenarios[index]);
                        if (window.GreenhouseSynapseApp.renderSidebar) window.GreenhouseSynapseApp.renderSidebar();
                    }
                }
            },
            dna: {
                scripts: ['models_3d_math.js', 'dna_repair_mechanisms.js', 'dna_repair_mutations.js', 'dna_repair_buttons.js', 'dna_replication.js', 'dna_tooltip.js', 'dna_repair.js'],
                modes: ['Base Excision', 'Mismatch Repair', 'Nucleotide Excision', 'Double-Strand Break'],
                init: (container, baseUrl) => {
                    if (window.GreenhouseDNARepair) window.GreenhouseDNARepair.initializeDNARepairSimulation(container);
                },
                onSelectMode: (index) => {
                    const internalModes = ['ber', 'mmr', 'ner', 'dsb'];
                    if (window.GreenhouseDNARepair) window.GreenhouseDNARepair.startSimulation(internalModes[index]);
                }
            },
            rna: {
                scripts: ['rna_repair_atp.js', 'rna_repair_enzymes.js', 'rna_repair_physics.js', 'rna_display.js', 'rna_tooltip.js', 'rna_repair.js'],
                modes: ['Ligation', 'Demethylation', 'Pseudouridylation', 'Decapping'],
                init: (container, baseUrl) => {
                    if (window.RNARepairSimulation) {
                        const canvas = document.createElement('canvas');
                        canvas.width = container.offsetWidth || 400;
                        canvas.height = container.offsetHeight || 600;
                        container.appendChild(canvas);
                        const sim = new window.RNARepairSimulation(canvas);
                        container._sim = sim;
                        window.Greenhouse.rnaSimulation = sim;
                    }
                },
                onSelectMode: (index) => {
                    const sim = window.Greenhouse?.rnaSimulation;
                    if (sim && sim.spawnEnzyme) {
                        const enzymes = ['Ligase', 'Demethylase', 'Pus1', 'Dcp2'];
                        sim.spawnEnzyme(enzymes[index], Math.floor(Math.random() * 20) + 5);
                    }
                }
            },
            dopamine: {
                scripts: ['models_3d_math.js', 'dopamine_controls.js', 'dopamine_legend.js', 'dopamine_tooltips.js', 'dopamine_molecular.js', 'dopamine_synapse.js', 'dopamine_electrophysiology.js', 'dopamine_circuit.js', 'dopamine_plasticity.js', 'dopamine_clinical.js', 'dopamine_pharmacology.js', 'dopamine_scientific.js', 'dopamine_analytics.js', 'dopamine_ux.js', 'dopamine.js'],
                modes: ['D1R Signaling', 'D2R Signaling', 'Synaptic Release', 'Circuit Dynamics'],
                init: (container, baseUrl) => {
                    const uniqueId = 'dopamine-canvas-' + Math.random().toString(36).substr(2, 9);
                    container.id = uniqueId;
                    if (window.GreenhouseDopamine) window.GreenhouseDopamine.initialize(container, '#' + uniqueId);
                },
                onSelectMode: (index) => {
                    const g = window.GreenhouseDopamine;
                    if (g && g.state) {
                        const modes = ['D1R', 'D2R', 'Synapse', 'Circuit'];
                        g.state.mode = modes[index];
                    }
                }
            },
            serotonin: {
                scripts: ['models_3d_math.js', 'serotonin_controls.js', 'serotonin_legend.js', 'serotonin_tooltips.js', 'serotonin_receptors.js', 'serotonin_kinetics.js', 'serotonin_signaling.js', 'serotonin_transport.js', 'serotonin_analytics.js', 'serotonin.js'],
                modes: ['3D Receptor', '5-HT1A Structural', '2D Closeup', 'Ligand Kinetics'],
                init: (container, baseUrl) => {
                    const uniqueId = 'serotonin-canvas-' + Math.random().toString(36).substr(2, 9);
                    container.id = uniqueId;
                    if (window.GreenhouseSerotonin) window.GreenhouseSerotonin.initialize(container, '#' + uniqueId);
                },
                onSelectMode: (index) => {
                    const g = window.GreenhouseSerotonin;
                    if (g) {
                        const modes = ['3D', 'Structural', '2D-Closeup', 'Kinetics'];
                        g.viewMode = modes[index];
                    }
                }
            },
            emotion: {
                scripts: ['models_3d_math.js', 'brain_mesh_realistic.js', 'emotion_config.js', 'emotion_diagrams.js', 'emotion_ui_3d_brain.js', 'emotion_app.js'],
                modes: ['James-Lange', 'Cannon-Bard', 'Schachter-Singer'],
                init: (container, baseUrl) => {
                    const uniqueId = 'emotion-canvas-' + Math.random().toString(36).substr(2, 9);
                    container.id = uniqueId;
                    if (window.GreenhouseEmotionApp) window.GreenhouseEmotionApp.init('#' + uniqueId);
                },
                onSelectMode: (index) => {
                    const app = window.GreenhouseEmotionApp;
                    if (app && app.config && app.config.theories) {
                        const theory = app.config.theories[index];
                        if (theory) {
                            app.activeTheory = theory;
                            app.activeRegion = theory.regions || theory.name;
                            if (app.updateInfoPanel) app.updateInfoPanel();
                        }
                    }
                }
            },
            cognition: {
                scripts: ['models_3d_math.js', 'brain_mesh_realistic.js', 'cognition_config.js', 'cognition_analytics.js', 'cognition_app.js'],
                modes: ['Analytical', 'Executive', 'Memory', 'Attention'],
                init: (container, baseUrl) => {
                    const uniqueId = 'cognition-canvas-' + Math.random().toString(36).substr(2, 9);
                    container.id = uniqueId;
                    if (window.GreenhouseCognitionApp) window.GreenhouseCognitionApp.init('#' + uniqueId);
                },
                onSelectMode: (index) => {
                    const app = window.GreenhouseCognitionApp;
                    const categories = ['Analytical', 'Development', 'Intervention', 'Medication'];
                    if (app) {
                        app.currentCategory = categories[index];
                        if (app.updateTheorySelector) app.updateTheorySelector();
                    }
                }
            }
        },

        /**
         * @function init
         * @description Standard entry point for the mobile extension.
         */
        init() {
            if (this.isMobileUser()) {
                console.log('[GreenhouseMobile] Initializing mobile experience hooks...');
                this.setupAutoTrigger();
            }
        },

        /**
         * @function isMobileUser
         * @description Unified mobile detection using feature detection and UA fallback.
         * Combines screen width, touch support, and User Agent sniffing to avoid
         * false positives on desktop touchscreens.
         */
        isMobileUser() {
            const isNarrow = window.innerWidth <= 1024;
            const ua = navigator.userAgent;

            // 0. Manual override via query parameter for testing
            if (window.location.search.includes('mobile=true')) return true;

            // 1. Specialized detection for iPad Pro (identifies as MacIntel but has multi-touch)
            const isIPadPro = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 && !window.MSStream);

            // 2. Check for touch event support and maxTouchPoints (modern, MDN recommended)
            let hasTouchScreen = false;
            if ("maxTouchPoints" in navigator) {
                hasTouchScreen = navigator.maxTouchPoints > 0;
            } else {
                // Fallback for older browsers
                const mQ = window.matchMedia && window.matchMedia("(pointer:coarse)");
                if (mQ && mQ.media === "(pointer:coarse)") {
                    hasTouchScreen = !!mQ.matches;
                } else if ('orientation' in window) {
                    hasTouchScreen = true; // Deprecated, but useful fallback
                }
            }

            // 3. User Agent sniffing and legacy touch
            const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
            const hasLegacyTouch = ('ontouchstart' in window);

            // Combined Logic: treat as mobile if it's a known mobile UA, or iPad Pro,
            // OR if it has touch support AND is a narrow screen (mobile/tablet size).
            return isMobileUA || isIPadPro || (isNarrow && (hasTouchScreen || hasLegacyTouch));
        },

        /**
         * @function setupAutoTrigger
         * @description Detects if the current page requires the mobile hub and launches it.
         */
        setupAutoTrigger() {
            const path = window.location.pathname.toLowerCase();
            const isModelHub = path.includes('/models') || path.includes('models.html');
            const modelNames = Object.keys(this.modelRegistry);
            const isRegisteredModel = modelNames.some(m => path.includes(m));
            const isForceMobile = window.location.search.includes('mobile=true');

            if (isModelHub || isRegisteredModel || isForceMobile) {
                console.log('[GreenhouseMobile] Auto-trigger matched path or force flag. Launching hub...');
                setTimeout(() => {
                    this.launchHub();
                }, 500);
            }
        },

        /**
         * @function launchHub
         * @description Orchestrates the full mobile model viewer hub.
         */
        async launchHub() {
            const Utils = window.GreenhouseUtils;
            if (!Utils) return;

            // Ensure configuration is validated to pick up data-base-url from script tags
            if (typeof Utils.validateConfiguration === 'function') {
                Utils.validateConfiguration();
            }

            try {
                const models = await Utils.fetchModelDescriptions();
                this.injectStyles();
                this.renderHub(models);
            } catch (e) {
                console.error('[GreenhouseMobile] Hub launch failed', e);
            }
        },

        /**
         * @function injectStyles
         * @description Injects the CSS for the premium mobile UI.
         */
        injectStyles() {
            if (document.getElementById('greenhouse-mobile-styles')) return;

            const style = document.createElement('style');
            style.id = 'greenhouse-mobile-styles';
            style.textContent = `
                @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap');
                
                .gh-mobile-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 100000;
                    background: radial-gradient(circle at center, rgba(10, 20, 10, 0.98) 0%, #000 100%);
                    backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
                    display: flex; flex-direction: column;
                    animation: ghFadeIn 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
                    font-family: 'Quicksand', sans-serif; overflow: hidden;
                    box-sizing: border-box;
                }
                .gh-mobile-overlay * { box-sizing: border-box; }
                .gh-mobile-overlay-header { padding: 50px 20px 10px; text-align: center; }
                .gh-mobile-overlay-header h2 { color: #4ca1af; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; font-size: 1.4rem; margin: 0; opacity: 0.8; }
                
                .gh-mobile-container {
                    display: flex; flex: 1; overflow-x: auto; scroll-snap-type: x mandatory;
                    align-items: center; gap: 25px; padding: 10px 30px 60px;
                    -webkit-overflow-scrolling: touch;
                }
                .gh-mobile-container::-webkit-scrollbar { display: none; }
                
                .gh-mobile-card {
                    flex: 0 0 82vw; height: 70vh;
                    background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 32px; scroll-snap-align: center;
                    display: flex; flex-direction: column; overflow: hidden;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.6), inset 0 0 20px rgba(255,255,255,0.02);
                    position: relative;
                }
                .gh-mobile-card-header {
                    padding: 20px 24px; background: linear-gradient(to right, rgba(76, 161, 175, 0.2), transparent);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex; justify-content: space-between; align-items: center; z-index: 2;
                }
                .gh-model-title { color: #fff; font-weight: 500; font-size: 1.3rem; }
                .gh-model-index { color: #4ca1af; font-size: 1.0rem; font-weight: 600; background: rgba(0,0,0,0.3); padding: 4px 12px; border-radius: 12px; }
                
                .gh-mobile-canvas-wrapper {
                    flex: 1; position: relative; background: #000; margin: 12px; border-radius: 20px;
                    overflow: hidden; box-shadow: inset 0 0 30px rgba(0,0,0,0.5);
                    display: flex; justify-content: center; align-items: center;
                }
                .gh-mobile-canvas-wrapper canvas { max-width: 100% !important; max-height: 100% !important; object-fit: contain; }
                
                /* Selection HUD */
                .gh-mode-indicator {
                    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    background: rgba(0, 0, 0, 0.8); color: #4ca1af; padding: 15px 30px;
                    border-radius: 40px; font-weight: 600; font-size: 1.5rem; letter-spacing: 2px;
                    border: 1px solid rgba(76, 161, 175, 0.3); pointer-events: none;
                    opacity: 0; z-index: 100; transition: opacity 0.3s ease;
                }
                .gh-mode-indicator.show { opacity: 1; animation: ghPulseScale 0.6s ease-out; }

                .gh-mobile-btn {
                    background: linear-gradient(135deg, #4ca1af 0%, #2c3e50 100%);
                    color: white; text-decoration: none; padding: 14px 35px; border-radius: 18px;
                    font-size: 1.2rem; font-weight: 600; text-align: center; margin: 0 24px 24px;
                }
                .gh-mobile-close {
                    position: absolute; top: 40px; right: 25px;
                    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
                    color: white; width: 44px; height: 44px; border-radius: 50%;
                    font-size: 32px; display: flex; align-items: center; justify-content: center;
                    z-index: 100001; backdrop-filter: blur(10px);
                }
                .gh-swipe-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.15); transition: all 0.3s ease; }
                .gh-swipe-dot.active { background: #4ca1af; width: 22px; border-radius: 10px; }

                .gh-mobile-loader {
                    width: 40px; height: 40px; border: 3px solid rgba(76, 161, 175, 0.2);
                    border-top-color: #4ca1af; border-radius: 50%; animation: ghSpin 1s linear infinite;
                }

                @keyframes ghFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes ghSpin { to { transform: rotate(360deg); } }
                @keyframes ghPulseScale { 0% { transform: translate(-50%, -50%) scale(0.8); } 50% { transform: translate(-50%, -50%) scale(1.1); } 100% { transform: translate(-50%, -50%) scale(1); } }
            `;
            document.head.appendChild(style);
        },

        /**
         * @function renderHub
         * @description Builds the DOM structure for the mobile card hub.
         */
        renderHub(models) {
            if (document.getElementById('greenhouse-mobile-viewer')) return;

            const overlay = document.createElement('div');
            overlay.id = 'greenhouse-mobile-viewer';
            overlay.className = 'gh-mobile-overlay';

            overlay.innerHTML = `
                <div class="gh-mobile-overlay-header"><h2>Greenhouse Models</h2></div>
                <button class="gh-mobile-close" id="gh-mobile-close-btn">&times;</button>
                <div class="gh-mobile-container" id="gh-mobile-scroller"></div>
                <div class="gh-mobile-hint" id="gh-mobile-dots" style="position: absolute; bottom: 30px; left: 0; right: 0; display: flex; justify-content: center; gap: 8px;"></div>
            `;

            const scroller = overlay.querySelector('#gh-mobile-scroller');
            const dotContainer = overlay.querySelector('#gh-mobile-dots');

            models.forEach((model, index) => {
                const card = document.createElement('div');
                card.className = 'gh-mobile-card';
                card.dataset.modelId = model.id;
                card.dataset.currentModeIndex = 0;

                card.innerHTML = `
                    <div class="gh-mobile-card-header">
                        <span class="gh-model-title">${model.title}</span>
                        <span class="gh-model-index">${index + 1}</span>
                    </div>
                    <div class="gh-mobile-canvas-wrapper" id="canvas-target-${model.id}">
                        <div class="gh-mobile-loader"></div>
                        <div class="gh-mode-indicator" id="mode-indicator-${model.id}"></div>
                    </div>
                    <a href="${model.url}" class="gh-mobile-btn">Select Model</a>
                `;

                scroller.appendChild(card);

                const dot = document.createElement('div');
                dot.className = `gh-swipe-dot ${index === 0 ? 'active' : ''}`;
                dotContainer.appendChild(dot);

                this.setupIntersectionObserver(card, model.id);
                this.setupSwipeInteraction(card, model.id);
            });

            this.setupScrollListener(scroller, dotContainer);

            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';

            document.getElementById('gh-mobile-close-btn').onclick = () => {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.remove();
                    document.body.style.overflow = '';
                    this.activeModels.clear();
                }, 400);
            };
        },

        setupIntersectionObserver(card, modelId) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const target = card.querySelector('.gh-mobile-canvas-wrapper');
                        this.activateModel(modelId, target);
                        observer.unobserve(card);
                    }
                });
            }, { threshold: 0.5 });
            observer.observe(card);
        },

        async activateModel(modelId, container) {
            if (!container || this.activeModels.has(container)) return;
            const config = this.modelRegistry[modelId];
            if (!config) return;

            const Utils = window.GreenhouseUtils;

            // Ensure configuration is validated before accessing appState
            if (typeof Utils.validateConfiguration === 'function' && !Utils.appState.baseUrl) {
                Utils.validateConfiguration();
            }

            const baseUrl = Utils.appState.baseUrl || "https://drtamarojgreen.github.io/greenhouse_org/";

            try {
                for (const scriptName of config.scripts) {
                    await Utils.loadScript(scriptName, baseUrl);
                }
                container.innerHTML = `<div class="gh-mode-indicator" id="mode-indicator-${modelId}"></div>`;
                config.init(container, baseUrl);
                this.activeModels.set(container, modelId);
            } catch (e) {
                container.innerHTML = `<p style="color: #e74c3c; padding: 20px;">Failed to load ${modelId}</p>`;
            }
        },

        setupSwipeInteraction(card, modelId) {
            let startY = 0;
            card.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; }, { passive: true });
            card.addEventListener('touchend', (e) => {
                const deltaY = e.changedTouches[0].clientY - startY;
                const config = this.modelRegistry[modelId];
                if (Math.abs(deltaY) > 80 && config && config.modes) {
                    let index = parseInt(card.dataset.currentModeIndex);
                    index = (deltaY < 0) ? (index + 1) % config.modes.length : (index - 1 + config.modes.length) % config.modes.length;
                    card.dataset.currentModeIndex = index;
                    if (config.onSelectMode) config.onSelectMode(index);

                    const indicator = card.querySelector(`#mode-indicator-${modelId}`);
                    if (indicator) {
                        indicator.textContent = config.modes[index];
                        indicator.classList.remove('show');
                        void indicator.offsetWidth;
                        indicator.classList.add('show');
                        setTimeout(() => indicator.classList.remove('show'), 1200);
                    }
                }
            }, { passive: true });
        },

        setupScrollListener(scroller, dotContainer) {
            scroller.addEventListener('scroll', () => {
                const index = Math.round(scroller.scrollLeft / (scroller.offsetWidth * 0.82 + 25));
                const dots = dotContainer.querySelectorAll('.gh-swipe-dot');
                dots.forEach((d, i) => d.classList.toggle('active', i === index));
            });
        }
    };

    window.GreenhouseMobile = GreenhouseMobile;

    // Auto-run if GreenhouseUtils is ready, ensuring DOM is fully available
    const boot = () => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => GreenhouseMobile.init());
        } else {
            GreenhouseMobile.init();
        }
    };

    if (window.GreenhouseUtils) {
        boot();
    } else {
        window.addEventListener('greenhouse:utils-ready', () => boot());
    }
})();
