// docs/js/synapse_app.js
// Main application logic for the Synapse Visualization

(function () {
    'use strict';

    console.log("Synapse App: Module loaded.");

    const config = {
        backgroundColor: '#101018',
        preSynapticColor: '#2c3e50',
        postSynapticColor: '#34495e',
        vesicleColor: '#e67e22',
        ionChannelColor: '#3498db',
        gpcrColor: '#9b59b6',
        titleFont: 'bold 20px "Courier New", Courier, monospace',
        titleColor: '#9E9E9E',
        labelFont: '12px "Courier New", Courier, monospace',
        labelColor: '#ecf0f1',
        tooltipBg: 'rgba(0, 0, 0, 0.7)',
        tooltipColor: '#ffffff',
        translations: {
            preSynapticTerminal: { en: 'Pre-Synaptic Terminal', es: 'Terminal Presináptica' },
            postSynapticTerminal: { en: 'Post-Synaptic Terminal', es: 'Terminal Postsináptica' },
            vesicle: { en: 'Vesicle', es: 'Vesícula' },
            ionChannel: { en: 'Ion Channel', es: 'Canal Iónico' },
            gpcr: { en: 'G-protein Coupled Receptor', es: 'Receptor acoplado a proteína G' },
            synapticCleft: { en: 'Synaptic Cleft Visualization', es: 'Visualización de la Hendidura Sináptica' }
        },
        vesicles: [
            { id: 'vesicle', x: 0.2, y: 0.2, r: 15 },
            { x: 0.5, y: 0.15, r: 20 },
            { x: 0.8, y: 0.25, r: 18 }
        ],
        ionChannels: [0.2, 0.6],
        gpcrs: [0.4, 0.8]
    };

    const GreenhouseSynapseApp = {
        canvas: null,
        ctx: null,
        container: null,
        mouse: { x: 0, y: 0 },
        currentLanguage: 'en',
        hoveredItem: null,

        init(targetSelector, baseUrl) {
            console.log(`Synapse App: Initializing in container: ${targetSelector}`);
            this.baseUrl = baseUrl || '';

            this.container = document.querySelector(targetSelector);
            if (!this.container) {
                console.error(`Synapse App: Target container with selector "${targetSelector}" not found.`);
                return;
            }

            // Clear the container
            this.container.innerHTML = '';
            this.container.style.position = 'relative'; // Needed for absolute positioning inside

            this.setupDOM();
            this.animate();
        },

        setupDOM() {
            const wrapper = document.createElement('div');
            wrapper.style.width = '100%';
            wrapper.style.height = '500px'; // A fixed height for the canvas
            wrapper.style.background = '#101018';
            wrapper.style.borderRadius = '12px';
            wrapper.style.position = 'relative';

            this.canvas = document.createElement('canvas');
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.ctx = this.canvas.getContext('2d');
            
            wrapper.appendChild(this.canvas);
            this.container.appendChild(wrapper);

            // Add mouse move listener
            this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            this.canvas.addEventListener('click', (e) => this.handleClick(e));
            
            // Set canvas resolution to match its display size
            this.resize();
            window.addEventListener('resize', () => this.resize());
        },

        handleMouseMove(e) {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
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
            if (!this.ctx) return;
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

            // --- Parallax Calculation ---
            const parallaxIntensity = 20; // Max pixels to shift
            const mouseOffsetX = (this.mouse.x / w) - 0.5;
            const mouseOffsetY = (this.mouse.y / h) - 0.5;
            const bgLayerX = mouseOffsetX * parallaxIntensity * 0.2;
            const bgLayerY = mouseOffsetY * parallaxIntensity * 0.2;
            const midLayerX = mouseOffsetX * parallaxIntensity * 0.5;
            const midLayerY = mouseOffsetY * parallaxIntensity * 0.5;
            const fgLayerX = mouseOffsetX * parallaxIntensity * 1.0;
            const fgLayerY = mouseOffsetY * parallaxIntensity * 1.0;

            // --- Dynamic Scaling Calculation ---
            const scaleIntensity = 0.1; // Max scale change (e.g., 10%)
            const scaleFactor = 1.0 - (mouseOffsetY * scaleIntensity);

            // Clear background
            ctx.fillStyle = config.backgroundColor;
            ctx.fillRect(0, 0, w, h);

            // Draw layers from back to front
            this.drawPostSynapticTerminal(ctx, w, h, bgLayerX, bgLayerY);
            this.drawIonChannels(ctx, w, h, bgLayerX, bgLayerY);
            this.drawGPCRs(ctx, w, h, bgLayerX, bgLayerY);

            this.drawPreSynapticTerminal(ctx, w, h, midLayerX, midLayerY);
            this.drawVesicles(ctx, w, h, midLayerX, midLayerY, scaleFactor);

            // Title is now translatable
            ctx.save();
            ctx.font = config.titleFont;
            ctx.fillStyle = config.titleColor;
            ctx.textAlign = 'center';
            const titleText = config.translations.synapticCleft[this.currentLanguage];
            ctx.fillText(titleText, w / 2, 30);
            ctx.restore();

            // Draw tooltip if an item is hovered
            this.drawTooltip(ctx);

            // Draw language switcher UI
            this.drawLanguageSwitcher(ctx);
        },

        handleClick(e) {
            const w = this.canvas.width;
            // Check if EN button was clicked
            if (this.mouse.x > w - 70 && this.mouse.x < w - 40 && this.mouse.y > 10 && this.mouse.y < 30) {
                this.currentLanguage = 'en';
            }
            // Check if ES button was clicked
            if (this.mouse.x > w - 35 && this.mouse.x < w - 5 && this.mouse.y > 10 && this.mouse.y < 30) {
                this.currentLanguage = 'es';
            }
        },

        drawLanguageSwitcher(ctx) {
            const w = this.canvas.width;
            ctx.save();
            ctx.font = 'bold 14px "Courier New", Courier, monospace';

            // EN button
            ctx.fillStyle = this.currentLanguage === 'en' ? '#FFFFFF' : '#888888';
            ctx.fillText('EN', w - 60, 25);

            // Separator
            ctx.fillStyle = '#555555';
            ctx.fillText('|', w - 40, 25);

            // ES button
            ctx.fillStyle = this.currentLanguage === 'es' ? '#FFFFFF' : '#888888';
            ctx.fillText('ES', w - 25, 25);

            ctx.restore();
        },

        drawTooltip(ctx) {
            if (!this.hoveredItem) return;

            const text = config.translations[this.hoveredItem][this.currentLanguage];
            if (!text) return;

            const x = this.mouse.x + 15;
            const y = this.mouse.y + 15;

            ctx.font = config.labelFont;
            const textWidth = ctx.measureText(text).width;

            ctx.fillStyle = config.tooltipBg;
            ctx.fillRect(x - 5, y - 15, textWidth + 10, 20);

            ctx.fillStyle = config.tooltipColor;
            ctx.fillText(text, x, y);
        },

        drawPreSynapticTerminal(ctx, w, h, offsetX, offsetY) {
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.beginPath();
            ctx.moveTo(0, h * 0.4);
            ctx.bezierCurveTo(w * 0.25, h * 0.3, w * 0.75, h * 0.3, w, h * 0.4);
            ctx.lineTo(w, 0);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fillStyle = config.preSynapticColor;
            ctx.fill();
            
            ctx.strokeStyle = config.postSynapticColor;
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();
        },

        drawPostSynapticTerminal(ctx, w, h, offsetX, offsetY) {
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.beginPath();
            ctx.moveTo(0, h * 0.6);
            ctx.bezierCurveTo(w * 0.25, h * 0.7, w * 0.75, h * 0.7, w, h * 0.6);
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fillStyle = config.postSynapticColor;
            ctx.fill();

            ctx.strokeStyle = config.preSynapticColor;
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();
        },

        drawVesicles(ctx, w, h, offsetX, offsetY, scale) {
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.fillStyle = config.vesicleColor;
            config.vesicles.forEach(v => {
                ctx.beginPath();
                ctx.arc(w * v.x, h * v.y, v.r * scale, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        },

        drawIonChannels(ctx, w, h, offsetX, offsetY) {
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.fillStyle = config.ionChannelColor;
            config.ionChannels.forEach(x => {
                ctx.fillRect(w * x - 10, h * 0.6 - 15, 20, 15);
            });
            ctx.restore();
        },

        drawGPCRs(ctx, w, h, offsetX, offsetY) {
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.strokeStyle = config.gpcrColor;
            ctx.lineWidth = 4;
            config.gpcrs.forEach(x => {
                ctx.beginPath();
                ctx.moveTo(w * x - 15, h * 0.6);
                ctx.bezierCurveTo(w * x - 5, h * 0.6 - 10, w * x + 5, h * 0.6 - 10, w * x + 15, h * 0.6);
                ctx.stroke();
            });
            ctx.restore();
        },

        drawLabels(ctx, w, h, offsetX, offsetY, scale) {
            ctx.save();
            ctx.translate(offsetX, offsetY);
            // Scale font size
            const baseFontSize = 12;
            ctx.font = `${baseFontSize * scale}px "Courier New", Courier, monospace`;
            ctx.fillStyle = config.labelColor;
            ctx.textAlign = 'center';

            for (const key in config.labels) {
                const label = config.labels[key];
                ctx.fillText(label.text, w * label.x, h * label.y);
            }

            ctx.restore();
        }
    };

    // Expose the app to the global window object
    window.GreenhouseSynapseApp = GreenhouseSynapseApp;

})();
