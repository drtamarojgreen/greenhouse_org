// docs/js/synapse_app.js
// Main application logic for the Synapse Visualization

// docs/js/synapse_app.js
// Core controller for the Synapse Visualization

(function () {
    'use strict';

    console.log("Synapse App: Module loaded.");

    const GreenhouseSynapseApp = {
        // State
        canvas: null,
        ctx: null,
        container: null,
        mouse: { x: 0, y: 0 },
        currentLanguage: 'en',
        hoveredItem: null,
        particles: [],
        neuromodulationWave: null,
        tour: {
            active: true,
            step: 0,
            progress: 0
        },

        // --- Core Application Flow ---

        init(targetSelector, baseUrl) {
            console.log(`Synapse App: Initializing in container: ${targetSelector}`);
            this.baseUrl = baseUrl || '';
            this.container = document.querySelector(targetSelector);

            if (!this.container) {
                console.error(`Synapse App: Target container not found.`);
                return;
            }

            this.setupDOM();
            this.animate();
        },

        setupDOM() {
            this.container.innerHTML = '';
            this.container.style.cssText = 'display: flex; flex-direction: row; gap: 20px; padding: 20px; background-color: #F8F9FA; border-radius: 12px;';

            // --- Create Sidebar ---
            const sidebar = document.createElement('div');
            sidebar.style.cssText = 'flex: 1; color: #212529; font-family: "Helvetica Neue", Arial, sans-serif;';
            sidebar.innerHTML = `
                <h1 style="font-size: 28px; margin-bottom: 15px;">Synaptic Cleft</h1>
                <p style="font-size: 16px; line-height: 1.6;">
                    This interactive model shows the process of neurotransmission. Neurotransmitters are released from the <strong>pre-synaptic terminal</strong>, travel across the synaptic cleft, and bind to <strong>receptors</strong> on the <strong>post-synaptic terminal</strong>.
                </p>
                <p style="font-size: 16px; line-height: 1.6;">
                    <strong>How to interact:</strong> Move your mouse over the elements to learn their names. Use the buttons in the top-right to switch languages.
                </p>
            `;
            this.container.appendChild(sidebar);

            // --- Create Canvas Container ---
            const canvasWrapper = document.createElement('div');
            canvasWrapper.style.cssText = 'flex: 2; height: 500px; position: relative; border: 1px solid #DEE2E6; border-radius: 8px; overflow: hidden;';

            this.canvas = document.createElement('canvas');
            this.canvas.style.cssText = 'width: 100%; height: 100%;';
            this.ctx = this.canvas.getContext('2d');
            
            canvasWrapper.appendChild(this.canvas);
            this.container.appendChild(canvasWrapper);

            this.canvas.addEventListener('mousemove', (e) => SynapseActions.handleMouseMove(this, e));
            this.canvas.addEventListener('click', (e) => SynapseActions.handleClick(this, e));
            
            window.addEventListener('resize', () => this.resize());
            this.resize();
        },

        resize() {
            if (!this.canvas) return;
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
        },

        animate() {
            requestAnimationFrame(() => this.animate());
            this.render();
        },

        render() {
            if (!this.ctx || !window.SynapseElements || !window.SynapseActions) return;

            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;
            const config = SynapseElements.config;

            // --- Calculations ---
            const parallaxIntensity = 20;
            const mouseOffsetX = (this.mouse.x / w) - 0.5;
            const mouseOffsetY = (this.mouse.y / h) - 0.5;
            const bgLayerX = mouseOffsetX * parallaxIntensity * 0.2;
            const bgLayerY = mouseOffsetY * parallaxIntensity * 0.2;
            const midLayerX = mouseOffsetX * parallaxIntensity * 0.5;
            const midLayerY = mouseOffsetY * parallaxIntensity * 0.5;

            const scaleIntensity = 0.1;
            const scaleFactor = 1.0 - (mouseOffsetY * scaleIntensity);

            // --- Update State ---
            SynapseActions.updateParticles(this, w, h);

            // --- Hit Detection ---
            SynapseActions.performHitDetection(this, ctx, w, h, { bgLayerX, bgLayerY, midLayerX, midLayerY }, scaleFactor);

            // --- Drawing ---
            ctx.fillStyle = config.backgroundColor;
            ctx.fillRect(0, 0, w, h);

            SynapseElements.drawNeuromodulationWave(this, ctx);
            SynapseElements.drawPostSynapticTerminal(ctx, w, h, bgLayerX, bgLayerY);
            SynapseElements.drawIonChannels(ctx, w, h, bgLayerX, bgLayerY);
            SynapseElements.drawGPCRs(ctx, w, h, bgLayerX, bgLayerY);
            SynapseElements.drawPreSynapticTerminal(ctx, w, h, midLayerX, midLayerY);
            SynapseElements.drawParticles(this, ctx, this.particles);
            SynapseElements.drawVesicles(ctx, w, h, midLayerX, midLayerY, scaleFactor);
            SynapseElements.drawCalciumBlockers(ctx, w, h, bgLayerX, bgLayerY);

            ctx.save();
            ctx.font = config.titleFont;
            ctx.fillStyle = config.titleColor;
            ctx.textAlign = 'center';
            const titleText = config.translations.synapticCleft[this.currentLanguage];
            ctx.fillText(titleText, w / 2, 30);
            ctx.restore();

            SynapseActions.drawTooltip(this, ctx);
            SynapseActions.drawLanguageSwitcher(this, ctx);
            SynapseElements.drawLegend(this, ctx);

            // Draw guided tour on top of everything
            SynapseActions.drawTour(this, ctx, w, h);
        }
    };

    window.GreenhouseSynapseApp = GreenhouseSynapseApp;

})();
