// docs/js/pathway_app.js
// Main application logic for the Pathway Visualization

(function () {
    'use strict';

    console.log("Pathway App: Module loaded.");

    const GreenhousePathwayApp = {
        canvas: null,
        ctx: null,
        container: null,

        init(targetSelector) {
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

            this.observeAndReinitializeApp(this.container);
            this.startCanvasSentinel(this.container);
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

        observeAndReinitializeApp(container) {
            if (!container) return;
            if (this.resilienceObserver) this.resilienceObserver.disconnect();
            const observerCallback = (mutations) => {
                const wasRemoved = mutations.some(m => Array.from(m.removedNodes).some(n => n === container || (n.nodeType === 1 && n.contains(container))));
                if (wasRemoved) {
                    if (this.resilienceObserver) this.resilienceObserver.disconnect();
                    // Re-init logic
                    setTimeout(() => {
                        if (this.lastSelector) this.init(this.lastSelector);
                    }, 1000);
                }
            };
            this.resilienceObserver = new MutationObserver(observerCallback);
            this.resilienceObserver.observe(document.body, { childList: true, subtree: true });
        },

        startCanvasSentinel(container) {
            if (this.sentinelInterval) clearInterval(this.sentinelInterval);
            this.sentinelInterval = setInterval(() => {
                const currentContainer = document.querySelector(this.lastSelector);
                // Check if container AND canvas exist in DOM
                const currentCanvas = currentContainer ? currentContainer.querySelector('canvas') : null;

                if (this.isRunning && (!currentContainer || !currentCanvas || !document.body.contains(currentCanvas))) {
                    console.log('Pathway App: DOM lost, re-initializing...');
                    this.isRunning = false; // Stop internal loop if any
                    if (this.lastSelector) this.init(this.lastSelector);
                }
            }, 3000);
        }
    };

    // Expose the app to the global window object
    window.GreenhousePathwayApp = GreenhousePathwayApp;

})();
