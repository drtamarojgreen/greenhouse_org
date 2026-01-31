// docs/js/synapse_app.js
// Optimized & Refactored Synapse Visualization Logic - Chemistry Integrated

(function () {
    'use strict';

    const G = window.GreenhouseSynapseApp || {};
    window.GreenhouseSynapseApp = G;

    G.config = G.config || {
        backgroundColor: '#050705',
        accentCyan: '#00F2FF',
        accentGold: '#FFD700',
        activeNT: 'serotonin',
        activeScenario: 'healthy',
        font: "'Quicksand', 'Segoe UI', sans-serif",
        translations: {
            preSynapticTerminal: { en: 'Pre-Synaptic Terminal', es: 'Terminal Presináptica' },
            postSynapticTerminal: { en: 'Post-Synaptic Terminal', es: 'Terminal Postsináptica' },
            vesicle: { en: 'Synaptic Vesicle', es: 'Vesícula Sináptica' },
            ionChannel: { en: 'Ion Channel', es: 'Canal Iónico' },
            gpcr: { en: 'G-protein Coupled Receptor', es: 'Receptor acoplado a proteína G' },
            legendTitle: { en: 'Neural Anatomy', es: 'Anatomía Neuronal' },
            neurotransmitter: { en: 'Neurotransmitter (Signal)', es: 'Neurotransmisor (Señal)' }
        },
        elements: {
            vesicles: [
                { id: 'vesicle', x: 0.45, y: 0.15, r: 12, offset: 0 },
                { id: 'vesicle', x: 0.55, y: 0.18, r: 14, offset: 2 },
                { id: 'vesicle', x: 0.5, y: 0.22, r: 10, offset: 4 }
            ],
            receptors: [
                { x: 0.38, type: 'ionotropic_receptor', state: 'closed', activationCount: 0 },
                { x: 0.46, type: 'ionotropic_receptor', state: 'closed', activationCount: 0 },
                { x: 0.54, type: 'gpcr', state: 'idle', activationCount: 0 },
                { x: 0.62, type: 'ionotropic_receptor', state: 'closed', activationCount: 0 }
            ],
            autoreceptors: [
                { x: 0.42, y: 0.4, type: 'autoreceptor' },
                { x: 0.58, y: 0.4, type: 'autoreceptor' }
            ],
            transporters: [
                { x: 0.35, y: 0.35, type: 'SERT' },
                { x: 0.65, y: 0.35, type: 'SERT' }
            ]
        }
    };

    let resilienceObserver = null;

    Object.assign(G, {
        canvas: null,
        ctx: null,
        container: null,
        frame: 0,
        mouse: { x: 0, y: 0 },
        currentLanguage: 'en',
        hoveredId: null,
        sidebarHoveredId: null,
        isRunning: false,
        measurementStart: null,
        rulerActive: false,
        annotations: [],

        init(targetSelector, baseUrl, selector = null) {
            // Standardize: if re-initialized with (container, selector), we might get varying args.
            // The utility calls: appInstance[reinitFunctionName](container, selector)
            // So if `init(container, selector)` is called:
            // targetSelector -> container element
            // baseUrl -> selector string
            // selector -> undefined

            let actualSelector = targetSelector;
            if (typeof targetSelector !== 'string' && baseUrl && typeof baseUrl === 'string') {
                // Called via re-init
                actualSelector = baseUrl;
            } else if (typeof targetSelector === 'string') {
                // Normal string call
                actualSelector = targetSelector;
                // baseUrl is actually baseUrl
            }

            this.lastSelector = actualSelector;
            this.baseUrl = (typeof baseUrl === 'string' && baseUrl !== actualSelector) ? baseUrl : '';

            this._initializeSimulation(actualSelector);
        },

        getSurfaceY(h) {
            const cleft = this.config.kinetics?.cleftWidth || 1.0;
            return h * (0.6 + (cleft * 0.08));
        },

        _initializeSimulation(selector) {
            if (!G.Chemistry || !G.Particles || !G.Sidebar || !G.Tooltips ||
                !G.Controls || !G.Analytics || !G.Visuals3D || !G.Molecular) {
                console.error('SynapseApp: Missing modular dependencies.');
                return;
            }

            this.container = document.querySelector(selector);
            if (!this.container) return;

            this.setupDOM();

            // Handle Language Change
            window.addEventListener('greenhouseLanguageChanged', () => {
                this.refreshUIText();
            });

            this.isRunning = true;
            this.animate();

            // Resilience using shared GreenhouseUtils
            if (window.GreenhouseUtils) {
                window.GreenhouseUtils.observeAndReinitializeApplication(this.container, selector, G, 'init');
                window.GreenhouseUtils.startSentinel(this.container, selector, G, 'init');
            }
        },

        setupDOM() {
            const config = G.config;
            const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
            const isMobile = window.GreenhouseUtils && window.GreenhouseUtils.isMobileUser();

            this.container.innerHTML = '';
            if (isMobile) {
                const staticHeader = document.querySelector('.page-header');
                if (staticHeader) staticHeader.style.display = 'none';
            }
            this.container.style.cssText = `
                display: flex; flex-direction: ${isMobile ? 'column' : 'row'}; gap: 0; background: ${config.backgroundColor};
                border-radius: 24px; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.6);
                border: 1px solid rgba(53, 116, 56, 0.2); font-family: ${config.font}; height: ${isMobile ? 'auto' : '750px'};
                position: relative; min-height: ${isMobile ? '500px' : 'auto'};
            `;

            const sidebar = document.createElement('div');
            sidebar.id = 'synapse-sidebar';
            sidebar.style.cssText = `
                flex: 1; max-width: ${isMobile ? '100%' : '340px'}; padding: ${isMobile ? '20px' : '50px 40px'};
                background: rgba(53, 116, 56, 0.05); backdrop-filter: blur(15px);
                border-right: ${isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.05)'};
                border-bottom: ${isMobile ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'};
                color: #fff; display: ${isMobile ? 'none' : 'block'};
            `;
            this.container.appendChild(sidebar);

            const canvasWrapper = document.createElement('div');
            canvasWrapper.style.cssText = `flex: 2; position: relative; overflow: hidden; background: #000; min-height: ${isMobile ? '400px' : 'auto'};`;
            this.canvas = document.createElement('canvas');
            this.canvas.style.cssText = 'width: 100%; height: 100%; display: block;';
            canvasWrapper.appendChild(this.canvas);
            this.container.appendChild(canvasWrapper);

            if (isMobile) {
                // Simplified Mobile Controls Overlay
                const mobileControls = document.createElement('div');
                mobileControls.style.cssText = `
                    position: absolute; bottom: 10px; left: 10px; right: 10px;
                    display: flex; gap: 10px; justify-content: center; z-index: 100;
                `;
                const burstBtn = document.createElement('button');
                burstBtn.id = 'synapse-mobile-burst-btn';
                burstBtn.textContent = t('Burst');
                burstBtn.className = 'greenhouse-btn greenhouse-btn-primary';
                burstBtn.style.fontSize = '16px';
                burstBtn.onclick = () => {
                    const w = this.canvas.width / (window.devicePixelRatio || 1);
                    const h = this.canvas.height / (window.devicePixelRatio || 1);
                    G.Particles.create(w, h, 60, G.config, true);
                };
                mobileControls.appendChild(burstBtn);

                const langBtn = document.createElement('button');
                langBtn.id = 'synapse-lang-toggle';
                langBtn.textContent = t('btn_language');
                langBtn.className = 'greenhouse-btn greenhouse-btn-secondary';
                langBtn.style.fontSize = '16px';
                langBtn.onclick = () => {
                    if (window.GreenhouseModelsUtil) {
                        window.GreenhouseModelsUtil.toggleLanguage();
                    }
                };
                mobileControls.appendChild(langBtn);

                canvasWrapper.appendChild(mobileControls);
            }

            this.tooltip = document.createElement('div');
            this.tooltip.id = 'synapse-tooltip';
            this.tooltip.style.cssText = `
                position: absolute; display: none; padding: 12px 20px; background: rgba(5, 10, 5, 0.95); 
                color: #fff; border-radius: 12px; border: 1px solid rgba(53,116,56,0.5); z-index: 100; pointer-events: none;
            `;
            canvasWrapper.appendChild(this.tooltip);

            this.renderSidebar();

            if (!this.handleResize) {
                this.handleResize = this.resize.bind(this);
            }
            window.removeEventListener('resize', this.handleResize);
            window.addEventListener('resize', this.handleResize);
            this.resize();

            this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        },

        refreshUIText() {
            this.currentLanguage = window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.currentLanguage : 'en';
            const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

            const burstBtn = document.getElementById('synapse-mobile-burst-btn');
            if (burstBtn) burstBtn.textContent = t('Burst');

            const langBtn = document.getElementById('synapse-lang-toggle');
            if (langBtn) langBtn.textContent = t('btn_language');

            this.renderSidebar();
        },

        renderSidebar() {
            if (G.Sidebar) {
                G.Sidebar.render(document.getElementById('synapse-sidebar'), G.config, this.currentLanguage, {
                    onHover: (id) => this.sidebarHoveredId = id,
                    onNTChange: (ntId) => {
                        G.config.activeNT = ntId;
                        this.renderSidebar();
                    },
                    onScenarioChange: (scenarioId) => {
                        G.config.activeScenario = scenarioId;
                        this.applyScenario(scenarioId);
                        this.renderSidebar();
                    }
                });

                if (G.Controls) {
                    G.Controls.render(document.getElementById('synapse-sidebar'), G.config, {
                        onToggleBurst: () => {
                            const w = this.canvas.width / (window.devicePixelRatio || 1);
                            const h = this.canvas.height / (window.devicePixelRatio || 1);
                            G.Particles.create(w, h, 60, G.config, true);
                        },
                        onUpdateSensitivity: (val) => {
                            console.log('Sensitivity updated:', val);
                        },
                        onToggleDrug: (drugId, isActive) => {
                            console.log(`Drug ${drugId} toggled: ${isActive}`);
                        },
                        onGenerateFigure: () => this.exportFigure(),
                        onUpdateParam: (p, v) => {
                            if (p === 'ruler') this.rulerActive = v;
                        }
                    });
                }

                if (G.Analytics) {
                    G.Analytics.renderDashboard(document.getElementById('synapse-sidebar'));
                }
            }
        },

        exportFigure() {
            if (!this.canvas) return;
            const link = document.createElement('a');
            link.download = `synapse_research_figure_${Date.now()}.png`;
            link.href = this.canvas.toDataURL('image/png', 1.0);
            link.click();
        },

        applyScenario(scenarioId) {
            const scenario = G.Chemistry.scenarios[scenarioId];
            if (!scenario) return;

            if (scenarioId === 'schizophrenia') {
                G.config.elements.receptors = [
                    { x: 0.3, type: 'ionotropic_receptor', state: 'closed', activationCount: 0 },
                    { x: 0.4, type: 'ionotropic_receptor', state: 'closed', activationCount: 0 },
                    { x: 0.5, type: 'gpcr', state: 'idle', activationCount: 0 },
                    { x: 0.6, type: 'gpcr', state: 'idle', activationCount: 0 },
                    { x: 0.7, type: 'ionotropic_receptor', state: 'closed', activationCount: 0 }
                ];
            } else if (scenarioId === 'alzheimers') {
                G.config.elements.vesicles = [
                    { id: 'vesicle', x: 0.5, y: 0.2, r: 10, offset: 0 }
                ];
                G.config.elements.receptors = [
                    { x: 0.45, type: 'ionotropic_receptor', state: 'closed', activationCount: 0 },
                    { x: 0.55, type: 'gpcr', state: 'idle', activationCount: 0 }
                ];
            } else if (scenarioId === 'autism') {
                G.config.elements.receptors = [
                    { x: 0.38, type: 'ionotropic_receptor', state: 'closed', activationCount: 0 },
                    { x: 0.62, type: 'ionotropic_receptor', state: 'closed', activationCount: 0 }
                ];
            } else if (scenarioId === 'fearConditioning') {
                G.config.elements.receptors = [
                    { x: 0.3, type: 'ionotropic_receptor', state: 'closed', activationCount: 0 },
                    { x: 0.4, type: 'ionotropic_receptor', state: 'closed', activationCount: 0 },
                    { x: 0.5, type: 'ionotropic_receptor', state: 'closed', activationCount: 0 },
                    { x: 0.6, type: 'ionotropic_receptor', state: 'closed', activationCount: 0 },
                    { x: 0.7, type: 'ionotropic_receptor', state: 'closed', activationCount: 0 }
                ];
            } else if (scenarioId === 'chronicStress') {
                G.config.elements.receptors = [
                    { x: 0.5, type: 'gpcr', state: 'idle', activationCount: 0 }
                ];
                G.config.elements.vesicles = [
                    { id: 'vesicle', x: 0.5, y: 0.15, r: 10, offset: 0 }
                ];
            } else {
                G.config.elements.vesicles = [
                    { id: 'vesicle', x: 0.45, y: 0.15, r: 12, offset: 0 },
                    { id: 'vesicle', x: 0.55, y: 0.18, r: 14, offset: 2 },
                    { id: 'vesicle', x: 0.5, y: 0.22, r: 10, offset: 4 }
                ];
                G.config.elements.receptors = [
                    { x: 0.38, type: 'ionotropic_receptor', state: 'closed', activationCount: 0 },
                    { x: 0.46, type: 'ionotropic_receptor', state: 'closed', activationCount: 0 },
                    { x: 0.54, type: 'gpcr', state: 'idle', activationCount: 0 },
                    { x: 0.62, type: 'ionotropic_receptor', state: 'closed', activationCount: 0 }
                ];
            }
        },

        handleMouseMove(e) {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        },

        handleMouseDown(e) {
            if (this.rulerActive) {
                this.measurementStart = { x: this.mouse.x, y: this.mouse.y };
                return;
            }
            if (G.config.visuals?.annotationMode) {
                const note = prompt('Enter research annotation:');
                if (note) this.annotations.push({ x: this.mouse.x, y: this.mouse.y, text: note });
                return;
            }

            const w = this.canvas.width / (window.devicePixelRatio || 1);
            const h = this.canvas.height / (window.devicePixelRatio || 1);
            if (this.mouse.y < h * 0.45 && Math.abs(this.mouse.x - w * 0.5) < w * 0.15) {
                if (G.Particles) {
                    G.Particles.create(w, h, 40, G.config, true);
                }
            }
        },

        handleMouseUp() {
            this.measurementStart = null;
        },

        resize() {
            if (!this.canvas) return;
            const dpr = window.devicePixelRatio || 1;
            const width = this.canvas.clientWidth;
            const height = this.canvas.clientHeight;
            this.canvas.width = width * dpr;
            this.canvas.height = height * dpr;
            this.ctx = this.canvas.getContext('2d');
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        },

        animate() {
            if (!this.isRunning) return;
            requestAnimationFrame(() => this.animate());
            this.render();
        },

        render() {
            if (!this.ctx) return;
            this.frame++;
            const ctx = this.ctx;
            const w = this.canvas.width / (window.devicePixelRatio || 1);
            const h = this.canvas.height / (window.devicePixelRatio || 1);

            const nightDim = G.config.visuals?.isNight ? 0.3 : 1.0;
            ctx.fillStyle = G.config.highContrast ? '#000' : (G.config.visuals?.isNight ? '#000500' : '#010501');
            ctx.fillRect(0, 0, w, h);

            if (G.Molecular) {
                ctx.globalAlpha = nightDim;
                G.Molecular.drawECM(ctx, w, h);
                G.Molecular.drawAstrocyte(ctx, w, h);
                G.Molecular.drawMitochondria(ctx, w * 0.4, h * 0.15, G.Analytics?.state?.atp || 100);
                ctx.globalAlpha = 1.0;
            }

            if (G.config.visuals?.fluorescenceActive) {
                const caLevel = G.Analytics?.state?.calcium || 0.1;
                ctx.save();
                ctx.fillStyle = `rgba(50, 255, 50, ${caLevel * 0.1})`;
                ctx.beginPath();
                ctx.ellipse(w * 0.5, h * 0.8, w * 0.4, h * 0.2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            if (G.Visuals3D) {
                G.Visuals3D.applyDepth(ctx, w, h);
                if (G.config.visuals?.showElectrostatic) {
                    G.Visuals3D.drawElectrostaticPotential(ctx, w, h, this.frame);
                }
                if (G.config.pharmacology?.bbbActive) {
                    G.Visuals3D.drawBBB(ctx, w, h);
                }
                G.Visuals3D.drawVesicleShadows(ctx, G.config.elements.vesicles, w, h, this.frame);
            }

            this.drawStructure(ctx, w, h);

            if (G.Molecular) {
                const chol = G.config.kinetics?.cholesterol || 1.0;
                const surfaceY = this.getSurfaceY(h);

                G.Molecular.drawLipidBilayer(ctx, w * 0.3, h * 0.44, w * 0.4, false, chol);
                G.Molecular.drawLipidBilayer(ctx, w * 0.2, surfaceY, w * 0.6, true, chol);

                G.Molecular.drawScaffolding(ctx, w, h, G.Particles.plasticityFactor, G.config.visuals?.showIsoforms);
                G.Molecular.drawCascades(ctx);
                G.Molecular.drawRetrograde(ctx, w, h);

                if (this.frame % 60 < 20) {
                    G.Molecular.drawSNARE(ctx, w * 0.5, h * 0.4, (this.frame % 60) / 20);
                }

                G.config.elements.receptors.forEach(r => {
                    const rx = w * r.x;
                    const ry = surfaceY - 5;
                    if (r.type === 'gpcr' && r.state !== 'internalized') {
                        G.Molecular.drawGPCRTopology(ctx, rx, ry);
                    }
                    if (r.state === 'active' || r.state === 'open') {
                        G.Molecular.drawPhosphorylation(ctx, rx, ry, this.frame);
                        ctx.fillStyle = '#fff'; ctx.font = '8px Arial';
                        ctx.fillText(G.Chemistry.receptors[r.type].stoichiometry, rx - 30, ry - 20);
                    }
                });

                if (G.config.visuals?.patchClampActive) {
                    G.Molecular.drawPatchPipette(ctx, this.mouse.x, this.mouse.y);
                }
            }

            if (G.Particles) {
                const retrogradeInhibition = (G.Molecular && G.Molecular.retrogradeSignals && G.Molecular.retrogradeSignals.length > 0) ? 0.4 : 1.0;
                const azDensity = G.config.kinetics?.activeZoneDensity || 0.04;
                const caLevel = G.Analytics?.state?.calcium || 0.1;
                const releaseProb = (G.Chemistry.scenarios[G.config.activeScenario]?.modifiers?.releaseProb || 0.5) * (caLevel * 5) * retrogradeInhibition;

                if (this.frame % 15 === 0 && Math.random() < releaseProb) {
                    G.Particles.create(w, h, 1, G.config);
                    const p = G.Particles.particles[G.Particles.particles.length - 1];
                    if (p) p.x = w * (0.5 - azDensity / 2 + Math.random() * azDensity);
                }

                if (G.config.activeScenario === 'adolescent' && this.frame % 300 === 0 && G.config.elements.receptors.length > 2) {
                    if (Math.random() > 0.8) {
                        G.config.elements.receptors.splice(Math.floor(Math.random() * G.config.elements.receptors.length), 1);
                        console.log('Synaptic pruning event: Receptor removed.');
                    }
                }

                this.handleReceptorInteractions(w, h);

                const activeReceptors = G.config.elements.receptors.filter(r => r.state === 'open' || r.state === 'active').length;
                if (G.Analytics) G.Analytics.update(G.Particles.particles.length, G.Particles.ions.length, activeReceptors);

                if (G.Visuals3D) {
                    G.Visuals3D.drawShadows(ctx, G.Particles.particles);
                    G.Visuals3D.drawDynamicLighting(ctx, G.config.elements.receptors, w, h);
                    G.Visuals3D.drawIonHeatMap(ctx, G.Particles.ions, w, h);
                    if (this.rulerActive && this.measurementStart) {
                        G.Visuals3D.drawMeasurement(ctx, this.measurementStart, this.mouse);
                    }
                }

                G.Particles.updateAndDraw(ctx, w, h);
            }

            if (G.Visuals3D) G.Visuals3D.restoreDepth(ctx);

            if (this.annotations.length > 0) {
                ctx.save();
                this.annotations.forEach(a => {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.beginPath(); ctx.arc(a.x, a.y, 4, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Arial';
                    ctx.fillText(a.text.toUpperCase(), a.x + 10, a.y + 5);
                });
                ctx.restore();
            }

            this.checkHover(w, h);

            if (G.Tooltips) {
                G.Tooltips.update(this.tooltip, this.hoveredId || this.sidebarHoveredId, this.mouse.x, this.mouse.y, G.config, this.currentLanguage);
                G.Tooltips.drawLabels(ctx, w, h, G.config, this.currentLanguage, this.hoveredId, this.sidebarHoveredId);
            }
        },

        handleReceptorInteractions(w, h) {
            if (!G.Particles || !G.Chemistry) return;
            const particles = G.Particles.particles;
            const chem = G.Chemistry;

            const surfaceY = this.getSurfaceY(h);

            const pharm = G.config.pharmacology || {};

            const pH = G.config.kinetics?.pH || 7.4;
            const pH_modifier = Math.max(0.1, 1.0 - Math.abs(pH - 7.4) * 2);

            const circadian_modifier = G.config.visuals?.isNight ? 0.7 : 1.0;

            G.config.elements.receptors.forEach(receptor => {
                if (receptor.state === 'internalized' || receptor.state === 'desensitized') {
                    receptor.recovery = (receptor.recovery || 0) + 1;
                    if (receptor.recovery > 300) {
                        receptor.state = (receptor.type === 'gpcr' ? 'idle' : 'closed');
                        receptor.activationCount = 0;
                    }
                    return;
                }

                const rx = w * receptor.x;
                const ry = surfaceY;

                particles.forEach(p => {
                    const dx = p.x - rx;
                    const dy = p.y - ry;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 20 && p.life > 0.1) {
                        const receptorType = chem.receptors[receptor.type];

                        let canBind = receptorType.binds.includes(p.chemistry.id);
                        if (!canBind && pharm.offTargetActive) {
                            const affinity = receptorType.offTargetAffinities?.[p.chemistry.id] || 0;
                            if (Math.random() < affinity) canBind = true;
                        }

                        if (canBind) {
                            const hill = p.chemistry.kinetics?.hill || 1.0;
                            if (Math.random() > (pH_modifier * circadian_modifier * hill)) return;

                            p.life = 0;

                            if (pharm.antagonistActive && receptor.type === 'ionotropic_receptor') return;

                            receptor.activationCount++;
                            if (receptor.activationCount > 50) {
                                receptor.state = 'internalized';
                                receptor.recovery = 0;
                                return;
                            } else if (receptor.activationCount > 30) {
                                receptor.state = 'desensitized';
                                if (Math.random() > 0.5) return;
                            }

                            if (receptor.type === 'ionotropic_receptor' && p.chemistry.ionEffect !== 'none') {
                                if (pharm.ttxActive && p.chemistry.ionEffect === 'sodium') return;

                                let ionsToCreate = 1;
                                if (pharm.benzodiazepineActive && p.chemistry.id === 'gaba') ionsToCreate = 3;

                                for (let k = 0; k < ionsToCreate; k++) {
                                    G.Particles.createIon(rx, ry + 10, p.chemistry.ionEffect);
                                }

                                receptor.state = 'open';
                                setTimeout(() => { if (receptor.state === 'open') receptor.state = 'closed'; }, 200);

                                if (G.Particles.ions.length > 30 && Math.random() > 0.9) {
                                    if (G.Molecular) G.Molecular.triggerRetrograde(rx, ry);
                                }

                            } else if (receptor.type === 'gpcr') {
                                receptor.state = 'active';
                                if (G.Molecular) G.Molecular.triggerCascade(rx, ry + 20);
                                setTimeout(() => { if (receptor.state === 'active') receptor.state = 'idle'; }, 500);
                            }
                        }
                    }
                });
            });
        },

        checkHover(w, h) {
            this.hoveredId = null;
            const mx = this.mouse.x;
            const my = this.mouse.y;
            const surfaceY = this.getSurfaceY(h);

            if (my < h * 0.44 && Math.abs(mx - w * 0.5) < w * 0.16) this.hoveredId = 'preSynapticTerminal';
            else if (my > surfaceY - 10 && Math.abs(mx - w * 0.5) < w * 0.28) this.hoveredId = 'postSynapticTerminal';

            G.config.elements.vesicles.forEach(v => {
                const vx = w * v.x, vy = h * v.y + Math.sin(this.frame * 0.04 + v.offset) * 8;
                if ((mx - vx) ** 2 + (my - vy) ** 2 < v.r ** 2 * 2) this.hoveredId = 'vesicle';
            });
        },

        drawStructure(ctx, w, h) {
            const centerX = w * 0.5, bulbY = h * 0.3, bW = w * 0.24;
            const surfaceY = this.getSurfaceY(h);
            const activeId = this.hoveredId || this.sidebarHoveredId;

            const spineWidthMod = G.Particles.plasticityFactor ? (G.Particles.plasticityFactor - 1.0) * 0.1 : 0;

            ctx.save();
            const preColor = activeId === 'preSynapticTerminal' ? (G.config.highContrast ? '#fff' : '#357438') : '#303830';
            ctx.fillStyle = preColor;
            ctx.beginPath();
            ctx.moveTo(centerX - w * 0.06, 0);
            ctx.bezierCurveTo(centerX - w * 0.06, h * 0.2, centerX - bW / 2, h * 0.2, centerX - bW / 2, bulbY);
            ctx.bezierCurveTo(centerX - bW / 2, h * 0.45, centerX + bW / 2, h * 0.45, centerX + bW / 2, bulbY);
            ctx.bezierCurveTo(centerX + bW / 2, h * 0.2, centerX + w * 0.06, h * 0.2, centerX + w * 0.06, 0);
            ctx.fill();

            const postColor = activeId === 'postSynapticTerminal' ? (G.config.highContrast ? '#fff' : '#732751') : '#1a1c1e';
            ctx.fillStyle = postColor;
            ctx.beginPath();
            ctx.moveTo(0, h); ctx.lineTo(0, h * 0.88);
            ctx.bezierCurveTo(w * 0.2, h * 0.88, centerX - w * (0.2 + spineWidthMod), surfaceY + h * 0.12, centerX - w * (0.2 + spineWidthMod), surfaceY);
            ctx.bezierCurveTo(centerX - w * (0.2 + spineWidthMod), surfaceY - h * 0.06, centerX + w * (0.2 + spineWidthMod), surfaceY - h * 0.06, centerX + w * (0.2 + spineWidthMod), surfaceY);
            ctx.bezierCurveTo(centerX + w * (0.2 + spineWidthMod), surfaceY + h * 0.12, w * 0.8, h * 0.88, w, h * 0.88);
            ctx.lineTo(w, h);
            ctx.fill();
            ctx.restore();

            G.config.elements.autoreceptors.forEach(ar => {
                ctx.fillStyle = '#673AB7';
                ctx.beginPath();
                ctx.arc(w * ar.x, h * ar.y, 6, 0, Math.PI * 2);
                ctx.fill();
            });

            G.config.elements.transporters.forEach(tr => {
                const isActive = G.config.pharmacology?.ssriActive && tr.type === 'SERT';
                ctx.fillStyle = isActive ? '#ff4444' : '#4CAF50';
                ctx.fillRect(w * tr.x - 4, h * tr.y - 8, 8, 16);
            });

            if (G.Chemistry) {
                const ntChem = G.Chemistry.neurotransmitters[G.config.activeNT];
                G.config.elements.vesicles.forEach(v => {
                    const vx = w * v.x, vy = h * v.y + Math.sin(this.frame * 0.04 + v.offset) * 8;
                    ctx.fillStyle = activeId === 'vesicle' ? '#fff' : ntChem.color;
                    ctx.beginPath(); ctx.arc(vx, vy, v.r, 0, Math.PI * 2); ctx.fill();
                });
            }

            G.config.elements.receptors.forEach(r => {
                const rx = w * r.x, ry = surfaceY - 5;
                if (r.state === 'internalized') {
                    ctx.strokeStyle = '#333';
                    ctx.setLineDash([2, 2]);
                    ctx.strokeRect(rx - 6, ry, 12, 12);
                    ctx.setLineDash([]);
                    return;
                }

                if (r.type === 'ionotropic_receptor') {
                    ctx.fillStyle = r.state === 'open' ? '#fff' : (r.state === 'desensitized' ? '#555' : '#4DB6AC');
                    ctx.fillRect(rx - 6, ry, 4, 12); ctx.fillRect(rx + 2, ry, 4, 12);
                }
            });
        },


    });
})();
