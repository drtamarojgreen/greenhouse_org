// docs/js/synapse_app.js
// Main application logic for the Synapse Visualization

(function () {
    'use strict';

    console.log("Synapse App: Module loaded.");

    const GreenhouseSynapseApp = {
        canvas: null,
        ctx: null,
        container: null,

        init(targetSelector) {
            console.log(`Synapse App: Initializing in container: ${targetSelector}`);

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
            
            // Set canvas resolution to match its display size
            this.resize();
            window.addEventListener('resize', () => this.resize());
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

            // Clear background
            ctx.fillStyle = '#101018';
            ctx.fillRect(0, 0, w, h);

            this.drawPreSynapticTerminal(ctx, w, h);
            this.drawPostSynapticTerminal(ctx, w, h);
            this.drawVesicles(ctx, w, h);
            this.drawIonChannels(ctx, w, h);
            this.drawGPCRs(ctx, w, h);

            // Title
            ctx.save();
            ctx.font = 'bold 20px "Courier New", Courier, monospace';
            ctx.fillStyle = '#9E9E9E';
            ctx.textAlign = 'center';
            ctx.fillText("Synaptic Cleft Visualization", w / 2, 30);
            ctx.restore();
        },

        drawPreSynapticTerminal(ctx, w, h) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(0, h * 0.4);
            ctx.bezierCurveTo(w * 0.25, h * 0.3, w * 0.75, h * 0.3, w, h * 0.4);
            ctx.lineTo(w, 0);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fillStyle = '#2c3e50'; // Dark blue-gray
            ctx.fill();
            
            ctx.strokeStyle = '#34495e';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();
        },

        drawPostSynapticTerminal(ctx, w, h) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(0, h * 0.6);
            ctx.bezierCurveTo(w * 0.25, h * 0.7, w * 0.75, h * 0.7, w, h * 0.6);
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fillStyle = '#34495e'; // Slightly lighter blue-gray
            ctx.fill();

            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();
        },

        drawVesicles(ctx, w, h) {
            const vesicles = [
                { x: w * 0.2, y: h * 0.2, r: 15 },
                { x: w * 0.5, y: h * 0.15, r: 20 },
                { x: w * 0.8, y: h * 0.25, r: 18 }
            ];

            ctx.save();
            ctx.fillStyle = '#e67e22'; // Orange
            vesicles.forEach(v => {
                ctx.beginPath();
                ctx.arc(v.x, v.y, v.r, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        },

        drawIonChannels(ctx, w, h) {
            const channels = [w * 0.2, w * 0.6];
            ctx.save();
            ctx.fillStyle = '#3498db'; // Blue
            channels.forEach(x => {
                ctx.fillRect(x - 10, h * 0.6 - 15, 20, 15);
            });
            ctx.restore();
        },

        drawGPCRs(ctx, w, h) {
            const receptors = [w * 0.4, w * 0.8];
            ctx.save();
            ctx.strokeStyle = '#9b59b6'; // Purple
            ctx.lineWidth = 4;
            receptors.forEach(x => {
                ctx.beginPath();
                ctx.moveTo(x - 15, h * 0.6);
                ctx.bezierCurveTo(x - 5, h * 0.6 - 10, x + 5, h * 0.6 - 10, x + 15, h * 0.6);
                ctx.stroke();
            });
            ctx.restore();
        }
    };

    // Expose the app to the global window object
    window.GreenhouseSynapseApp = GreenhouseSynapseApp;

})();
