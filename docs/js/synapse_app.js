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

            // --- Placeholder Content ---
            // Display a message to confirm the app is working.
            ctx.save();
            ctx.font = 'bold 24px "Courier New", Courier, monospace';
            ctx.fillStyle = '#4CAF50'; // A nice green color
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const centerX = w / 2;
            const centerY = h / 2;
            
            ctx.fillText("Synapse Visualization Page", centerX, centerY - 20);
            
            ctx.font = '16px "Courier New", Courier, monospace';
            ctx.fillStyle = '#9E9E9E'; // A lighter gray
            ctx.fillText("Module Loaded Successfully.", centerX, centerY + 20);
            ctx.restore();
            // --- End Placeholder ---
        }
    };

    // Expose the app to the global window object
    window.GreenhouseSynapseApp = GreenhouseSynapseApp;

})();
