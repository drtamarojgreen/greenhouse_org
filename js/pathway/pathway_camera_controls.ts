// docs/js/pathway_camera_controls.js
// Decoupled Camera Controls for Pathway

(function () {
    'use strict';

    const GreenhousePathwayCameraControls = {
        camera: null,
        canvas: null,
        config: null,

        isDragging: false,
        isPanning: false,
        lastX: 0,
        lastY: 0,
        velocityX: 0,
        velocityY: 0,
        touches: [],
        lastTouchDistance: 0,
        keys: {},

        init(canvas, camera, config) {
            this.canvas = canvas;
            this.camera = camera;
            this.config = config;

            this.setupMouseControls();
            this.setupTouchControls();
            this.setupKeyboardControls();
            this.setupWheelControls();

            console.log('PathwayCamera: Controls initialized');
        },

        setupMouseControls() {
            this.canvas.addEventListener('mousedown', (e) => {
                if (e.button === 2 || e.shiftKey) {
                    if (this.config.get('camera.controls.enablePan')) {
                        this.isPanning = true;
                        e.preventDefault();
                    }
                } else if (e.button === 0) {
                    if (this.config.get('camera.controls.enableRotate')) {
                        this.isDragging = true;
                    }
                }

                this.lastX = e.clientX;
                this.lastY = e.clientY;
                this.stopAutoRotate();
                this.velocityX = 0;
                this.velocityY = 0;
            });

            this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

            window.addEventListener('mousemove', (e) => {
                if (!this.isDragging && !this.isPanning) return;
                const dx = e.clientX - this.lastX;
                const dy = e.clientY - this.lastY;
                if (this.isPanning) this.pan(dx, dy);
                else if (this.isDragging) this.rotate(dx, dy);
                this.lastX = e.clientX;
                this.lastY = e.clientY;
            });

            window.addEventListener('mouseup', () => {
                this.isDragging = false;
                this.isPanning = false;
            });
        },

        setupTouchControls() {
            this.canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touches = Array.from(e.touches);
                if (this.touches.length === 1) {
                    this.isDragging = true;
                    this.lastX = this.touches[0].clientX;
                    this.lastY = this.touches[0].clientY;
                } else if (this.touches.length === 2) {
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
                    const dx = newTouches[0].clientX - this.lastX;
                    const dy = newTouches[0].clientY - this.lastY;
                    this.rotate(dx, dy);
                    this.lastX = newTouches[0].clientX;
                    this.lastY = newTouches[0].clientY;
                } else if (newTouches.length === 2) {
                    const dx = newTouches[1].clientX - newTouches[0].clientX;
                    const dy = newTouches[1].clientY - newTouches[0].clientY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (this.lastTouchDistance > 0) {
                        const delta = distance - this.lastTouchDistance;
                        this.zoom(-delta * 2);
                    }
                    this.lastTouchDistance = distance;
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
                this.isDragging = false;
                this.isPanning = false;
                this.lastTouchDistance = 0;
            });
        },

        setupKeyboardControls() {
            window.addEventListener('keydown', (e) => {
                this.keys[e.key] = true;
                if (e.key.startsWith('Arrow')) this.stopAutoRotate();

                if (e.key === 'ArrowLeft') this.rotate(-5, 0);
                else if (e.key === 'ArrowRight') this.rotate(5, 0);
                else if (e.key === 'ArrowUp') this.rotate(0, -5);
                else if (e.key === 'ArrowDown') this.rotate(0, 5);
            });
            window.addEventListener('keyup', (e) => { this.keys[e.key] = false; });
        },

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

        rotate(dx, dy) {
            const rotateSpeed = this.config.get('camera.controls.rotateSpeed') || 0.005;
            this.camera.rotationY += dx * rotateSpeed;
            this.camera.rotationX += dy * rotateSpeed;
            if (this.config.get('camera.controls.inertia')) {
                this.velocityX = dx * rotateSpeed;
                this.velocityY = dy * rotateSpeed;
            }
            this.camera.rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotationX));
        },

        pan(dx, dy) {
            const panSpeed = this.config.get('camera.controls.panSpeed') || 0.002;
            const panScale = Math.abs(this.camera.z) * panSpeed;
            this.camera.x -= dx * panScale;
            this.camera.y -= dy * panScale;
        },

        zoom(delta) {
            this.camera.z += delta;
            const minZoom = this.config.get('camera.controls.minZoom') || -50;
            const maxZoom = this.config.get('camera.controls.maxZoom') || -2000;
            this.camera.z = Math.max(maxZoom, Math.min(minZoom, this.camera.z));
        },

        update() {
            if (this.config.get('camera.controls.inertia') && !this.isDragging) {
                const damping = this.config.get('camera.controls.inertiaDamping') || 0.95;
                this.camera.rotationY += this.velocityX;
                this.camera.rotationX += this.velocityY;
                this.velocityX *= damping;
                this.velocityY *= damping;
            }
            if (this.config.get('camera.controls.autoRotate') && !this.isDragging && !this.isPanning) {
                this.camera.rotationY += this.config.get('camera.controls.autoRotateSpeed') || 0.0002;
            }
        },

        stopAutoRotate() {
            this.config.set('camera.controls.autoRotate', false);
        }
    };

    window.GreenhousePathwayCameraControls = GreenhousePathwayCameraControls;
})();
