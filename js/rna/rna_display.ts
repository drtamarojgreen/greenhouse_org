/**
 * @file rna_display.js
 * @description Zoom and scroll (pan) controls for the RNA repair simulation.
 */

(function () {
    'use strict';

    console.log("RNA Display controls script loaded.");

    /**
     * @function initializeRNADisplay
     * @description Attaches event listeners to the simulation canvas for zoom and pan.
     * @param {RNARepairSimulation} simulation
     */
    function initializeRNADisplay(simulation) {
        const canvas = simulation.canvas;
        let isDragging = false;
        let lastMouseX, lastMouseY;

        // Zoom with mouse wheel
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.001;
            const delta = -e.deltaY;
            const factor = Math.pow(1.1, delta / 100);

            const oldScale = simulation.scale;
            simulation.scale *= factor;

            // Limit scale
            simulation.scale = Math.max(0.2, Math.min(simulation.scale, 5));

            // Adjust offset to zoom towards mouse position
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            simulation.offsetX -= (mouseX - simulation.offsetX) * (simulation.scale / oldScale - 1);
            simulation.offsetY -= (mouseY - simulation.offsetY) * (simulation.scale / oldScale - 1);
        }, { passive: false });

        // Pan with mouse drag
        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            canvas.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const dx = e.clientX - lastMouseX;
            const dy = e.clientY - lastMouseY;

            simulation.offsetX += dx;
            simulation.offsetY += dy;

            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
            canvas.style.cursor = 'grab';
        });

        // Touch Support: Pan and Pinch Zoom
        let lastTouchDistance = 0;
        let lastTouchX, lastTouchY;

        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                isDragging = true;
                lastTouchX = e.touches[0].clientX;
                lastTouchY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                isDragging = false; // Stop panning when zooming
                const dx = e.touches[1].clientX - e.touches[0].clientX;
                const dy = e.touches[1].clientY - e.touches[0].clientY;
                lastTouchDistance = Math.hypot(dx, dy);
            }
        }, { passive: true });

        canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && isDragging) {
                const dx = e.touches[0].clientX - lastTouchX;
                const dy = e.touches[0].clientY - lastTouchY;
                simulation.offsetX += dx;
                simulation.offsetY += dy;
                lastTouchX = e.touches[0].clientX;
                lastTouchY = e.touches[0].clientY;
                e.preventDefault(); // Block page scroll when interacting with model
            } else if (e.touches.length === 2) {
                const dx = e.touches[1].clientX - e.touches[0].clientX;
                const dy = e.touches[1].clientY - e.touches[0].clientY;
                const distance = Math.hypot(dx, dy);
                if (lastTouchDistance > 0) {
                    const factor = distance / lastTouchDistance;
                    simulation.scale *= factor;
                    simulation.scale = Math.max(0.2, Math.min(simulation.scale, 5));
                }
                lastTouchDistance = distance;
                e.preventDefault();
            }
        }, { passive: false });

        canvas.addEventListener('touchend', () => {
            isDragging = false;
            lastTouchDistance = 0;
        });

        console.log('RNA Display controls attached.');
    }

    window.Greenhouse = window.Greenhouse || {};
    window.Greenhouse.initializeRNADisplay = initializeRNADisplay;

})();
