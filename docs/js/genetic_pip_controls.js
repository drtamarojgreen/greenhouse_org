// docs/js/genetic_pip_controls.js
// Individual Controls for Each Picture-in-Picture View
// Uses GeneticCameraController for physics-based controls

(function () {
    'use strict';

    const GreenhouseGeneticPiPControls = {
        controllers: {},
        cameras: {}, // The state objects (cameras) for each PiP

        activePiP: null,
        config: null,

        /**
         * Initialize PiP controls
         * @param {Object} config - Configuration object
         */
        init(config) {
            this.config = config || window.GreenhouseGeneticConfig;

            // Initialize Cameras and Controllers for each PiP
            // Layout: 
            // Left: Helix (Macro)
            // Right: Micro (Gene), Protein, Target (Brain)
            ['helix', 'micro', 'protein', 'target'].forEach(name => {
                // Default Camera State
                this.cameras[name] = {
                    x: 0, y: 0, z: -200,
                    rotationX: 0, rotationY: 0, rotationZ: 0,
                    fov: 400
                };

                // Create Controller
                if (window.GreenhouseGeneticCameraController) {
                    this.controllers[name] = new window.GreenhouseGeneticCameraController(
                        this.cameras[name],
                        this.config
                    );
                }
            });

            console.log('GeneticPiPControls: Initialized with Controllers');
        },

        /**
         * Check if mouse is over a PiP
         */
        getPiPAtPosition(mouseX, mouseY, canvasWidth, canvasHeight) {
            // Use hardcoded values matching genetic_ui_3d.js render() method
            const pipW = 200;
            const pipH = 150;
            const gap = 10;

            // Right Side PiPs
            const rightPipX = canvasWidth - pipW - gap;

            // Left Side PiP
            const leftPipX = gap;

            const pips = [
                // Left
                { name: 'helix', x: leftPipX, y: gap },
                // Right
                { name: 'micro', x: rightPipX, y: gap },
                { name: 'protein', x: rightPipX, y: gap + pipH + gap },
                { name: 'target', x: rightPipX, y: gap + pipH + gap + pipH + gap }
            ];

            for (const pip of pips) {
                if (mouseX >= pip.x && mouseX <= pip.x + pipW &&
                    mouseY >= pip.y && mouseY <= pip.y + pipH) {
                    return pip.name;
                }
            }
            return null;
        },

        /**
         * Handle mouse down on PiP
         */
        handleMouseDown(e, canvas) {
            const rect = canvas.getBoundingClientRect();
            // Scale coordinates
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const mouseX = (e.clientX - rect.left) * scaleX;
            const mouseY = (e.clientY - rect.top) * scaleY;

            this.activePiP = this.getPiPAtPosition(mouseX, mouseY, canvas.width, canvas.height);

            if (this.activePiP && this.controllers[this.activePiP]) {
                // Delegate to controller
                this.controllers[this.activePiP].handleMouseDown(e);
                return true; // Event was handled
            }
            return false; // Event was not handled
        },

        /**
         * Handle mouse move on PiP
         */
        handleMouseMove(e) {
            if (this.activePiP && this.controllers[this.activePiP]) {
                this.controllers[this.activePiP].handleMouseMove(e);
                return true; // Event was handled
            }
            return false;
        },

        /**
         * Handle mouse up
         */
        handleMouseUp() {
            const wasActive = !!this.activePiP;
            if (this.activePiP && this.controllers[this.activePiP]) {
                this.controllers[this.activePiP].handleMouseUp();
            }
            this.activePiP = null;
            return wasActive;
        },

        /**
         * Handle mouse wheel on PiP
         */
        handleWheel(e, canvas) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const mouseX = (e.clientX - rect.left) * scaleX;
            const mouseY = (e.clientY - rect.top) * scaleY;

            const pipName = this.getPiPAtPosition(mouseX, mouseY, canvas.width, canvas.height);

            if (pipName && this.controllers[pipName]) {
                e.preventDefault();
                this.controllers[pipName].handleWheel(e);
                return true; // Event was handled
            }
            return false;
        },

        /**
         * Reset a specific PiP
         */
        resetPiP(pipName) {
            if (this.controllers[pipName]) {
                this.controllers[pipName].resetCamera();
            }
        },

        /**
         * Get state for a specific PiP (Camera Object)
         */
        getState(pipName) {
            const cam = this.cameras[pipName];
            if (!cam) return { zoom: 1.0, rotationY: 0, rotationX: 0, panX: 0, panY: 0 };

            return {
                zoom: Math.abs(cam.z) / 200,
                rotationX: cam.rotationX,
                rotationY: cam.rotationY,
                panX: cam.x,
                panY: cam.y,
                camera: cam
            };
        },

        /**
         * Update loop for all PiPs (Inertia, Auto-Rotate)
         */
        update() {
            Object.values(this.controllers).forEach(ctrl => ctrl.update());
        },

        /**
         * Draw control buttons for a PiP
         */
        drawControls(ctx, x, y, w, h, pipName) {
            const cam = this.cameras[pipName];
            if (!cam) return;

            // Draw control icons in top-right corner of PiP
            const iconSize = 16;
            const iconGap = 4;
            const iconX = x + w - iconSize - iconGap;
            let iconY = y + iconGap;

            // Reset button
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(iconX, iconY, iconSize, iconSize);
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('↻', iconX + iconSize / 2, iconY + iconSize / 2);

            // Zoom indicator (Show Z depth)
            iconY += iconSize + iconGap;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(iconX, iconY, iconSize, iconSize);
            ctx.fillStyle = '#fff';
            ctx.font = '9px Arial';
            ctx.fillText(Math.abs(Math.round(cam.z)), iconX + iconSize / 2, iconY + iconSize / 2);

            // Instructions (bottom of PiP)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x, y + h - 20, w, 20);
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('Drag: Rotate | Shift: Pan', x + 5, y + h - 10);
        },

        /**
         * Check if click is on reset button
         */
        checkResetButton(mouseX, mouseY, canvasWidth, canvasHeight) {
            // Use hardcoded values matching genetic_ui_3d.js render() method
            const pipW = 200;
            const pipH = 150;
            const gap = 10;

            const rightPipX = canvasWidth - pipW - gap;
            const leftPipX = gap;

            const iconSize = 16;
            const iconGap = 4;

            const pips = [
                { name: 'helix', x: leftPipX, y: gap },
                { name: 'micro', x: rightPipX, y: gap },
                { name: 'protein', x: rightPipX, y: gap + pipH + gap },
                { name: 'target', x: rightPipX, y: gap + pipH + gap + pipH + gap }
            ];

            for (const pip of pips) {
                const iconX = pip.x + pipW - iconSize - iconGap;
                const iconY = pip.y + iconGap;
                if (mouseX >= iconX && mouseX <= iconX + iconSize &&
                    mouseY >= iconY && mouseY <= iconY + iconSize) {
                    return pip.name;
                }
            }

            return null;
        }
    };

    window.GreenhouseGeneticPiPControls = GreenhouseGeneticPiPControls;
})();
