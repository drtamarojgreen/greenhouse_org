// docs/js/genetic_camera_controls.js
// Enhanced Camera Controls for Genetic Simulation (adapted from neuro_camera_controls.js)

(function () {
    'use strict';

    const GreenhouseGeneticCameraControls = {
        camera: null,
        canvas: null,
        config: null,
        
        // State
        isDragging: false,
        isPanning: false,
        lastX: 0,
        lastY: 0,
        velocityX: 0,
        velocityY: 0,
        
        // Touch support
        touches: [],
        lastTouchDistance: 0,
        
        // Keyboard state
        keys: {},

        /**
         * Initialize camera controls
         * @param {HTMLCanvasElement} canvas - Canvas element
         * @param {Object} camera - Camera object to control
         * @param {Object} config - Configuration object
         */
        init(canvas, camera, config) {
            this.canvas = canvas;
            this.camera = camera;
            this.config = config || window.GreenhouseGeneticConfig;
            
            this.setupMouseControls();
            this.setupTouchControls();
            this.setupKeyboardControls();
            this.setupWheelControls();
            
            console.log('GeneticCamera: Controls initialized');
        },

        /**
         * Setup mouse controls for rotation and panning
         */
        setupMouseControls() {
            this.canvas.addEventListener('mousedown', (e) => {
                if (e.button === 2 || e.shiftKey) {
                    // Right click or Shift+Click for Pan
                    if (this.config.get('camera.controls.enablePan')) {
                        this.isPanning = true;
                        e.preventDefault();
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
                
                this.canvas.style.cursor = 'grabbing';
            });

            this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

            window.addEventListener('mousemove', (e) => {
                if (!this.isDragging && !this.isPanning) return;

                const dx = e.clientX - this.lastX;
                const dy = e.clientY - this.lastY;

                if (this.isPanning) {
                    this.pan(dx, dy);
                } else if (this.isDragging) {
                    this.rotate(dx, dy);
                }

                this.lastX = e.clientX;
                this.lastY = e.clientY;
            });

            window.addEventListener('mouseup', () => {
                this.isDragging = false;
                this.isPanning = false;
                if (this.canvas) this.canvas.style.cursor = 'grab';
            });
        },

        /**
         * Setup touch controls for mobile devices
         */
        setupTouchControls() {
            this.canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
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
            });

            this.canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
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
            });

            this.canvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.touches = Array.from(e.touches);
                
                if (this.touches.length === 0) {
                    this.isDragging = false;
                    this.isPanning = false;
                    this.lastTouchDistance = 0;
                }
            });
        },

        /**
         * Setup keyboard controls
         */
        setupKeyboardControls() {
            window.addEventListener('keydown', (e) => {
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
                    e.preventDefault();
                }
            });

            window.addEventListener('keyup', (e) => {
                this.keys[e.key] = false;
            });
        },

        /**
         * Setup mouse wheel controls for zooming
         */
        setupWheelControls() {
            this.canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                
                if (this.config.get('camera.controls.enableZoom')) {
                    const zoomSpeed = this.config.get('camera.controls.zoomSpeed') || 0.1;
                    const dynamicSpeed = Math.abs(this.camera.z) * 0.001 + 5;
                    this.zoom(e.deltaY * zoomSpeed * dynamicSpeed);
                }
            }, { passive: false });
        },

        /**
         * Rotate camera
         * @param {number} dx - Delta X
         * @param {number} dy - Delta Y
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
            
            // Clamp X rotation to prevent flipping
            this.camera.rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotationX));
        },

        /**
         * Pan camera
         * @param {number} dx - Delta X
         * @param {number} dy - Delta Y
         */
        pan(dx, dy) {
            const panSpeed = this.config.get('camera.controls.panSpeed') || 0.002;
            const panScale = Math.abs(this.camera.z) * panSpeed;
            
            this.camera.x -= dx * panScale;
            this.camera.y -= dy * panScale;
        },

        /**
         * Zoom camera
         * @param {number} delta - Zoom delta
         */
        zoom(delta) {
            this.camera.z += delta;
            
            // Clamp zoom
            const minZoom = this.config.get('camera.controls.minZoom') || -50;
            const maxZoom = this.config.get('camera.controls.maxZoom') || -3000;
            
            this.camera.z = Math.max(maxZoom, Math.min(minZoom, this.camera.z));
        },

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
            
            console.log('GeneticCamera: Reset to initial position');
        },

        /**
         * Update camera (apply inertia, auto-rotate)
         */
        update() {
            // Apply inertia
            if (this.config.get('camera.controls.inertia') && !this.isDragging) {
                const damping = this.config.get('camera.controls.inertiaDamping') || 0.95;
                
                this.camera.rotationY += this.velocityX;
                this.camera.rotationX += this.velocityY;
                
                this.velocityX *= damping;
                this.velocityY *= damping;
                
                // Stop if very slow
                if (Math.abs(this.velocityX) < 0.0001) this.velocityX = 0;
                if (Math.abs(this.velocityY) < 0.0001) this.velocityY = 0;
            }
            
            // Auto-rotate
            if (this.config.get('camera.controls.autoRotate') && !this.isDragging && !this.isPanning) {
                const speed = this.config.get('camera.controls.autoRotateSpeed') || 0.0002;
                this.camera.rotationY += speed;
            }
        },

        /**
         * Stop auto-rotation
         */
        stopAutoRotate() {
            this.config.set('camera.controls.autoRotate', false);
        },

        /**
         * Toggle auto-rotation
         */
        toggleAutoRotate() {
            const current = this.config.get('camera.controls.autoRotate');
            this.config.set('camera.controls.autoRotate', !current);
            console.log('GeneticCamera: Auto-rotate', !current ? 'enabled' : 'disabled');
        },

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
                isPanning: this.isPanning
            };
        }
    };

    window.GreenhouseGeneticCameraControls = GreenhouseGeneticCameraControls;
})();
