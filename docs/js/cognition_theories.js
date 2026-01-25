/**
 * @file cognition_theories.js
 * @description Modeling Theory mappings for the Cognition model.
 * Covers Enhancements 7-30.
 */

(function () {
    'use strict';

    const GreenhouseCognitionTheories = {
        init(app) {
            this.app = app;
            console.log('CognitionTheories: Initialized');
        },

        render(ctx) {
            const activeEnhancement = this.app.activeEnhancement;
            if (!activeEnhancement || activeEnhancement.category !== 'Theory') return;

            const w = this.app.canvas.width;
            const h = this.app.canvas.height;

            // Header
            ctx.fillStyle = '#4fd1c5';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(`THEORY MAPPING: ${activeEnhancement.name.toUpperCase()}`, 20, 70);

            ctx.font = '12px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Active Region: ${this.app.config.regions[activeEnhancement.region]?.name || activeEnhancement.region}`, 20, 90);

            // Specific logic for batches
            // 7-12: Executive/Memory
            if (activeEnhancement.id === 8) { // Working Memory Loops
                this.drawReciprocalLoop(ctx, w * 0.4, h * 0.4, w * 0.6, h * 0.4, '#4da6ff', 'PFC <-> Parietal');
            }
            if (activeEnhancement.id === 12) { // DMN
                this.drawNetwork(ctx, '#ff4d4d', 'Default Mode Network Active (Rest State)');
            }

            // 13-20: Specialized Circuits
            if (activeEnhancement.id === 13) { // Mirror Neurons
                this.drawActivationWave(ctx, w * 0.4, h * 0.3, '#39ff14');
                ctx.fillStyle = '#39ff14';
                ctx.fillText('Premotor Activation during Observation', 20, 110);
            }
            if (activeEnhancement.id === 16) { // Threat Detection
                this.drawFastArrow(ctx, w * 0.5, h * 0.5, w * 0.6, h * 0.6, '#ff0000', 'Thalamus -> Amygdala (Fast Path)');
            }
            if (activeEnhancement.id === 19) { // Visual Streams
                ctx.strokeStyle = '#ff00ff';
                this.drawArrowLine(ctx, w * 0.7, h * 0.5, w * 0.6, h * 0.3); // Dorsal
                ctx.fillText('Dorsal (Where)', w * 0.72, h * 0.45);
                ctx.strokeStyle = '#00ffff';
                this.drawArrowLine(ctx, w * 0.7, h * 0.5, w * 0.6, h * 0.7); // Ventral
                ctx.fillText('Ventral (What)', w * 0.72, h * 0.55);
            }

            // 21-30: Memory/Logic
            if (activeEnhancement.id === 21) { // Episodic Memory
                this.drawPulse(ctx, w * 0.5, h * 0.6, '#4fd1c5', 'Hippocampal Encoding...');
            }
            if (activeEnhancement.id === 25) { // Mathematical Logic
                this.drawGridOverlay(ctx, w * 0.6, h * 0.3, '#ffff00', 'Numerical Processing (IPS)');
            }
            if (activeEnhancement.id === 30) { // Cognitive Flexibility
                this.drawSwitchSymbol(ctx, w * 0.35, h * 0.35, '#ff9900', 'Task Switching (Lateral PFC)');
            }
        },

        drawReciprocalLoop(ctx, x1, y1, x2, y2, color, label) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.ellipse((x1+x2)/2, (y1+y2)/2, 60, 30, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = color;
            ctx.fillText(label, (x1+x2)/2 - 30, (y1+y2)/2 + 50);
        },

        drawNetwork(ctx, color, label) {
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(this.app.canvas.width / 2, this.app.canvas.height / 2, 80, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.fillText(label, 20, 110);
        },

        drawActivationWave(ctx, x, y, color) {
            const time = Date.now() * 0.005;
            const radius = 20 + Math.sin(time) * 10;
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.stroke();
        },

        drawFastArrow(ctx, x1, y1, x2, y2, color, label) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            this.drawArrowLine(ctx, x1, y1, x2, y2);
            ctx.fillStyle = color;
            ctx.fillText(label, x1, y1 - 20);
        },

        drawPulse(ctx, x, y, color, label) {
            const s = 1 + Math.sin(Date.now() * 0.01) * 0.2;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 10 * s, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillText(label, x + 20, y);
        },

        drawGridOverlay(ctx, x, y, color, label) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.strokeRect(x + i * 15, y, 10, 10);
                ctx.strokeRect(x, y + i * 15, 10, 10);
            }
            ctx.fillStyle = color;
            ctx.fillText(label, x, y - 10);
        },

        drawSwitchSymbol(ctx, x, y, color, label) {
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI, false);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y + 10, 15, Math.PI, 0, false);
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.fillText(label, x + 25, y + 5);
        },

        drawArrowLine(ctx, fromx, fromy, tox, toy) {
            const headlen = 10;
            const dx = tox - fromx;
            const dy = toy - fromy;
            const angle = Math.atan2(dy, dx);
            ctx.beginPath();
            ctx.moveTo(fromx, fromy);
            ctx.lineTo(tox, toy);
            ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(tox, toy);
            ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        }
    };

    window.GreenhouseCognitionTheories = GreenhouseCognitionTheories;
})();
