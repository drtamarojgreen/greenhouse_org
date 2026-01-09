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
            this.container.style.position = 'relative';

            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'width: 100%; height: 500px; background: #101018; border-radius: 12px; position: relative;';

            this.canvas = document.createElement('canvas');
            this.canvas.style.cssText = 'width: 100%; height: 100%;';
            this.ctx = this.canvas.getContext('2d');
            
            wrapper.appendChild(this.canvas);
            this.container.appendChild(wrapper);

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

            // --- Hit Detection ---
            SynapseActions.performHitDetection(this, ctx, w, h, { bgLayerX, bgLayerY, midLayerX, midLayerY }, scaleFactor);

            // --- Drawing ---
            ctx.fillStyle = config.backgroundColor;
            ctx.fillRect(0, 0, w, h);

            SynapseElements.drawPostSynapticTerminal(ctx, w, h, bgLayerX, bgLayerY);
            SynapseElements.drawIonChannels(ctx, w, h, bgLayerX, bgLayerY);
            SynapseElements.drawGPCRs(ctx, w, h, bgLayerX, bgLayerY);
            SynapseElements.drawPreSynapticTerminal(ctx, w, h, midLayerX, midLayerY);
            SynapseElements.drawVesicles(ctx, w, h, midLayerX, midLayerY, scaleFactor);

            ctx.save();
            ctx.font = config.titleFont;
            ctx.fillStyle = config.titleColor;
            ctx.textAlign = 'center';
            const titleText = config.translations.synapticCleft[this.currentLanguage];
            ctx.fillText(titleText, w / 2, 30);
            ctx.restore();

            SynapseActions.drawTooltip(this, ctx);
            SynapseActions.drawLanguageSwitcher(this, ctx);
        }
    };

    window.GreenhouseSynapseApp = GreenhouseSynapseApp;

})();
