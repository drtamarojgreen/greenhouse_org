/**
 * @file rna_display.js
 * @description Zoom and scroll (pan) controls for the RNA repair simulation.
 */

(function() {
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

        console.log('RNA Display controls attached.');
    }

    window.Greenhouse = window.Greenhouse || {};
    window.Greenhouse.initializeRNADisplay = initializeRNADisplay;

})();
