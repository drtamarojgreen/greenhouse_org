// docs/js/pathway_app.js
// Main application logic for the Pathway Visualization

(function () {
    'use strict';

    console.log("Pathway App: Module loaded.");

    const GreenhousePathwayApp = {
        canvas: null,
        ctx: null,
        container: null,

        init(targetSelector, selector = null) {
            // handle both (selector) and (container, selector) call styles if needed, 
            // but here init takes targetSelector string mostly.
            // Let's standardize: init(container, selector) or just init(selector) if container logic is inside.
            // The current code takes targetSelector string.

            if (typeof targetSelector !== 'string' && selector) {
                // Called via re-init with (container, selector)
                targetSelector = selector;
            }

            console.log(`Pathway App: Initializing in container: ${targetSelector}`);
            this.lastSelector = targetSelector;

            this.container = document.querySelector(targetSelector);
            if (!this.container) {
                console.error(`Pathway App: Target container with selector "${targetSelector}" not found.`);
                return;
            }

            // Clear the container
            this.container.innerHTML = '';
            this.container.style.position = 'relative';

            this.setupDOM();
            this.isRunning = true;
            this.animate();

            // Resilience using shared GreenhouseUtils
            if (window.GreenhouseUtils) {
                window.GreenhouseUtils.observeAndReinitializeApplication(this.container, targetSelector, this, 'init');
                window.GreenhouseUtils.startSentinel(this.container, targetSelector, this, 'init');
            }
        },

        setupDOM() {
            const wrapper = document.createElement('div');
            wrapper.style.width = '100%';
            wrapper.style.height = '500px';
            wrapper.style.background = '#181010'; // Slightly different dark color
            wrapper.style.borderRadius = '12px';
            wrapper.style.position = 'relative';

            this.canvas = document.createElement('canvas');
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.ctx = this.canvas.getContext('2d');

            wrapper.appendChild(this.canvas);
            this.container.appendChild(wrapper);

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
            ctx.fillStyle = '#181010';
            ctx.fillRect(0, 0, w, h);

            // --- Placeholder Content ---
            ctx.save();
            ctx.font = 'bold 24px "Courier New", Courier, monospace';
            ctx.fillStyle = '#FFC107'; // An amber color
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const centerX = w / 2;
            const centerY = h / 2;

            ctx.fillText("Pathway Visualization Page", centerX, centerY - 20);

            ctx.font = '16px "Courier New", Courier, monospace';
            ctx.fillStyle = '#9E9E9E';
            ctx.fillText("Module Loaded Successfully.", centerX, centerY + 20);
            ctx.restore();
            // --- End Placeholder ---
        },


    };

    // Expose the app to the global window object
    window.GreenhousePathwayApp = GreenhousePathwayApp;

})();
