(function () {
'use strict';
/**
 * @file neuro_synapse_camera_controls.ts
 * @description Camera Controls for Synapse View (Zoom, Pan, Rotate) in Neuro simulation.
 */
/// <reference path="../types/globals.d.ts" />
class NeuroSynapseCameraController {
    constructor(initialCamera, config) {
        this.isDragging = false;
        this.isPanning = false;
        this.lastX = 0;
        this.lastY = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.autoRotate = true;
        this.autoRotateSpeed = 0.0003;
        this.camera = initialCamera || {
            x: 0, y: 0, z: -200,
            rotationX: 0.2,
            rotationY: 0,
            rotationZ: 0,
            fov: 400
        };
        // Ensure rotations are initialized
        if (this.camera.rotationX === undefined)
            this.camera.rotationX = 0;
        if (this.camera.rotationY === undefined)
            this.camera.rotationY = 0;
        if (this.camera.rotationZ === undefined)
            this.camera.rotationZ = 0;
        this.config = config || window.GreenhouseNeuroConfig;
    }
    /**
     * Handle mouse down event
     * @param e - Mouse event
     * @param canvas - Canvas element
     * @param pipBounds - PiP bounds {x, y, w, h}
     */
    handleMouseDown(e, canvas, pipBounds) {
        if (!canvas)
            return false;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        // Check if mouse is within PiP bounds
        if (pipBounds && !this.isInBounds(mouseX, mouseY, pipBounds)) {
            return false;
        }
        if (e.button === 2 || e.shiftKey) {
            // Right click or Shift+Click for Pan
            this.isPanning = true;
            e.preventDefault();
        }
        else if (e.button === 0) {
            // Left click for Rotate
            this.isDragging = true;
        }
        this.lastX = mouseX;
        this.lastY = mouseY;
        this.autoRotate = false;
        this.velocityX = 0;
        this.velocityY = 0;
        return true;
    }
    /**
     * Handle mouse move event
     * @param e - Mouse event
     * @param canvas - Canvas element
     */
    handleMouseMove(e, canvas) {
        if (!canvas || (!this.isDragging && !this.isPanning))
            return false;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        const dx = mouseX - this.lastX;
        const dy = mouseY - this.lastY;
        if (this.isPanning) {
            this.pan(dx, dy);
        }
        else if (this.isDragging) {
            this.rotate(dx, dy);
        }
        this.lastX = mouseX;
        this.lastY = mouseY;
        return true;
    }
    /**
     * Handle mouse up event
     */
    handleMouseUp() {
        this.isDragging = false;
        this.isPanning = false;
    }
    /**
     * Handle wheel event for zooming
     * @param e - Wheel event
     * @param canvas - Canvas element
     * @param pipBounds - PiP bounds {x, y, w, h}
     */
    handleWheel(e, canvas, pipBounds) {
        if (!canvas)
            return false;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        // Check if mouse is within PiP bounds
        if (pipBounds && !this.isInBounds(mouseX, mouseY, pipBounds)) {
            return false;
        }
        e.preventDefault();
        const zoomSpeed = 0.1;
        const dynamicSpeed = Math.abs(this.camera.z) * 0.001 + 5;
        this.zoom(e.deltaY * zoomSpeed * dynamicSpeed);
        return true;
    }
    /**
     * Check if point is within bounds
     * @param x - X coordinate
     * @param y - Y coordinate
     * @param bounds - Bounds {x, y, w, h}
     * @returns True if within bounds
     */
    isInBounds(x, y, bounds) {
        if (!bounds)
            return false;
        return x >= bounds.x && x <= bounds.x + bounds.w &&
            y >= bounds.y && y <= bounds.y + bounds.h;
    }
    /**
     * Rotate camera
     * @param dx - Delta X
     * @param dy - Delta Y
     */
    rotate(dx, dy) {
        const rotateSpeed = 0.005;
        this.camera.rotationY = (this.camera.rotationY || 0) + dx * rotateSpeed;
        this.camera.rotationX = (this.camera.rotationX || 0) + dy * rotateSpeed;
        // Store velocity for inertia
        this.velocityX = dx * rotateSpeed;
        this.velocityY = dy * rotateSpeed;
        // Clamp X rotation to prevent flipping
        this.camera.rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotationX));
    }
    /**
     * Pan camera
     * @param dx - Delta X
     * @param dy - Delta Y
     */
    pan(dx, dy) {
        const panSpeed = 0.5;
        this.camera.x -= dx * panSpeed;
        this.camera.y -= dy * panSpeed;
    }
    /**
     * Zoom camera
     * @param delta - Zoom delta
     */
    zoom(delta) {
        this.camera.z += delta;
        // Clamp zoom - Allow closer zoom for detailed viewing
        const minZoom = -20;
        const maxZoom = -500;
        this.camera.z = Math.max(maxZoom, Math.min(minZoom, this.camera.z));
    }
    /**
     * Reset camera to initial position
     */
    reset() {
        this.camera.x = 0;
        this.camera.y = 0;
        this.camera.z = -200;
        this.camera.rotationX = 0.2;
        this.camera.rotationY = 0;
        this.camera.rotationZ = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.autoRotate = true;
    }
    /**
     * Update camera (apply inertia, auto-rotate)
     */
    update() {
        // Apply inertia
        if (!this.isDragging && !this.isPanning) {
            const damping = 0.95;
            this.camera.rotationY = (this.camera.rotationY || 0) + this.velocityX;
            this.camera.rotationX = (this.camera.rotationX || 0) + this.velocityY;
            this.velocityX *= damping;
            this.velocityY *= damping;
            // Stop if very slow
            if (Math.abs(this.velocityX) < 0.0001)
                this.velocityX = 0;
            if (Math.abs(this.velocityY) < 0.0001)
                this.velocityY = 0;
        }
        // Auto-rotate
        if (this.autoRotate && !this.isDragging && !this.isPanning) {
            this.camera.rotationY = (this.camera.rotationY || 0) + this.autoRotateSpeed;
        }
    }
    /**
     * Get camera object
     * @returns Camera object
     */
    getCamera() {
        return this.camera;
    }
}
window.NeuroSynapseCameraController = NeuroSynapseCameraController;

})();
