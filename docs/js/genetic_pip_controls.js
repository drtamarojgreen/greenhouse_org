// docs/js/genetic_pip_controls.js
// Individual Controls for Each Picture-in-Picture View

(function () {
    'use strict';

    const GreenhouseGeneticPiPControls = {
        pipStates: {
            micro: { zoom: 1.0, rotationY: 0, rotationX: 0, panX: 0, panY: 0 },
            protein: { zoom: 1.0, rotationY: 0, rotationX: 0, panX: 0, panY: 0 },
            target: { zoom: 1.0, rotationY: 0, rotationX: 0, panX: 0, panY: 0 }
        },
        
        activePiP: null,
        isDragging: false,
        lastX: 0,
        lastY: 0,
        
        config: null,

        /**
         * Initialize PiP controls
         * @param {Object} config - Configuration object
         */
        init(config) {
            this.config = config || window.GreenhouseGeneticConfig;
            console.log('GeneticPiPControls: Initialized');
        },

        /**
         * Check if mouse is over a PiP
         * @param {number} mouseX - Mouse X coordinate
         * @param {number} mouseY - Mouse Y coordinate
         * @param {number} canvasWidth - Canvas width
         * @param {number} canvasHeight - Canvas height
         * @returns {string|null} PiP name or null
         */
        getPiPAtPosition(mouseX, mouseY, canvasWidth, canvasHeight) {
            const pipConfig = this.config.get('pip');
            const pipW = pipConfig.width;
            const pipH = pipConfig.height;
            const gap = pipConfig.gap;
            const pipX = canvasWidth - pipW - gap;

            // Check each PiP (top to bottom)
            const pips = [
                { name: 'micro', y: gap },
                { name: 'protein', y: gap + pipH + gap },
                { name: 'target', y: gap + pipH + gap + pipH + gap }
            ];

            for (const pip of pips) {
                if (mouseX >= pipX && mouseX <= pipX + pipW &&
                    mouseY >= pip.y && mouseY <= pip.y + pipH) {
                    return pip.name;
                }
            }

            return null;
        },

        /**
         * Handle mouse down on PiP
         * @param {Event} e - Mouse event
         * @param {HTMLCanvasElement} canvas - Canvas element
         */
        handleMouseDown(e, canvas) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            this.activePiP = this.getPiPAtPosition(mouseX, mouseY, canvas.width, canvas.height);
            
            if (this.activePiP) {
                this.isDragging = true;
                this.lastX = e.clientX;
                this.lastY = e.clientY;
                e.stopPropagation(); // Prevent main canvas controls
            }
        },

        /**
         * Handle mouse move on PiP
         * @param {Event} e - Mouse event
         */
        handleMouseMove(e) {
            if (!this.isDragging || !this.activePiP) return;

            const dx = e.clientX - this.lastX;
            const dy = e.clientY - this.lastY;

            const state = this.pipStates[this.activePiP];
            
            if (e.shiftKey) {
                // Pan
                state.panX += dx * 0.5;
                state.panY += dy * 0.5;
            } else {
                // Rotate
                state.rotationY += dx * 0.01;
                state.rotationX += dy * 0.01;
                
                // Clamp X rotation
                state.rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, state.rotationX));
            }

            this.lastX = e.clientX;
            this.lastY = e.clientY;
        },

        /**
         * Handle mouse up
         */
        handleMouseUp() {
            this.isDragging = false;
            this.activePiP = null;
        },

        /**
         * Handle mouse wheel on PiP
         * @param {Event} e - Wheel event
         * @param {HTMLCanvasElement} canvas - Canvas element
         */
        handleWheel(e, canvas) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const pipName = this.getPiPAtPosition(mouseX, mouseY, canvas.width, canvas.height);
            
            if (pipName) {
                e.preventDefault();
                e.stopPropagation();
                
                const state = this.pipStates[pipName];
                const zoomDelta = e.deltaY * -0.001;
                state.zoom = Math.max(0.5, Math.min(3.0, state.zoom + zoomDelta));
            }
        },

        /**
         * Reset a specific PiP
         * @param {string} pipName - Name of PiP to reset
         */
        resetPiP(pipName) {
            if (this.pipStates[pipName]) {
                this.pipStates[pipName] = {
                    zoom: 1.0,
                    rotationY: 0,
                    rotationX: 0,
                    panX: 0,
                    panY: 0
                };
            }
        },

        /**
         * Reset all PiPs
         */
        resetAll() {
            Object.keys(this.pipStates).forEach(name => this.resetPiP(name));
        },

        /**
         * Get state for a specific PiP
         * @param {string} pipName - Name of PiP
         * @returns {Object} PiP state
         */
        getState(pipName) {
            return this.pipStates[pipName] || {
                zoom: 1.0,
                rotationY: 0,
                rotationX: 0,
                panX: 0,
                panY: 0
            };
        },

        /**
         * Draw control buttons for a PiP
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {number} x - PiP X position
         * @param {number} y - PiP Y position
         * @param {number} w - PiP width
         * @param {number} h - PiP height
         * @param {string} pipName - Name of PiP
         */
        drawControls(ctx, x, y, w, h, pipName) {
            const state = this.getState(pipName);
            
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

            // Zoom indicator
            iconY += iconSize + iconGap;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(iconX, iconY, iconSize, iconSize);
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.fillText(state.zoom.toFixed(1), iconX + iconSize / 2, iconY + iconSize / 2);

            // Instructions (bottom of PiP)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x, y + h - 30, w, 30);
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('Drag: Rotate | Shift+Drag: Pan | Wheel: Zoom', x + 5, y + h - 25);
        },

        /**
         * Check if click is on reset button
         * @param {number} mouseX - Mouse X
         * @param {number} mouseY - Mouse Y
         * @param {number} canvasWidth - Canvas width
         * @param {number} canvasHeight - Canvas height
         * @returns {string|null} PiP name if reset button clicked
         */
        checkResetButton(mouseX, mouseY, canvasWidth, canvasHeight) {
            const pipConfig = this.config.get('pip');
            const pipW = pipConfig.width;
            const pipH = pipConfig.height;
            const gap = pipConfig.gap;
            const pipX = canvasWidth - pipW - gap;

            const iconSize = 16;
            const iconGap = 4;
            const iconX = pipX + pipW - iconSize - iconGap;

            const pips = [
                { name: 'micro', y: gap },
                { name: 'protein', y: gap + pipH + gap },
                { name: 'target', y: gap + pipH + gap + pipH + gap }
            ];

            for (const pip of pips) {
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
