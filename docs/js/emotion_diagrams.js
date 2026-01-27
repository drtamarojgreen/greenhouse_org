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

            // Neural Oscillations (EEG)
            this.drawEEG(ctx, 20, h - 100, time, app.simState);

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

            // Particle Burst at Target
            if (t > 0.95) {
                this.drawBurst(ctx, p2.x, p2.y, color, time);
            }
        },

        drawBurst(ctx, x, y, color, time) {
            const count = 8;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2 + time * 5;
                const dist = 10 + Math.sin(time * 10) * 5;
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.6;
                ctx.beginPath();
                ctx.arc(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, 2, 0, Math.PI * 2);
                ctx.fill();
            }
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

        drawEEG(ctx, x, y, time, state) {
            const w = 200, h = 60;
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.strokeRect(x, y, w, h);

            // Alpha Waves (8-13 Hz) - Relaxation
            this.drawWave(ctx, x, y + 15, w, time, 10, 5 * (state.serotonin || 0.5), '#4fd1c5', 'ALPHA');
            // Beta Waves (13-30 Hz) - Alertness/Stress
            this.drawWave(ctx, x, y + 35, w, time, 20, 3 * (state.cortisol || 0.5), '#ff4d4d', 'BETA');
            // Gamma Waves (30-100 Hz) - High Processing
            this.drawWave(ctx, x, y + 55, w, time, 40, 2 * (1 - (state.cortisol || 0.5)), '#fff', 'GAMMA');

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('NEURAL OSCILLATIONS (EEG)', x, y - 5);
        },

        drawWave(ctx, x, y, w, time, freq, amp, color, label) {
            ctx.strokeStyle = color;
            ctx.beginPath();
            for (let i = 0; i < w; i++) {
                const val = Math.sin((time * freq) - i * 0.1) * amp;
                if (i === 0) ctx.moveTo(x + i, y + val);
                else ctx.lineTo(x + i, y + val);
            }
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.font = '7px Arial';
            ctx.fillText(label, x + w + 5, y + 3);
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
            const y = ctx.canvas.height - 170;
            const w = 220, h = 140;

            ctx.save();
            ctx.translate(x, y);

            // Container with glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0, 255, 255, 0.2)';
            ctx.fillStyle = 'rgba(5, 5, 20, 0.9)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.roundRect(ctx, 0, 0, w, h, 8, true, true);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('SYNAPTIC TERMINAL', 10, 18);

            // Labels
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '7px Arial';
            ctx.fillText('PRE-SYNAPTIC', 10, 35);
            ctx.fillText('POST-SYNAPTIC', 10, 115);
            ctx.fillText('CLEFT', 185, 75);

            // Presynaptic Membrane
            ctx.strokeStyle = '#718096';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(40, 40);
            ctx.bezierCurveTo(40, 65, 180, 65, 180, 40);
            ctx.stroke();

            // Postsynaptic Membrane
            ctx.beginPath();
            ctx.moveTo(40, 110);
            ctx.bezierCurveTo(40, 85, 180, 85, 180, 110);
            ctx.stroke();

            // Reuptake Pump (DAT/SERT)
            const isBlocked = (id === 51 || id === 52 || id === 54);
            ctx.fillStyle = isBlocked ? '#f56565' : '#4a5568';
            ctx.fillRect(100, 48, 12, 6);
            if (isBlocked) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 7px Arial';
                ctx.fillText('BLOCKED', 115, 54);
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.font = '7px Arial';
                ctx.fillText('PUMP', 115, 54);
            }

            // Neurotransmitters (NT)
            const ntColor = (id === 53) ? '#4fd1c5' : (id >= 51 && id <= 55 ? '#ed64a6' : '#ecc94b');
            const ntCount = (id === 59) ? 20 : 10;
            for (let i = 0; i < ntCount; i++) {
                const cycle = (time * (0.8 + i * 0.1)) % 1;
                const tx = 50 + i * 12;
                const ty = 55 + cycle * 35;

                // Reuptake simulation: if not blocked, NT goes back up at end
                if (!isBlocked && cycle > 0.8) {
                     const backT = (cycle - 0.8) * 5;
                     const bty = 90 - backT * 40;
                     const btx = 100 + (tx - 100) * (1 - backT);
                     ctx.fillStyle = ntColor;
                     ctx.beginPath(); ctx.arc(btx, bty, 2, 0, Math.PI * 2); ctx.fill();
                     continue;
                }

                ctx.fillStyle = ntColor;
                ctx.globalAlpha = 1.0 - (cycle > 0.9 ? (cycle - 0.9) * 10 : 0);
                ctx.beginPath();
                ctx.arc(tx, ty, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }

            // Postsynaptic Receptors (Binding Animation)
            for (let i = 0; i < 6; i++) {
                const rx = 55 + i * 22;
                const isAntagonist = (id === 58 || id === 75);
                const isBinding = Math.sin(time * 5 + i) > 0.5;

                ctx.fillStyle = isAntagonist ? '#f56565' : (isBinding ? ntColor : '#2d3748');
                ctx.fillRect(rx, 90, 10, 4);

                if (isAntagonist) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(rx, 90, 10, 4);
                }
            }

            ctx.restore();
        },

        roundRect(ctx, x, y, width, height, radius, fill, stroke) {
            if (typeof radius === 'undefined') radius = 5;
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            if (fill) ctx.fill();
            if (stroke) ctx.stroke();
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
