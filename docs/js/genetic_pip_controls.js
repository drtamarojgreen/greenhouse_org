// docs/js/genetic_pip_controls.js
// Individual Controls for Each Picture-in-Picture View
// Uses GeneticCameraController for physics-based controls

(function () {
    'use strict';

    const GreenhouseGeneticPiPControls = {
        controllers: {},
        cameras: {}, // Reference to cameras array from main UI3D

        activePiP: null,
        config: null,

        /**
         * Initialize PiP controls
         * @param {Object} config - Configuration object
         * @param {Array} camerasArray - Array of 5 cameras from main UI3D
         */
        init(config, camerasArray) {
            this.config = config || window.GreenhouseGeneticConfig;

            if (!camerasArray || camerasArray.length !== 5) {
                console.error('[PiP Controls] Invalid cameras array! Expected 5 cameras.');
                return;
            }

            // Map PiP names to camera indices
            // cameras[0] = main, cameras[1] = helix, cameras[2] = micro, cameras[3] = protein, cameras[4] = target
            const cameraMap = {
                helix: 1,
                micro: 2,
                protein: 3,
                target: 4
            };

            // Reference cameras from the array (no copying)
            Object.keys(cameraMap).forEach(name => {
                const index = cameraMap[name];
                this.cameras[name] = camerasArray[index];

                // Create Controller for this camera
                if (window.GreenhouseGeneticCameraController) {
                    this.controllers[name] = new window.GreenhouseGeneticCameraController(
                        this.cameras[name],
                        this.config
                    );
                }
            });

            console.log('[PiP Controls] Initialized with cameras array:', {
                helix: this.cameras.helix,
                micro: this.cameras.micro,
                protein: this.cameras.protein,
                target: this.cameras.target
            });
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

            const newPiP = this.getPiPAtPosition(mouseX, mouseY, canvas.width, canvas.height);
            
            // Clear activePiP if clicking outside any PiP
            if (!newPiP && this.activePiP) {
                console.log(`[PiP Controls] Clearing activePiP - clicked outside PiPs`);
                this.activePiP = null;
            }
            
            this.activePiP = newPiP;

            if (this.activePiP && this.controllers[this.activePiP]) {
                console.log(`[PiP Controls] Mouse down on ${this.activePiP} PiP at (${mouseX.toFixed(0)}, ${mouseY.toFixed(0)})`);
                console.log(`[PiP Controls] ${this.activePiP} camera before:`, {
                    x: this.cameras[this.activePiP].x.toFixed(2),
                    y: this.cameras[this.activePiP].y.toFixed(2),
                    z: this.cameras[this.activePiP].z.toFixed(2),
                    rotationX: this.cameras[this.activePiP].rotationX.toFixed(3),
                    rotationY: this.cameras[this.activePiP].rotationY.toFixed(3)
                });
                
                // Delegate to controller
                this.controllers[this.activePiP].handleMouseDown(e);
                e.stopPropagation(); // Prevent main canvas controls
            }
        },

        /**
         * Handle mouse move on PiP
         */
        handleMouseMove(e) {
            if (this.activePiP && this.controllers[this.activePiP]) {
                const cam = this.cameras[this.activePiP];
                const beforeRotX = cam.rotationX;
                const beforeRotY = cam.rotationY;
                const beforeX = cam.x;
                const beforeY = cam.y;
                
                this.controllers[this.activePiP].handleMouseMove(e);
                
                // Log changes
                const deltaRotX = cam.rotationX - beforeRotX;
                const deltaRotY = cam.rotationY - beforeRotY;
                const deltaX = cam.x - beforeX;
                const deltaY = cam.y - beforeY;
                
                if (Math.abs(deltaRotX) > 0.001 || Math.abs(deltaRotY) > 0.001) {
                    console.log(`[PiP Controls] ${this.activePiP} rotation changed:`, {
                        deltaRotX: deltaRotX.toFixed(4),
                        deltaRotY: deltaRotY.toFixed(4),
                        newRotX: cam.rotationX.toFixed(3),
                        newRotY: cam.rotationY.toFixed(3)
                    });
                }
                
                if (Math.abs(deltaX) > 0.01 || Math.abs(deltaY) > 0.01) {
                    console.log(`[PiP Controls] ${this.activePiP} position changed:`, {
                        deltaX: deltaX.toFixed(2),
                        deltaY: deltaY.toFixed(2),
                        newX: cam.x.toFixed(2),
                        newY: cam.y.toFixed(2)
                    });
                }
            }
        },

        /**
         * Handle mouse up
         */
        handleMouseUp() {
            if (this.activePiP && this.controllers[this.activePiP]) {
                console.log(`[PiP Controls] Mouse up on ${this.activePiP} PiP`);
                console.log(`[PiP Controls] ${this.activePiP} camera after:`, {
                    x: this.cameras[this.activePiP].x.toFixed(2),
                    y: this.cameras[this.activePiP].y.toFixed(2),
                    z: this.cameras[this.activePiP].z.toFixed(2),
                    rotationX: this.cameras[this.activePiP].rotationX.toFixed(3),
                    rotationY: this.cameras[this.activePiP].rotationY.toFixed(3)
                });
                
                this.controllers[this.activePiP].handleMouseUp();
                
                // Don't clear activePiP here - it will be cleared on next mousedown
                // This ensures the controller's isDragging flag is the source of truth
                console.log(`[PiP Controls] Keeping activePiP set for next interaction`);
            }
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
                const beforeZ = this.cameras[pipName].z;
                
                e.preventDefault();
                e.stopPropagation();
                this.controllers[pipName].handleWheel(e);
                
                const afterZ = this.cameras[pipName].z;
                const deltaZ = afterZ - beforeZ;
                
                console.log(`[PiP Controls] ${pipName} zoom changed:`, {
                    deltaY: e.deltaY,
                    deltaZ: deltaZ.toFixed(2),
                    beforeZ: beforeZ.toFixed(2),
                    afterZ: afterZ.toFixed(2),
                    zoomLevel: (Math.abs(afterZ) / 200).toFixed(2)
                });
            }
        },

        /**
         * Reset a specific PiP
         */
        resetPiP(pipName) {
            if (this.controllers[pipName]) {
                console.log(`[PiP Controls] Resetting ${pipName} PiP camera`);
                console.log(`[PiP Controls] ${pipName} before reset:`, {
                    x: this.cameras[pipName].x.toFixed(2),
                    y: this.cameras[pipName].y.toFixed(2),
                    z: this.cameras[pipName].z.toFixed(2),
                    rotationX: this.cameras[pipName].rotationX.toFixed(3),
                    rotationY: this.cameras[pipName].rotationY.toFixed(3)
                });
                
                this.controllers[pipName].resetCamera();
                
                console.log(`[PiP Controls] ${pipName} after reset:`, {
                    x: this.cameras[pipName].x.toFixed(2),
                    y: this.cameras[pipName].y.toFixed(2),
                    z: this.cameras[pipName].z.toFixed(2),
                    rotationX: this.cameras[pipName].rotationX.toFixed(3),
                    rotationY: this.cameras[pipName].rotationY.toFixed(3)
                });
            }
        },

        /**
         * Get state for a specific PiP (Camera Object)
         */
        getState(pipName) {
            const cam = this.cameras[pipName];
            if (!cam) {
                console.error(`[PiP Controls] getState called for ${pipName} but camera not found!`);
                console.error('[PiP Controls] Available cameras:', Object.keys(this.cameras));
                return { zoom: 1.0, rotationY: 0, rotationX: 0, panX: 0, panY: 0, camera: null };
            }

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
            // Update each PiP controller and log animations
            Object.keys(this.controllers).forEach(pipName => {
                const ctrl = this.controllers[pipName];
                const cam = this.cameras[pipName];
                
                // Store previous rotation for animation detection
                if (!cam._prevRotationY) cam._prevRotationY = cam.rotationY;
                const prevRotY = cam._prevRotationY;
                
                // Update controller (applies auto-rotate, inertia, etc.)
                ctrl.update();
                
                // Check if rotation changed (animation occurred)
                const rotationChanged = Math.abs(cam.rotationY - prevRotY) > 0.0001;
                
                if (rotationChanged) {
                    // Log animation every 60 frames (~1 second at 60fps)
                    if (!cam._animFrameCount) cam._animFrameCount = 0;
                    cam._animFrameCount++;
                    
                    if (cam._animFrameCount % 60 === 0) {
                        console.log(`[PiP Animation] ${pipName}:`, {
                            rotationY: cam.rotationY.toFixed(3),
                            delta: (cam.rotationY - prevRotY).toFixed(6),
                            autoRotate: ctrl.autoRotate,
                            frame: cam._animFrameCount
                        });
                    }
                }
                
                // Update previous rotation
                cam._prevRotationY = cam.rotationY;
            });
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
