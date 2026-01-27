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
            acc: { x: 0, y: 80, z: 60 },
            striatum: { x: 40, y: -10, z: 40 }
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
                this.drawVagalSignal(ctx, app, time);
            }

            // Specialized Visuals
            if (id === 67) { // TMS
                this.drawTMS(ctx, app, 'prefrontalCortex', time);
            }
            if (id === 68) { // DBS
                this.drawDBS(ctx, app, 'acc', time);
            }
            if (id === 10) { // Oxytocin Social Buffering
                this.drawSocialBuffering(ctx, app, 'amygdala', time);
            }
            if (id === 12) { // Insula Activity
                this.drawPulseAlongPath(ctx, app, 'thalamus', 'insula', time, '#ff00ff');
            }
            if (id === 22 || id === 48) { // Reward
                this.drawDopamineBurst(ctx, app, 'striatum', time);
            }
            if (id === 30) { // EMDR
                this.drawEMDR(ctx, app, time);
            }
            if (id === 28 || id === 33) { // Breath Sync / Soothe
                this.drawPacer(ctx, app, time);
            }

            // Synapse Callouts
            if (id >= 51 && id <= 61 || id === 75) {
                this.drawSynapse(ctx, app, id, time);
            }

            // Network States
            if (id === 7) { // DMN vs CEN
                this.drawNetworkState(ctx, app, time);
            }
            if (id === 11) { // Sleep Deprivation
                this.drawSleepEffect(ctx, ctx.canvas.width, ctx.canvas.height, time);
            }
            if (id === 17) { // Top-Down vs Bottom-Up
                this.drawTopDownBottomUp(ctx, app, time);
            }
        },

        renderHUD(ctx, app, id, time) {
            const w = ctx.canvas.width;
            const h = ctx.canvas.height;

            // Neurochemical Meters
            if (id === 8 || id === 53 || id === 60) {
                this.drawBalanceMeter(ctx, w - 180, 80, time, app.simState?.gaba || 0.5);
            }
            if (id === 23 || id === 51 || id === 61) {
                this.drawHUDGauge(ctx, w - 180, 130, 'SEROTONIN', app.simState?.serotonin || (0.7 + Math.sin(time * 0.5) * 0.1), '#ff00ff');
            }
            if (id === 9 || id === 25) {
                this.drawHUDGauge(ctx, w - 180, 180, 'CORTISOL', app.simState?.cortisol || (0.3 + Math.sin(time * 2) * 0.4), '#ff4d4d');
            }

            // Physiological metrics
            if (id === 2 || id === 6 || id === 40) {
                this.drawHRV(ctx, w - 180, 230, time);
            }

            // Allostatic Load
            if (id === 25) {
                this.drawAllostaticGauge(ctx, w - 180, 380, time);
            }

            // Theory/Model specific gauges
            if (id === 77) { // Polyvagal
                this.drawPolyvagalGauge(ctx, w - 180, 280, time);
            }
            if (id === 94) { // Windows of Tolerance
                this.drawWindowOfTolerance(ctx, w - 180, 330, time);
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

        drawVagalSignal(ctx, app, time) {
            const p1 = this.projectRegion(app, 'brainstem');
            const p2 = this.projectRegion(app, 'hypothalamus');
            if (!p1 || !p2) return;

            // Nerve fiber line
            ctx.strokeStyle = 'rgba(255, 204, 0, 0.4)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // Moving pulses (Multiple)
            for (let i = 0; i < 3; i++) {
                const t = (time * 1.5 + i * 0.3) % 1;
                const px = p1.x + (p2.x - p1.x) * t;
                const py = p1.y + (p2.y - p1.y) * t;
                ctx.fillStyle = '#ffcc00';
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();

                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(px, py, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
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

        drawBalanceMeter(ctx, x, y, time, gaba) {
            const w = 150, h = 30;
            const glutamate = 1.0 - gaba;

            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(x, y, w, h);

            // Glutamate (Excitatory)
            ctx.fillStyle = '#ff4d4d';
            ctx.fillRect(x, y, w * glutamate, h / 2);
            ctx.fillStyle = '#fff';
            ctx.font = '8px Arial';
            ctx.fillText('GLUTAMATE', x + 5, y + 10);

            // GABA (Inhibitory)
            ctx.fillStyle = '#4fd1c5';
            ctx.fillRect(x, y + h / 2, w * gaba, h / 2);
            ctx.fillStyle = '#fff';
            ctx.fillText('GABA', x + 5, y + 25);

            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.strokeRect(x, y, w, h);
            ctx.beginPath();
            ctx.moveTo(x, y + h / 2);
            ctx.lineTo(x + w, y + h / 2);
            ctx.stroke();
        },

        drawSocialBuffering(ctx, app, region, time) {
            const p = this.projectRegion(app, region);
            if (!p) return;
            ctx.save();
            ctx.strokeStyle = '#00ff64';
            ctx.lineWidth = 2;
            const r = 20 + Math.sin(time * 4) * 10;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        },

        drawDopamineBurst(ctx, app, region, time) {
            const p = this.projectRegion(app, region);
            if (!p) return;
            const count = 10;
            for (let i = 0; i < count; i++) {
                const t = (time * 2 + i / count) % 1;
                const r = t * 50;
                const angle = (i / count) * Math.PI * 2;
                const px = p.x + Math.cos(angle) * r;
                const py = p.y + Math.sin(angle) * r;
                ctx.fillStyle = `rgba(255, 200, 0, ${1 - t})`;
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        },

        drawPolyvagalGauge(ctx, x, y, time) {
            const states = ['SOCIAL', 'FIGHT/FLIGHT', 'FREEZE'];
            const colors = ['#00ff64', '#ffff00', '#ff0000'];
            const activeIndex = Math.floor((Math.sin(time * 0.5) + 1) * 1.5);

            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText('POLYVAGAL STATE', x, y - 5);

            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = (i === activeIndex) ? colors[i] : 'rgba(255,255,255,0.1)';
                ctx.fillRect(x + i * 52, y, 48, 15);
                ctx.fillStyle = (i === activeIndex) ? '#000' : '#fff';
                ctx.font = '8px Arial';
                ctx.fillText(states[i], x + i * 52 + 5, y + 10);
            }
        },

        drawWindowOfTolerance(ctx, x, y, time) {
            const val = (Math.sin(time) + 1) / 2; // 0 to 1
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('WINDOW OF TOLERANCE', x, y - 5);

            // Background
            ctx.fillStyle = 'rgba(255,0,0,0.2)'; // Hyper
            ctx.fillRect(x, y, 150, 20);
            ctx.fillStyle = 'rgba(0,255,0,0.2)'; // Window
            ctx.fillRect(x, y + 20, 150, 20);
            ctx.fillStyle = 'rgba(0,0,255,0.2)'; // Hypo
            ctx.fillRect(x, y + 40, 150, 20);

            // Needle
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y + val * 60);
            ctx.lineTo(x + 150, y + val * 60);
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = '8px Arial';
            ctx.fillText('HYPER', x + 155, y + 12);
            ctx.fillText('OPTIMAL', x + 155, y + 32);
            ctx.fillText('HYPO', x + 155, y + 52);
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

        drawAllostaticGauge(ctx, x, y, time) {
            const radius = 30;
            const centerX = x + 75;
            const centerY = y + 30;
            const val = 0.5 + Math.sin(time * 0.3) * 0.4;

            ctx.strokeStyle = '#4a5568';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, Math.PI * 0.8, Math.PI * 2.2);
            ctx.stroke();

            ctx.strokeStyle = (val > 0.7) ? '#ff4d4d' : '#ffcc00';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, Math.PI * 0.8, Math.PI * (0.8 + 1.4 * val));
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('ALLOSTATIC LOAD', centerX, y - 5);
            ctx.fillText(`${(val * 100).toFixed(0)}%`, centerX, centerY + 5);
        },

        drawSynapse(ctx, app, id, time) {
            const x = ctx.canvas.width - 250;
            const y = ctx.canvas.height - 150;
            const w = 200, h = 120;

            ctx.save();
            ctx.translate(x, y);

            // Box
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.strokeRect(0, 0, w, h);
            ctx.fillRect(0, 0, w, h);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('SYNAPTIC SIMULATION', 10, 15);

            // Presynaptic (Top)
            ctx.strokeStyle = '#4a5568';
            ctx.beginPath();
            ctx.moveTo(40, 30);
            ctx.bezierCurveTo(40, 50, 160, 50, 160, 30);
            ctx.stroke();

            // Postsynaptic (Bottom)
            ctx.beginPath();
            ctx.moveTo(40, 90);
            ctx.bezierCurveTo(40, 70, 160, 70, 160, 90);
            ctx.stroke();

            // Reuptake Pump
            ctx.fillStyle = (id === 51 || id === 52) ? '#ff0000' : '#4a5568';
            ctx.fillRect(100, 35, 10, 5);
            if (id === 51 || id === 52) {
                ctx.fillStyle = '#fff';
                ctx.font = '8px Arial';
                ctx.fillText('BLOCKED', 115, 40);
            }

            // Neurotransmitters
            const color = (id === 53) ? '#4fd1c5' : (id === 59 ? '#ffcc00' : '#ff00ff');
            const count = (id === 59) ? 15 : 8;
            for (let i = 0; i < count; i++) {
                const t = (time * (1 + i * 0.1)) % 1;
                const tx = 50 + i * 15;
                const ty = 45 + t * 30;

                // If blocked, they stay in cleft longer
                if ((id === 51 || id === 52) && t > 0.8) continue;

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(tx, ty, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Postsynaptic Receptors
            for (let i = 0; i < 5; i++) {
                const rx = 60 + i * 25;
                ctx.fillStyle = (id === 58 || id === 75) ? '#ff4d4d' : '#2d3748';
                ctx.fillRect(rx, 75, 10, 5);
                if (id === 58 || id === 75) {
                    ctx.strokeStyle = '#fff';
                    ctx.strokeRect(rx, 75, 10, 5);
                }
            }

            ctx.restore();
        },

        drawNetworkState(ctx, app, time) {
            const w = ctx.canvas.width;
            const h = ctx.canvas.height;
            const mode = Math.sin(time * 0.5) > 0 ? 'DMN' : 'CEN';

            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(`NETWORK: ${mode === 'DMN' ? 'DEFAULT MODE (Rumination)' : 'CENTRAL EXECUTIVE (Focus)'}`, w/2 - 150, 80);

            // Highlight connections based on mode
            if (mode === 'DMN') {
                this.drawPulseAlongPath(ctx, app, 'prefrontalCortex', 'hippocampus', time, '#ff00ff');
            } else {
                this.drawPulseAlongPath(ctx, app, 'prefrontalCortex', 'thalamus', time, '#00ffff');
            }
            ctx.restore();
        },

        drawSleepEffect(ctx, w, h, time) {
            const alpha = 0.3 + Math.sin(time) * 0.2;
            ctx.fillStyle = `rgba(0, 0, 20, ${alpha})`;
            ctx.fillRect(0, 0, w, h);

            ctx.fillStyle = '#fff';
            ctx.font = 'italic 12px Arial';
            ctx.fillText('SLEEP DEPRIVATION: REDUCED PFC CONTROL', 20, h - 20);
        },

        drawTopDownBottomUp(ctx, app, time) {
            const isTopDown = Math.sin(time) > 0;
            const color = isTopDown ? '#00ffff' : '#ff4d4d';

            if (isTopDown) {
                this.drawCircuit(ctx, app, 'prefrontalCortex', 'amygdala', time, color, true);
                ctx.fillStyle = color;
                ctx.fillText('TOP-DOWN REGULATION', 20, 100);
            } else {
                this.drawCircuit(ctx, app, 'amygdala', 'prefrontalCortex', time, color, false);
                ctx.fillStyle = color;
                ctx.fillText('BOTTOM-UP REACTIVITY', 20, 100);
            }
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
