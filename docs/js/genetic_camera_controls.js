// docs/js/genetic_camera_controls.js
// Enhanced Camera Controls for Genetic Simulation
// Refactored to Class for multiple instances (Main View + PiPs)

(function () {
    'use strict';

    class GeneticCameraController {
        constructor(camera, config) {
            this.camera = camera;
            this.config = config || window.GreenhouseGeneticConfig;

            // State
            this.isDragging = false;
            this.isPanning = false;
            this.lastX = 0;
            this.lastY = 0;
            this.velocityX = 0;
            this.velocityY = 0;

            // Touch state
            this.touches = [];
            this.lastTouchDistance = 0;

            // Keyboard state (moved from global to instance)
            this.keys = {};

            // Transition State
            this.isTransitioning = false;
            this.transitionStart = 0;
            this.transitionDuration = 0;
            this.startState = null;
            this.targetState = null;
            this.transitionCallback = null;

            // Auto Rotate State
            this.autoRotate = true; // Default to true, can be overridden
        }

        /**
         * Handle Mouse Down
         */
        handleMouseDown(e) {
            if (e.button === 2 || e.shiftKey) {
                // Right click or Shift+Click for Pan
                if (this.config.get('camera.controls.enablePan')) {
                    this.isPanning = true;
                }
            } else if (e.button === 0) {
                // Left click for Rotate
                if (this.config.get('camera.controls.enableRotate')) {
                    this.isDragging = true;
                }
            }

            this.lastX = e.clientX;
            this.lastY = e.clientY;
            this.stopAutoRotate();
            this.velocityX = 0;
            this.velocityY = 0;

            return true; // Consumed
        }

        /**
         * Handle Mouse Move
         */
        handleMouseMove(e) {
            if (!this.isDragging && !this.isPanning) return false;

            const dx = e.clientX - this.lastX;
            const dy = e.clientY - this.lastY;

            if (this.isPanning) {
                this.pan(dx, dy);
            } else if (this.isDragging) {
                this.rotate(dx, dy);
            }

            this.lastX = e.clientX;
            this.lastY = e.clientY;
            return true;
        }

        /**
         * Handle Mouse Up
         */
        handleMouseUp() {
            this.isDragging = false;
            this.isPanning = false;
        }

        /**
         * Handle Touch Start
         */
        handleTouchStart(e) {
            this.touches = Array.from(e.touches);

            if (this.touches.length === 1) {
                // Single touch - rotate
                this.isDragging = true;
                this.lastX = this.touches[0].clientX;
                this.lastY = this.touches[0].clientY;
            } else if (this.touches.length === 2) {
                // Two finger - pan and zoom
                this.isPanning = true;
                const dx = this.touches[1].clientX - this.touches[0].clientX;
                const dy = this.touches[1].clientY - this.touches[0].clientY;
                this.lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
            }

            this.stopAutoRotate();
            return true;
        }

        /**
         * Handle Touch Move
         */
        handleTouchMove(e) {
            const newTouches = Array.from(e.touches);

            if (newTouches.length === 1 && this.isDragging) {
                // Rotate
                const dx = newTouches[0].clientX - this.lastX;
                const dy = newTouches[0].clientY - this.lastY;
                this.rotate(dx, dy);
                this.lastX = newTouches[0].clientX;
                this.lastY = newTouches[0].clientY;
            } else if (newTouches.length === 2) {
                // Pinch zoom
                const dx = newTouches[1].clientX - newTouches[0].clientX;
                const dy = newTouches[1].clientY - newTouches[0].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (this.lastTouchDistance > 0) {
                    const delta = distance - this.lastTouchDistance;
                    this.zoom(-delta * 2);
                }

                this.lastTouchDistance = distance;

                // Pan with center point
                const centerX = (newTouches[0].clientX + newTouches[1].clientX) / 2;
                const centerY = (newTouches[0].clientY + newTouches[1].clientY) / 2;

                if (this.touches.length === 2) {
                    const oldCenterX = (this.touches[0].clientX + this.touches[1].clientX) / 2;
                    const oldCenterY = (this.touches[0].clientY + this.touches[1].clientY) / 2;
                    this.pan(centerX - oldCenterX, centerY - oldCenterY);
                }
            }

            this.touches = newTouches;
            return true;
        }

        /**
         * Handle Touch End
         */
        handleTouchEnd(e) {
            this.touches = Array.from(e.touches);

            if (this.touches.length === 0) {
                this.isDragging = false;
                this.isPanning = false;
                this.lastTouchDistance = 0;
            }
            return true;
        }

        /**
         * Handle Keyboard Down
         */
        handleKeyDown(e) {
            this.keys[e.key] = true;

            // Arrow keys for rotation
            if (e.key === 'ArrowLeft') {
                this.rotate(-5, 0);
                this.stopAutoRotate();
            } else if (e.key === 'ArrowRight') {
                this.rotate(5, 0);
                this.stopAutoRotate();
            } else if (e.key === 'ArrowUp') {
                this.rotate(0, -5);
                this.stopAutoRotate();
            } else if (e.key === 'ArrowDown') {
                this.rotate(0, 5);
                this.stopAutoRotate();
            }

            // WASD for panning
            const panAmount = 20;
            if (e.key === 'w' || e.key === 'W') {
                this.pan(0, panAmount);
            } else if (e.key === 's' || e.key === 'S') {
                this.pan(0, -panAmount);
            } else if (e.key === 'a' || e.key === 'A') {
                this.pan(panAmount, 0);
            } else if (e.key === 'd' || e.key === 'D') {
                this.pan(-panAmount, 0);
            }

            // Q/E for zoom
            if (e.key === 'q' || e.key === 'Q') {
                this.zoom(50);
            } else if (e.key === 'e' || e.key === 'E') {
                this.zoom(-50);
            }

            // R to reset camera
            if (e.key === 'r' || e.key === 'R') {
                this.resetCamera();
            }

            // Space to toggle auto-rotate
            if (e.key === ' ') {
                this.toggleAutoRotate();
                return true; // Prevent default spacebar action (scrolling)
            }
            return false;
        }

        /**
         * Handle Keyboard Up
         */
        handleKeyUp(e) {
            this.keys[e.key] = false;
        }

        /**
         * Handle Wheel
         */
        handleWheel(e) {
            if (this.config.get('camera.controls.enableZoom')) {
                const zoomSpeed = this.config.get('camera.controls.zoomSpeed') || 0.1;
                // Dynamic speed based on depth
                const dynamicSpeed = Math.abs(this.camera.z) * 0.001 + 5;
                this.zoom(e.deltaY * zoomSpeed * dynamicSpeed);
                return true;
            }
            return false;
        }

        /**
         * Rotate camera
         */
        rotate(dx, dy) {
            const rotateSpeed = this.config.get('camera.controls.rotateSpeed') || 0.005;

            this.camera.rotationY += dx * rotateSpeed;
            this.camera.rotationX += dy * rotateSpeed;

            // Store velocity for inertia
            if (this.config.get('camera.controls.inertia')) {
                this.velocityX = dx * rotateSpeed;
                this.velocityY = dy * rotateSpeed;
            }

            // Clamp X rotation
            this.camera.rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotationX));
        }

        /**
         * Pan camera
         */
        pan(dx, dy) {
            const panSpeed = this.config.get('camera.controls.panSpeed') || 0.002;
            const panScale = Math.abs(this.camera.z) * panSpeed;

            this.camera.x -= dx * panScale;
            this.camera.y -= dy * panScale;
        }

        /**
         * Zoom camera
         */
        zoom(delta) {
            this.camera.z += delta;

            // Clamp zoom
            const minZoom = this.config.get('camera.controls.minZoom') || -50;
            const maxZoom = this.config.get('camera.controls.maxZoom') || -3000;

            this.camera.z = Math.max(maxZoom, Math.min(minZoom, this.camera.z));
        }

        /**
         * Reset camera to initial position
         */
        resetCamera() {
            const initial = this.config.get('camera.initial');
            if (initial) {
                this.camera.x = initial.x;
                this.camera.y = initial.y;
                this.camera.z = initial.z;
                this.camera.rotationX = initial.rotationX;
                this.camera.rotationY = initial.rotationY;
                this.camera.rotationZ = initial.rotationZ;
            }

            this.velocityX = 0;
            this.velocityY = 0;
            this.autoRotate = true; // Re-enable auto-rotate on reset

            console.log('GeneticCamera: Reset to initial position');
        }

        /**
         * Fly camera to target
         */
        flyTo(target, duration = 1000, callback = null) {
            this.isTransitioning = true;
            this.transitionStart = Date.now();
            this.transitionDuration = duration;
            this.transitionCallback = callback;

            this.startState = {
                x: this.camera.x,
                y: this.camera.y,
                z: this.camera.z,
                rotationX: this.camera.rotationX,
                rotationY: this.camera.rotationY,
                rotationZ: this.camera.rotationZ
            };
            this.targetState = {
                x: target.x !== undefined ? target.x : this.camera.x,
                y: target.y !== undefined ? target.y : this.camera.y,
                z: target.z !== undefined ? target.z : this.camera.z,
                rotationX: target.rotationX !== undefined ? target.rotationX : this.camera.rotationX,
                rotationY: target.rotationY !== undefined ? target.rotationY : this.camera.rotationY,
                rotationZ: target.rotationZ !== undefined ? target.rotationZ : this.camera.rotationZ
            };

            this.velocityX = 0;
            this.velocityY = 0;
            this.isDragging = false;
            this.isPanning = false;
            this.stopAutoRotate();
        }

        /**
         * Update loop (Inertia, Auto-Rotate, Transitions)
         */
        update() {
            // Handle Transition
            if (this.isTransitioning) {
                const now = Date.now();
                const progress = Math.min(1.0, (now - this.transitionStart) / this.transitionDuration);

                // Ease In Out Cubic
                const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                this.camera.x = this.startState.x + (this.targetState.x - this.startState.x) * ease;
                this.camera.y = this.startState.y + (this.targetState.y - this.startState.y) * ease;
                this.camera.z = this.startState.z + (this.targetState.z - this.startState.z) * ease;
                this.camera.rotationX = this.startState.rotationX + (this.targetState.rotationX - this.startState.rotationX) * ease;
                this.camera.rotationY = this.startState.rotationY + (this.targetState.rotationY - this.startState.rotationY) * ease;
                this.camera.rotationZ = this.startState.rotationZ + (this.targetState.rotationZ - this.startState.rotationZ) * ease;

                if (progress >= 1.0) {
                    this.isTransitioning = false;
                    if (this.transitionCallback) this.transitionCallback();
                }
                return;
            }

            // Apply inertia
            if (this.config.get('camera.controls.inertia') && !this.isDragging) {
                const damping = this.config.get('camera.controls.inertiaDamping') || 0.95;

                this.camera.rotationY += this.velocityX;
                this.camera.rotationX += this.velocityY;

                this.velocityX *= damping;
                this.velocityY *= damping;

                if (Math.abs(this.velocityX) < 0.0001) this.velocityX = 0;
                if (Math.abs(this.velocityY) < 0.0001) this.velocityY = 0;
            }

            // Auto-rotate
            if (this.autoRotate && this.config.get('camera.controls.autoRotate') && !this.isDragging && !this.isPanning) {
                const speed = this.config.get('camera.controls.autoRotateSpeed') || 0.0002;
                const oldRotY = this.camera.rotationY;
                this.camera.rotationY += speed;
                
                // Log auto-rotate animation every 60 frames (~1 second at 60fps)
                if (!this._autoRotateFrameCount) this._autoRotateFrameCount = 0;
                this._autoRotateFrameCount++;
                
                if (this._autoRotateFrameCount % 60 === 0) {
                    console.log('[Camera Animation] Auto-rotate:', {
                        rotationY: this.camera.rotationY.toFixed(3),
                        speed: speed,
                        autoRotate: this.autoRotate,
                        configAutoRotate: this.config.get('camera.controls.autoRotate'),
                        isDragging: this.isDragging,
                        isPanning: this.isPanning,
                        frame: this._autoRotateFrameCount
                    });
                }
            } else {
                // Log why auto-rotate is not running (only first time)
                if (!this._autoRotateDebugLogged) {
                    console.log('[Camera Debug] Auto-rotate NOT running:', {
                        autoRotate: this.autoRotate,
                        configAutoRotate: this.config.get('camera.controls.autoRotate'),
                        isDragging: this.isDragging,
                        isPanning: this.isPanning,
                        hasConfig: !!this.config
                    });
                    this._autoRotateDebugLogged = true;
                }
            }
        }

        /**
         * Stop auto-rotation
         */
        stopAutoRotate() {
            this.autoRotate = false;
        }

        /**
         * Toggle auto-rotation
         */
        toggleAutoRotate() {
            this.autoRotate = !this.autoRotate;
            console.log('GeneticCamera: Auto-rotate', this.autoRotate ? 'enabled' : 'disabled');
        }

        /**
         * Get camera info for debugging
         */
        getInfo() {
            return {
                position: { x: this.camera.x, y: this.camera.y, z: this.camera.z },
                rotation: {
                    x: this.camera.rotationX,
                    y: this.camera.rotationY,
                    z: this.camera.rotationZ
                },
                velocity: { x: this.velocityX, y: this.velocityY },
                isDragging: this.isDragging,
                isPanning: this.isPanning,
                isTransitioning: this.isTransitioning,
                autoRotate: this.autoRotate
            };
        }
    }

    // Export Class
    window.GreenhouseGeneticCameraController = GeneticCameraController;

    // Backward compatibility singleton (optional, but good for safety)
    window.GreenhouseGeneticCameraControls = {
        // This is a placeholder or we can instantiate one if needed immediately
        // But better to let the UI instantiate it.
    };
})();
