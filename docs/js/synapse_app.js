// docs/js/synapse_app.js
// Main application logic for the Synapse Visualization

// docs/js/synapse_app.js
// Main application logic for the Synapse Visualization

(function () {
    'use strict';

    console.log("Synapse App: Module loaded.");

    const GreenhouseSynapseApp = {
        canvas: null,
        ctx: null,
        container: null,
        cameraController: null,
        mockConnection: { // A mock connection object for the renderer
            weight: 1, // Excitatory
            synapseDetails: null // Let the renderer initialize this
        },

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

            // Initialize the 3D camera controller
            this.cameraController = new window.NeuroSynapseCameraController();

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

            // Add event listeners for camera controls
            this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            window.addEventListener('mousemove', (e) => this.handleMouseMove(e)); // Listen on window for dragging outside canvas
            window.addEventListener('mouseup', (e) => this.handleMouseUp(e));
            this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
            this.canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // Prevent right-click menu
            
            // Set canvas resolution to match its display size
            this.resize();
            window.addEventListener('resize', () => this.resize());
        },

        // --- Event Handlers for Camera Controls ---
        handleMouseDown(e) {
            if (this.cameraController) {
                // The controller handles its own logic, we just pass the event
                this.cameraController.handleMouseDown(e, this.canvas, { x: 0, y: 0, w: this.canvas.width, h: this.canvas.height });
            }
        },

        handleMouseMove(e) {
            if (this.cameraController) {
                this.cameraController.handleMouseMove(e, this.canvas);
            }
        },

        handleMouseUp(e) {
            if (this.cameraController) {
                this.cameraController.handleMouseUp(e);
            }
        },

        handleWheel(e) {
            if (this.cameraController) {
                this.cameraController.handleWheel(e, this.canvas, { x: 0, y: 0, w: this.canvas.width, h: this.canvas.height });
            }
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
            if (!this.ctx || !this.cameraController || !window.GreenhouseNeuroSynapse || !window.GreenhouseData) return;

            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

            // Clear background
            ctx.fillStyle = '#101018';
            ctx.fillRect(0, 0, w, h);

            // Update and render the 3D synapse
            this.cameraController.update();
            const camera = this.cameraController.getCamera();
            
            // The drawSynapsePiP function is being reused as a full-canvas renderer
            window.GreenhouseNeuroSynapse.drawSynapsePiP(
                ctx,
                0, 0, w, h, // Full canvas dimensions
                this.mockConnection,
                window.GreenhouseData.synapseMeshes,
                true, // isMainView = true
                camera
            );
        }
    };

    // Expose the app to the global window object
    window.GreenhouseSynapseApp = GreenhouseSynapseApp;

})();
