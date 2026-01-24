/**
 * @file cognition_interventions.js
 * @description Therapeutic Intervention features for the Cognition model.
 * Covers Enhancements 56-80.
 */

(function () {
    'use strict';

    const GreenhouseCognitionInterventions = {
        init(app) {
            this.app = app;
            console.log('CognitionInterventions: Initialized');
        },

        render(ctx) {
            const activeEnhancement = this.app.activeEnhancement;
            if (!activeEnhancement || activeEnhancement.category !== 'Intervention') return;

            const w = this.app.canvas.width;
            const h = this.app.canvas.height;

            // Header
            ctx.fillStyle = '#4fd1c5';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(`INTERVENTION: ${activeEnhancement.name.toUpperCase()}`, 20, 70);

            ctx.font = '12px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Target Region: ${this.app.config.regions[activeEnhancement.region]?.name || activeEnhancement.region}`, 20, 90);

            // Specific logic
            if (activeEnhancement.id === 56) { // CBT
                this.drawRegulation(ctx, w * 0.4, h * 0.3, w * 0.5, h * 0.5, '#4da6ff', 'PFC Top-Down Regulation');
            }
            if (activeEnhancement.id === 57) { // Mindfulness
                this.drawPulse(ctx, w * 0.5, h * 0.45, '#00ffcc', 'Increased ACC/Insula Awareness');
            }
            if (activeEnhancement.id === 58) { // DBS
                this.drawElectrode(ctx, w * 0.5, h * 0.4, '#ffff00', 'DBS Area 25 Stimulation');
            }
            if (activeEnhancement.id === 59) { // TMS
                this.drawTMS(ctx, w * 0.4, h * 0.35, '#39ff14', 'TMS DLPFC Modulation');
            }
            if (activeEnhancement.id === 63) { // EMDR
                this.drawEMDR(ctx, w * 0.5, h * 0.5, '#ff9900', 'Bilateral Stimulation');
            }
            if (activeEnhancement.id === 70) { // Music Therapy
                this.drawSoundWaves(ctx, w * 0.5, h * 0.5, '#ff00ff', 'Multi-sensory Resonance');
            }
            if (activeEnhancement.id === 79) { // Light Therapy
                this.drawLight(ctx, w * 0.5, h * 0.6, '#ffffcc', 'SCN Photostimulation');
            }
        },

        drawRegulation(ctx, x1, y1, x2, y2, color, label) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            this.drawArrowLine(ctx, x1, y1, x2, y2);
            ctx.fillStyle = color;
            ctx.fillText(label, x1, y1 - 10);
        },

        drawPulse(ctx, x, y, color, label) {
            const s = 1 + Math.sin(Date.now() * 0.005) * 0.5;
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 30 * s, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.fillText(label, x - 50, y + 60);
        },

        drawElectrode(ctx, x, y, color, label) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y - 100);
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
            const time = Date.now() * 0.01;
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 10 + (time % 20), 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillText(label, x + 15, y);
        },

        drawTMS(ctx, x, y, color, label) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x + 10, y, 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.fillText(label, x - 20, y + 40);
        },

        drawEMDR(ctx, x, y, color, label) {
            const time = Date.now() * 0.005;
            const bx = x + Math.sin(time) * 100;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(bx, y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillText(label, x - 50, y + 40);
        },

        drawSoundWaves(ctx, x, y, color, label) {
            const time = Date.now() * 0.01;
            ctx.strokeStyle = color;
            for (let i = 0; i < 3; i++) {
                const r = ((time + i * 20) % 60);
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.fillStyle = color;
            ctx.fillText(label, x - 50, y + 80);
        },

        drawLight(ctx, x, y, color, label) {
            const grad = ctx.createRadialGradient(x, y, 5, x, y, 50);
            grad.addColorStop(0, color);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, 50, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillText(label, x - 50, y + 70);
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

    window.GreenhouseCognitionInterventions = GreenhouseCognitionInterventions;
})();
