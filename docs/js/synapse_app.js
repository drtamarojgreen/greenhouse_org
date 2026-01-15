// docs/js/synapse_app.js
// Optimized & Refactored Synapse Visualization Logic

(function () {
    'use strict';

    console.log("Synapse App: Orchestrator Hooked.");

    const config = {
        backgroundColor: '#050705',
        accentCyan: '#00F2FF',
        accentGold: '#FFD700',
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
            ]
        }
    };

    const GreenhouseSynapseApp = {
        canvas: null,
        ctx: null,
        container: null,
        frame: 0,
        mouse: { x: 0, y: 0 },
        currentLanguage: 'en',
        hoveredId: null,
        sidebarHoveredId: null,

        init(targetSelector, baseUrl) {
            this.baseUrl = baseUrl || '';
            this.container = document.querySelector(targetSelector);
            if (!this.container) return;

            this.setupDOM();
            this.animate();
        },

        setupDOM() {
            this.container.innerHTML = '';
            this.container.style.cssText = `
                display: flex; flex-direction: row; gap: 0; background: ${config.backgroundColor}; 
                border-radius: 24px; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.6);
                border: 1px solid rgba(53, 116, 56, 0.2); font-family: ${config.font}; height: 750px;
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

            // Initialize Sidebar Module
            if (window.GreenhouseSynapseSidebar) {
                window.GreenhouseSynapseSidebar.render(sidebar, config, this.currentLanguage, (id) => {
                    this.sidebarHoveredId = id;
                });
            }

            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            this.canvas.addEventListener('mousedown', () => this.handleMouseDown());
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
                if (window.GreenhouseSynapseParticles) {
                    window.GreenhouseSynapseParticles.create(w, h, 40, true);
                }
            }
        },

        resize() {
            if (!this.canvas) return;
            const dpr = window.devicePixelRatio || 1;
            const width = this.canvas.clientWidth;
            const height = this.canvas.clientHeight;

            // Set internal resolution
            this.canvas.width = width * dpr;
            this.canvas.height = height * dpr;

            this.ctx = this.canvas.getContext('2d');
            // FIX: Use setTransform to avoid accumulation and fix the "tiny corner" scaling issue
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        },

        animate() {
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

            this.drawStructure(ctx, w, h);

            // Particle System Module
            if (window.GreenhouseSynapseParticles) {
                if (this.frame % 15 === 0) window.GreenhouseSynapseParticles.create(w, h, 1);
                window.GreenhouseSynapseParticles.updateAndDraw(ctx, w, h, config.accentCyan);
            }

            this.checkHover(w, h);

            // Tooltip & Canvas Labels Module
            if (window.GreenhouseSynapseTooltips) {
                window.GreenhouseSynapseTooltips.update(this.tooltip, this.hoveredId || this.sidebarHoveredId, this.mouse.x, this.mouse.y, config, this.currentLanguage);
                window.GreenhouseSynapseTooltips.drawLabels(ctx, w, h, config, this.currentLanguage, this.hoveredId, this.sidebarHoveredId);
            }
        },

        checkHover(w, h) {
            this.hoveredId = null;
            const mx = this.mouse.x;
            const my = this.mouse.y;

            if (my < h * 0.44 && Math.abs(mx - w * 0.5) < w * 0.16) {
                this.hoveredId = 'preSynapticTerminal';
            } else if (my > h * 0.6 && Math.abs(mx - w * 0.5) < w * 0.28) {
                this.hoveredId = 'postSynapticTerminal';
            }

            config.elements.vesicles.forEach(v => {
                const vx = w * v.x;
                const vy = h * v.y + Math.sin(this.frame * 0.04 + v.offset) * 8;
                const dx = mx - vx;
                const dy = my - vy;
                if (dx * dx + dy * dy < v.r * v.r * 2) {
                    this.hoveredId = 'vesicle';
                }
            });
        },

        drawStructure(ctx, w, h) {
            const centerX = w * 0.5;
            const bulbY = h * 0.3;
            const bW = w * 0.24;
            const surfaceY = h * 0.68;
            const activeId = this.hoveredId || this.sidebarHoveredId;

            // Pre-Synaptic
            ctx.save();
            const preGrad = ctx.createLinearGradient(centerX - bW / 2, 0, centerX + bW / 2, h * 0.4);
            preGrad.addColorStop(0, '#505850');
            preGrad.addColorStop(1, '#1a1c1e');
            ctx.fillStyle = activeId === 'preSynapticTerminal' ? '#357438' : preGrad;

            ctx.beginPath();
            ctx.moveTo(centerX - w * 0.06, 0);
            ctx.bezierCurveTo(centerX - w * 0.06, h * 0.2, centerX - bW / 2, h * 0.2, centerX - bW / 2, bulbY);
            ctx.bezierCurveTo(centerX - bW / 2, h * 0.45, centerX + bW / 2, h * 0.45, centerX + bW / 2, bulbY);
            ctx.bezierCurveTo(centerX + bW / 2, h * 0.2, centerX + w * 0.06, h * 0.2, centerX + w * 0.06, 0);
            ctx.fill();
            ctx.restore();

            // Post-Synaptic
            ctx.save();
            const postGrad = ctx.createLinearGradient(0, surfaceY, 0, h);
            postGrad.addColorStop(0, '#2c3e50');
            postGrad.addColorStop(1, '#050705');
            ctx.fillStyle = activeId === 'postSynapticTerminal' ? '#732751' : postGrad;

            ctx.beginPath();
            ctx.moveTo(0, h);
            ctx.lineTo(0, h * 0.88);
            ctx.bezierCurveTo(w * 0.2, h * 0.88, centerX - w * 0.2, surfaceY + h * 0.12, centerX - w * 0.2, surfaceY);
            ctx.bezierCurveTo(centerX - w * 0.2, surfaceY - h * 0.06, centerX + w * 0.2, surfaceY - h * 0.06, centerX + w * 0.2, surfaceY);
            ctx.bezierCurveTo(centerX + w * 0.2, surfaceY + h * 0.12, w * 0.8, h * 0.88, w, h * 0.88);
            ctx.lineTo(w, h);
            ctx.fill();
            ctx.restore();

            // Vesicles
            config.elements.vesicles.forEach(v => {
                const vx = w * v.x;
                const vy = h * v.y + Math.sin(this.frame * 0.04 + v.offset) * 8;
                ctx.fillStyle = activeId === 'vesicle' ? '#FFFFFF' : config.accentGold;
                ctx.beginPath(); ctx.arc(vx, vy, v.r, 0, Math.PI * 2); ctx.fill();
            });
        }
    };

    window.GreenhouseSynapseApp = GreenhouseSynapseApp;
})();
