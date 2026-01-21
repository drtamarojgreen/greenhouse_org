// docs/js/synapse_app.js
// Master Application Entry Point for Synapse Simulation
// Follows the unified loader + engine pattern used on live site (dopamine/serotonin)

(function () {
    'use strict';

    const G = window.GreenhouseSynapseApp || {};
    window.GreenhouseSynapseApp = G;

    G.config = G.config || {
        backgroundColor: '#050705',
        accentCyan: '#00F2FF',
        accentGold: '#FFD700',
        activeNT: 'serotonin',
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
                { x: 0.38, type: 'ionotropic_receptor', state: 'closed' },
                { x: 0.46, type: 'ionotropic_receptor', state: 'closed' },
                { x: 0.54, type: 'gpcr', state: 'idle' },
                { x: 0.62, type: 'ionotropic_receptor', state: 'closed' }
            ]
        }
    };
})();

(async function () {
    'use strict';

    const G = window.GreenhouseSynapseApp || {};
    window.GreenhouseSynapseApp = G;

    let GreenhouseUtils;
    let resilienceObserver = null;

    // --- Dependency Loading ---
    const loadDependencies = async () => {
        await new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 240; // 12 seconds
            const interval = setInterval(() => {
                if (window.GreenhouseUtils) {
                    clearInterval(interval);
                    GreenhouseUtils = window.GreenhouseUtils;
                    resolve();
                } else if (attempts++ >= maxAttempts) {
                    clearInterval(interval);
                    console.error('Synapse App: GreenhouseUtils load timeout');
                    reject(new Error('GreenhouseUtils load timeout'));
                }
            }, 50);
        });
    };

    // --- Attribute Capture ---
    const captureAttributes = () => {
        if (window._greenhouseScriptAttributes) {
            return {
                targetSelector: window._greenhouseScriptAttributes['target-selector-left'],
                baseUrl: window._greenhouseScriptAttributes['base-url']
            };
        }
        const script = document.currentScript;
        if (script) {
            return {
                targetSelector: script.getAttribute('data-target-selector-left'),
                baseUrl: script.getAttribute('data-base-url')
            };
        }
        // Fallback for manual testing
        const scripts = document.querySelectorAll('script[src*="synapse_app.js"]');
        if (scripts.length > 0) {
            const s = scripts[scripts.length - 1];
            return {
                targetSelector: s.getAttribute('data-target-selector-left'),
                baseUrl: s.getAttribute('data-base-url')
            };
        }
        return { targetSelector: null, baseUrl: null };
    };

    // --- Core Engine Logic ---
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

        init(targetSelector, baseUrl) {
            if (!targetSelector) return;
            this.lastSelector = targetSelector;
            this.baseUrl = baseUrl || '';

            console.log('SynapseApp: Initializing...');
            setTimeout(() => {
                this._initializeSimulation(targetSelector);
            }, 5000);
        },

        async _initializeSimulation(selector) {
            this.container = document.querySelector(selector);
            if (!this.container) {
                console.error(`SynapseApp: Target container ${selector} not found.`);
                return;
            }

            this.setupDOM();
            this.isRunning = true;
            this.animate();

            // Resilience
            this.observeAndReinitializeApp(this.container);
        },

        setupDOM() {
            const config = G.config;
            this.container.innerHTML = '';
            this.container.style.cssText = `
                display: flex; flex-direction: row; gap: 0; background: ${config.backgroundColor}; 
                border-radius: 24px; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.6);
                border: 1px solid rgba(53, 116, 56, 0.2); font-family: ${config.font}; height: 750px;
                position: relative;
            `;

            const sidebar = document.createElement('div');
            sidebar.id = 'synapse-sidebar';
            sidebar.style.cssText = `
                flex: 1; max-width: 340px; padding: 50px 40px; background: rgba(53, 116, 56, 0.05);
                backdrop-filter: blur(15px); border-right: 1px solid rgba(255, 255, 255, 0.05); color: #fff;
            `;
            this.container.appendChild(sidebar);

            const canvasWrapper = document.createElement('div');
            canvasWrapper.style.cssText = 'flex: 2; position: relative; overflow: hidden; background: #000;';
            this.canvas = document.createElement('canvas');
            this.canvas.style.cssText = 'width: 100%; height: 100%; display: block;';
            canvasWrapper.appendChild(this.canvas);
            this.container.appendChild(canvasWrapper);

            this.tooltip = document.createElement('div');
            this.tooltip.id = 'synapse-tooltip';
            this.tooltip.style.cssText = `
                position: absolute; display: none; padding: 12px 20px; background: rgba(5, 10, 5, 0.95); 
                color: #fff; border-radius: 12px; border: 1px solid rgba(53,116,56,0.5); z-index: 100; pointer-events: none;
            `;
            canvasWrapper.appendChild(this.tooltip);

            this.renderSidebar();
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            this.canvas.addEventListener('mousedown', () => this.handleMouseDown());
        },

        renderSidebar() {
            if (G.Sidebar) {
                G.Sidebar.render(document.getElementById('synapse-sidebar'), G.config, this.currentLanguage, {
                    onHover: (id) => this.sidebarHoveredId = id,
                    onNTChange: (ntId) => {
                        G.config.activeNT = ntId;
                        this.renderSidebar();
                    }
                });
            }
        },

        handleMouseMove(e) {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        },

        handleMouseDown() {
            const w = this.canvas.width / (window.devicePixelRatio || 1);
            const h = this.canvas.height / (window.devicePixelRatio || 1);
            if (this.mouse.y < h * 0.45 && Math.abs(this.mouse.x - w * 0.5) < w * 0.15) {
                if (G.Particles) {
                    G.Particles.create(w, h, 40, G.config, true);
                }
            }
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

            ctx.fillStyle = '#010501';
            ctx.fillRect(0, 0, w, h);

            if (G.ThreeD) G.ThreeD.applyDepthEffect(ctx, w, h, this.frame);

            this.drawStructure(ctx, w, h);

            if (G.Molecular) {
                G.Molecular.drawLipidBilayer(ctx, w, h);
                G.Molecular.drawSNAREComplex(ctx, w, h, this.frame);
                G.Molecular.drawScaffolding(ctx, w, h);
            }

            if (G.Particles) {
                if (this.frame % 15 === 0) G.Particles.create(w, h, 1, G.config);
                this.handleReceptorInteractions(w, h);

                if (G.Analytics) G.Analytics.update(G.Particles.particles, G.config.elements.receptors);
                if (G.ThreeD) {
                    G.ThreeD.drawShadows(ctx, G.config.elements.vesicles, w, h);
                    G.ThreeD.visualizeElectrostaticPotential(ctx, w, h, this.frame);
                }

                G.Particles.updateAndDraw(ctx, w, h);
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
            const surfaceY = h * 0.68;

            if (G.Controls) G.Controls.applyToSimulation(particles, G.config.elements.receptors);

            G.config.elements.receptors.forEach(receptor => {
                const rx = w * receptor.x;
                const ry = surfaceY;

                particles.forEach(p => {
                    const dx = p.x - rx;
                    const dy = p.y - ry;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 20 && p.life > 0.1) {
                        const receptorType = chem.receptors[receptor.type];
                        if (receptorType.binds.includes(p.chemistry.id)) {
                            p.life = 0;
                            if (receptor.type === 'ionotropic_receptor' && p.chemistry.ionEffect !== 'none') {
                                G.Particles.createIon(rx, ry + 10, p.chemistry.ionEffect);
                                receptor.state = 'open';
                                setTimeout(() => receptor.state = 'closed', 200);
                            } else if (receptor.type === 'gpcr') {
                                receptor.state = 'active';
                                setTimeout(() => receptor.state = 'idle', 500);
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

            if (my < h * 0.44 && Math.abs(mx - w * 0.5) < w * 0.16) this.hoveredId = 'preSynapticTerminal';
            else if (my > h * 0.6 && Math.abs(mx - w * 0.5) < w * 0.28) this.hoveredId = 'postSynapticTerminal';

            G.config.elements.vesicles.forEach(v => {
                const vx = w * v.x, vy = h * v.y + Math.sin(this.frame * 0.04 + v.offset) * 8;
                if ((mx - vx) ** 2 + (my - vy) ** 2 < v.r ** 2 * 2) this.hoveredId = 'vesicle';
            });
        },

        drawStructure(ctx, w, h) {
            const centerX = w * 0.5, bulbY = h * 0.3, bW = w * 0.24, surfaceY = h * 0.68;
            const activeId = this.hoveredId || this.sidebarHoveredId;

            ctx.save();
            const preColor = activeId === 'preSynapticTerminal' ? '#357438' : '#303830';
            ctx.fillStyle = preColor;
            ctx.beginPath();
            ctx.moveTo(centerX - w * 0.06, 0);
            ctx.bezierCurveTo(centerX - w * 0.06, h * 0.2, centerX - bW / 2, h * 0.2, centerX - bW / 2, bulbY);
            ctx.bezierCurveTo(centerX - bW / 2, h * 0.45, centerX + bW / 2, h * 0.45, centerX + bW / 2, bulbY);
            ctx.bezierCurveTo(centerX + bW / 2, h * 0.2, centerX + w * 0.06, h * 0.2, centerX + w * 0.06, 0);
            ctx.fill();

            const postColor = activeId === 'postSynapticTerminal' ? '#732751' : '#1a1c1e';
            ctx.fillStyle = postColor;
            ctx.beginPath();
            ctx.moveTo(0, h); ctx.lineTo(0, h * 0.88);
            ctx.bezierCurveTo(w * 0.2, h * 0.88, centerX - w * 0.2, surfaceY + h * 0.12, centerX - w * 0.2, surfaceY);
            ctx.bezierCurveTo(centerX - w * 0.2, surfaceY - h * 0.06, centerX + w * 0.2, surfaceY - h * 0.06, centerX + w * 0.2, surfaceY);
            ctx.bezierCurveTo(centerX + w * 0.2, surfaceY + h * 0.12, w * 0.8, h * 0.88, w, h * 0.88);
            ctx.lineTo(w, h);
            ctx.fill();
            ctx.restore();

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
                if (r.type === 'ionotropic_receptor') {
                    ctx.fillStyle = r.state === 'open' ? '#fff' : '#4DB6AC';
                    ctx.fillRect(rx - 6, ry, 4, 12); ctx.fillRect(rx + 2, ry, 4, 12);
                } else {
                    ctx.strokeStyle = r.state === 'active' ? '#fff' : '#D32F2F';
                    ctx.lineWidth = 3; ctx.beginPath();
                    ctx.moveTo(rx - 8, ry + 10);
                    for (let i = 0; i < 5; i++) ctx.lineTo(rx - 8 + i * 4, ry + (i % 2 === 0 ? -6 : 6));
                    ctx.stroke();
                }
            });
        },

        observeAndReinitializeApp(container) {
            if (!container) return;
            if (resilienceObserver) resilienceObserver.disconnect();
            const observerCallback = (mutations) => {
                const wasRemoved = mutations.some(m =>
                    Array.from(m.removedNodes).some(n => n.nodeType === 1 && n.tagName === 'CANVAS')
                );
                if (wasRemoved) {
                    this.isRunning = false;
                    setTimeout(() => {
                        if (G.init) G.init(this.lastSelector, this.baseUrl);
                    }, 5000);
                }
            };
            resilienceObserver = new MutationObserver(observerCallback);
            resilienceObserver.observe(container, { childList: true });
        }
    });

    // --- Main Entry ---
    async function main() {
        console.log('Synapse App: main() execution started.');
        try {
            await loadDependencies();
            const { targetSelector, baseUrl } = captureAttributes();

            if (!baseUrl) {
                console.warn('Synapse App: baseUrl not found in attributes, using default.');
            }

            // Load Modular Components
            const scripts = [
                'synapse_chemistry.js',
                'synapse_neurotransmitters.js',
                'synapse_sidebar.js',
                'synapse_tooltips.js',
                'synapse_controls.js',
                'synapse_analytics.js',
                'synapse_3d.js',
                'synapse_molecular.js'
            ];

            for (const script of scripts) {
                await GreenhouseUtils.loadScript(script, baseUrl || '');
            }

            if (targetSelector) {
                const container = await GreenhouseUtils.waitForElement(targetSelector);
                G.init(targetSelector, baseUrl);
            } else {
                console.warn('Synapse App: No target selector found, waiting for manual init.');
            }

        } catch (error) {
            console.error('Synapse App: Initialization sequence failed:', error);
        }
    }

    main();

})();
