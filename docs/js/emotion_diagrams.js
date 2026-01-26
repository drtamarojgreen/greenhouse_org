/**
 * @file emotion_diagrams.js
 * @description Visualization engine for emotional and neurological diagrams.
 * Part of the 100 enhancements project, focusing on visual accuracy and interactivity.
 */

(function () {
    'use strict';

    const GreenhouseEmotionDiagrams = {
        // Anatomical Centers (Approximate for 200-radius model)
        centers: {
            prefrontalCortex: { x: 0, y: 50, z: 180 },
            amygdala: { x: 60, y: -40, z: 20 },
            hippocampus: { x: 80, y: -40, z: -40 },
            hypothalamus: { x: 0, y: -60, z: 0 },
            thalamus: { x: 0, y: 20, z: 0 },
            brainstem: { x: 0, y: -180, z: 0 },
            insula: { x: 100, y: -20, z: 0 },
            acc: { x: 0, y: 80, z: 60 }
        },

        draw(ctx, app) {
            if (!app.isRunning || !app.activeTheory) return;

            const time = Date.now() * 0.001;
            const theory = app.activeTheory;
            const id = theory.id;

            // 1. Contextual Diagrams based on ID
            this.renderSpecificDiagrams(ctx, app, id, time);

            // 2. HUD Elements
            this.renderHUD(ctx, app, id, time);
        },

        renderSpecificDiagrams(ctx, app, id, time) {
            // Signal Circuits
            if (id === 1 || id === 11 || id === 17 || id === 82) { // PFC-Amygdala Inhibitory Circuit
                this.drawCircuit(ctx, app, 'prefrontalCortex', 'amygdala', time, '#00ffff', true);
            }
            if (id === 4 || id === 9) { // Hippocampus-Amygdala
                this.drawCircuit(ctx, app, 'hippocampus', 'amygdala', time, '#00ff00', false);
            }
            if (id === 13) { // vmPFC Extinction
                this.drawCircuit(ctx, app, 'prefrontalCortex', 'amygdala', time, '#39ff14', true);
            }
            if (id === 66 || id === 23 || id === 6) { // Vagus Nerve / Brainstem
                this.drawPulseAlongPath(ctx, app, 'brainstem', 'hypothalamus', time, '#ffcc00');
            }

            // Specialized Visuals
            if (id === 67) { // TMS
                this.drawTMS(ctx, app, 'prefrontalCortex', time);
            }
            if (id === 68) { // DBS
                this.drawDBS(ctx, app, 'acc', time);
            }
            if (id === 30) { // EMDR
                this.drawEMDR(ctx, app, time);
            }
            if (id === 28 || id === 33) { // Breath Sync / Soothe
                this.drawPacer(ctx, app, time);
            }
        },

        renderHUD(ctx, app, id, time) {
            const w = ctx.canvas.width;
            const h = ctx.canvas.height;

            // Neurochemical Meters
            if (id === 8 || id === 53 || id === 60) {
                this.drawHUDGauge(ctx, w - 180, 80, 'GABA/GLUTAMATE', 0.5 + Math.sin(time) * 0.2, '#4fd1c5');
            }
            if (id === 23 || id === 51 || id === 61) {
                this.drawHUDGauge(ctx, w - 180, 130, 'SEROTONIN', 0.7 + Math.sin(time * 0.5) * 0.1, '#ff00ff');
            }
            if (id === 9 || id === 25) {
                this.drawHUDGauge(ctx, w - 180, 180, 'CORTISOL', 0.3 + Math.sin(time * 2) * 0.4, '#ff4d4d');
            }

            // Physiological metrics
            if (id === 2 || id === 6) {
                this.drawHRV(ctx, w - 180, 230, time);
            }
        },

        // Helper: Draw animated connection between regions
        drawCircuit(ctx, app, from, to, time, color, isInhibitory) {
            const p1 = this.projectRegion(app, from);
            const p2 = this.projectRegion(app, to);

            if (!p1 || !p2) return;

            // Line
            ctx.beginPath();
            ctx.setLineDash(isInhibitory ? [5, 5] : []);
            ctx.strokeStyle = color;
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = 2;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1.0;

            // Moving Pulse
            const t = (time % 1);
            const px = p1.x + (p2.x - p1.x) * t;
            const py = p1.y + (p2.y - p1.y) * t;

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();

            // Glow
            const grad = ctx.createRadialGradient(px, py, 0, px, py, 15);
            grad.addColorStop(0, color);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(px, py, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        },

        drawPulseAlongPath(ctx, app, from, to, time, color) {
            const p1 = this.projectRegion(app, from);
            const p2 = this.projectRegion(app, to);
            if (!p1 || !p2) return;

            const t = (time * 2) % 1;
            const px = p1.x + (p2.x - p1.x) * t;
            const py = p1.y + (p2.y - p1.y) * t;

            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        },

        drawTMS(ctx, app, region, time) {
            const p = this.projectRegion(app, region);
            if (!p) return;

            const r = (time * 50) % 100;
            ctx.strokeStyle = '#00ffff';
            ctx.globalAlpha = 1 - (r / 100);
            ctx.lineWidth = 2;

            for (let i = 0; i < 3; i++) {
                const radius = (r + i * 30) % 100;
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, radius, radius * 0.3, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;
        },

        drawDBS(ctx, app, region, time) {
            const p = this.projectRegion(app, region);
            if (!p) return;

            const spark = Math.random() > 0.8;
            ctx.strokeStyle = spark ? '#fff' : '#ffcc00';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - 100);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();

            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5 + Math.sin(time * 10) * 2, 0, Math.PI * 2);
            ctx.fill();
        },

        drawEMDR(ctx, app, time) {
            const w = ctx.canvas.width;
            const x = w / 2 + Math.sin(time * 3) * (w * 0.4);
            const y = 50;

            ctx.fillStyle = '#ff4d4d';
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 77, 77, 0.3)';
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        },

        drawPacer(ctx, app, time) {
            const x = 70, y = ctx.canvas.height - 70;
            const scale = 0.5 + Math.sin(time * 0.5) * 0.5; // 0 to 1
            const r = 20 + scale * 30;

            ctx.strokeStyle = '#4fd1c5';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, 50, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(79, 209, 197, 0.3)';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(scale > 0.5 ? 'INHALE' : 'EXHALE', x, y + 5);
        },

        drawHUDGauge(ctx, x, y, label, value, color) {
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(x, y, 150, 15);

            ctx.fillStyle = color;
            ctx.fillRect(x, y, 150 * value, 15);

            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.strokeRect(x, y, 150, 15);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(label, x, y - 5);
        },

        drawHRV(ctx, x, y, time) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i < 150; i++) {
                const val = Math.sin((time - i * 0.05) * 2) * 10 + Math.sin((time - i * 0.05) * 10) * 5;
                if (i === 0) ctx.moveTo(x + i, y + 15 + val);
                else ctx.lineTo(x + i, y + 15 + val);
            }
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('HRV BIOFEEDBACK', x, y - 5);
        },

        projectRegion(app, region) {
            const center = this.centers[region];
            if (!center || !window.GreenhouseModels3DMath) return null;

            return window.GreenhouseModels3DMath.project3DTo2D(
                center.x, center.y, center.z,
                app.camera,
                app.projection
            );
        }
    };

    window.GreenhouseEmotionDiagrams = GreenhouseEmotionDiagrams;
})();
