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

        init(targetSelector, baseUrl) {
            this.lastSelector = targetSelector;
            this.baseUrl = baseUrl || '';
            this._initializeSimulation(targetSelector);
        },

        _initializeSimulation(selector) {
            // Check dependencies
            if (!G.Chemistry || !G.Particles || !G.Sidebar || !G.Tooltips ||
                !G.Controls || !G.Analytics || !G.Visuals3D || !G.Molecular) {
                console.error('SynapseApp: Missing modular dependencies.');
                return;
            }

            this.container = document.querySelector(selector);
            if (!this.container) return;

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

            if (!this.handleResize) {
                this.handleResize = this.resize.bind(this);
            }
            window.removeEventListener('resize', this.handleResize);
            window.addEventListener('resize', this.handleResize);
            this.resize();

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
                        }
                    });
                }

                if (G.Analytics) {
                    G.Analytics.renderDashboard(document.getElementById('synapse-sidebar'));
                }
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

            if (G.Molecular) {
                G.Molecular.drawECM(ctx, w, h);
                G.Molecular.drawAstrocyte(ctx, w, h);
            }

            if (G.Visuals3D) G.Visuals3D.applyDepth(ctx, w, h);

            this.drawStructure(ctx, w, h);

            if (G.Molecular) {
                const surfaceY = h * 0.68;
                G.Molecular.drawLipidBilayer(ctx, w * 0.3, h * 0.44, w * 0.4, false);
                G.Molecular.drawLipidBilayer(ctx, w * 0.2, surfaceY, w * 0.6, true);

                if (this.frame % 60 < 20) {
                    G.Molecular.drawSNARE(ctx, w * 0.5, h * 0.4, (this.frame % 60) / 20);
                }
            }

            if (G.Particles) {
                if (this.frame % 15 === 0) G.Particles.create(w, h, 1, G.config);
                this.handleReceptorInteractions(w, h);

                if (G.Analytics) G.Analytics.update(G.Particles.particles.length, G.Particles.ions.length);
                if (G.Visuals3D) {
                    G.Visuals3D.drawShadows(ctx, G.Particles.particles);
                }

                G.Particles.updateAndDraw(ctx, w, h);
            }

            if (G.Visuals3D) G.Visuals3D.restoreDepth(ctx);

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

            const isAntagonistActive = G.config.pharmacology?.antagonistActive;

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

                            // Enhancement #54: Competitive Inhibition
                            if (isAntagonistActive && receptor.type === 'ionotropic_receptor') {
                                return; // Block binding
                            }

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

            // Draw Auto-receptors (Enhancement #43)
            G.config.elements.autoreceptors.forEach(ar => {
                ctx.fillStyle = '#673AB7';
                ctx.beginPath();
                ctx.arc(w * ar.x, h * ar.y, 6, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw Transporters (Enhancement #41)
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
                    if (resilienceObserver) resilienceObserver.disconnect();
                    setTimeout(() => {
                        if (G.init) G.init(this.lastSelector, this.baseUrl);
                    }, 5000);
                }
            };
            resilienceObserver = new MutationObserver(observerCallback);
            resilienceObserver.observe(container, { childList: true });
        }
    });
})();
