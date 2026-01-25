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
            if (activeEnhancement.id === 60) { // Exposure
                this.drawDesensitization(ctx, w * 0.5, h * 0.5, '#ff4d4d', 'Amygdala Habituation');
            }
            if (activeEnhancement.id === 61) { // Biofeedback
                this.drawWaves(ctx, w * 0.5, h * 0.5, '#4da6ff', 'Simulated EEG States');
            }
            if (activeEnhancement.id === 62) { // Cognitive Remediation
                this.drawExercise(ctx, w * 0.35, h * 0.35, '#ffff00', 'Targeted Executive Stimulation');
            }
            if (activeEnhancement.id === 63) { // EMDR
                this.drawEMDR(ctx, w * 0.5, h * 0.5, '#ff9900', 'Bilateral Stimulation');
            }
            if (activeEnhancement.id === 64) { // BDNF
                this.drawGrowthFactors(ctx, w * 0.5, h * 0.6, '#00ff00', 'Exercise-Induced BDNF Release');
            }
            if (activeEnhancement.id === 65) { // Sleep
                this.drawGlymphatic(ctx, w * 0.5, h * 0.5, '#4da6ff', 'Glymphatic Waste Clearance');
            }
            if (activeEnhancement.id === 66) { // Social Skills
                this.drawPulse(ctx, w * 0.6, h * 0.5, '#ff00ff', 'Mirror Neuron & TPJ Strengthening');
            }
            if (activeEnhancement.id === 67) { // ACT
                this.drawFlexibility(ctx, w * 0.5, h * 0.5, '#4fd1c5', 'Psychological Flexibility Hub');
            }
            if (activeEnhancement.id === 68) { // DBT
                this.drawBalance(ctx, w * 0.5, h * 0.5, '#ff9900', 'Dialectics: Acceptance & Change');
            }
            if (activeEnhancement.id === 69) { // Art Therapy
                this.drawColorSplash(ctx, w * 0.5, h * 0.5);
            }
            if (activeEnhancement.id === 70) { // Music Therapy
                this.drawSoundWaves(ctx, w * 0.5, h * 0.5, '#ff00ff', 'Multi-sensory Resonance');
            }
            if (activeEnhancement.id === 71) { // ADHD Neurofeedback
                this.drawFrequencyBars(ctx, w * 0.5, h * 0.5, '#ffff00', 'Theta/Beta Ratio Target');
            }
            if (activeEnhancement.id === 72) { // VR Exposure
                this.drawVROverlay(ctx, w * 0.5, h * 0.5);
            }
            if (activeEnhancement.id === 73) { // Breathing
                this.drawVagusBreathing(ctx, w * 0.5, h * 0.7);
            }
            if (activeEnhancement.id === 74) { // Narrative
                this.drawSchema(ctx, w * 0.4, h * 0.4, '#ffffff', 'Re-authoring Self-Schemas');
            }
            if (activeEnhancement.id === 75) { // VNS
                this.drawVNS(ctx, w * 0.5, h * 0.8, '#00ffff', 'Vagus Nerve Stimulation');
            }
            if (activeEnhancement.id === 76) { // Social Interaction
                this.drawOxytocin(ctx, w * 0.5, h * 0.5);
            }
            if (activeEnhancement.id === 77) { // Trauma-Informed
                this.drawSafety(ctx, w * 0.5, h * 0.5);
            }
            if (activeEnhancement.id === 78) { // Motivational Interviewing
                this.drawChangeTalk(ctx, w * 0.35, h * 0.35);
            }
            if (activeEnhancement.id === 79) { // Light Therapy
                this.drawLight(ctx, w * 0.5, h * 0.6, '#ffffcc', 'SCN Photostimulation');
            }
            if (activeEnhancement.id === 80) { // Play Therapy
                this.drawPlay(ctx, w * 0.5, h * 0.6);
            }
        },

        drawDesensitization(ctx, x, y, color, label) {
            const time = Date.now() * 0.001;
            const amp = 40 * Math.exp(-time % 5);
            ctx.strokeStyle = color;
            ctx.beginPath();
            for (let i = 0; i < 100; i++) {
                ctx.lineTo(x - 50 + i, y + Math.sin(i * 0.2) * amp);
            }
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.fillText(label, x - 50, y + 60);
        },

        drawWaves(ctx, x, y, color, label) {
            const time = Date.now() * 0.005;
            ctx.strokeStyle = color;
            ctx.beginPath();
            for (let i = 0; i < 200; i++) {
                ctx.lineTo(x - 100 + i, y + Math.sin(time + i * 0.1) * 20);
            }
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.fillText(label, x - 50, y + 50);
        },

        drawGrowthFactors(ctx, x, y, color, label) {
            const time = Date.now() * 0.002;
            ctx.fillStyle = color;
            for (let i = 0; i < 8; i++) {
                const ox = Math.sin(time + i) * 30;
                const oy = - (time * 20 + i * 10) % 60;
                ctx.beginPath();
                ctx.arc(x + ox, y + oy, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillText(label, x - 70, y + 20);
        },

        drawGlymphatic(ctx, x, y, color, label) {
            const time = Date.now() * 0.002;
            ctx.strokeStyle = color;
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 5; i++) {
                const ox = (time * 50 + i * 40) % 200 - 100;
                ctx.beginPath();
                ctx.moveTo(x + ox, y - 50);
                ctx.lineTo(x + ox, y + 50);
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = color;
            ctx.fillText(label, x - 70, y + 70);
        },

        drawFrequencyBars(ctx, x, y, color, label) {
            const t = Math.sin(Date.now() * 0.01) * 20 + 40;
            const b = Math.sin(Date.now() * 0.015) * 10 + 20;
            ctx.fillStyle = '#ff4d4d';
            ctx.fillRect(x - 40, y - t, 30, t);
            ctx.fillStyle = '#4fd1c5';
            ctx.fillRect(x + 10, y - b, 30, b);
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.fillText('Theta', x - 40, y + 15);
            ctx.fillText('Beta', x + 10, y + 15);
            ctx.fillStyle = color;
            ctx.font = '12px Arial';
            ctx.fillText(label, x - 60, y + 35);
        },

        drawVagusBreathing(ctx, x, y) {
            const time = Date.now() * 0.001;
            const scale = 1 + Math.sin(time) * 0.2;
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.bezierCurveTo(x - 50, y - 100, x + 50, y - 200, x, y - 300);
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.fillText(scale > 1 ? 'INHALE' : 'EXHALE', x + 20, y - 150);
        },

        drawVNS(ctx, x, y, color, label) {
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y - 150);
            ctx.stroke();
            const time = Date.now() * 0.02;
            const py = y - (time % 150);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, py, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillText(label, x + 10, y - 75);
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

        drawExercise(ctx, x, y, color, label) {
            ctx.strokeStyle = color;
            ctx.strokeRect(x - 20, y - 20, 40, 40);
            ctx.fillStyle = color;
            ctx.fillText(label, x - 50, y + 40);
        },

        drawFlexibility(ctx, x, y, color, label) {
            ctx.strokeStyle = color;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(angle) * 50, y + Math.sin(angle) * 50);
            }
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.fillText(label, x - 60, y + 70);
        },

        drawBalance(ctx, x, y, color, label) {
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.moveTo(x - 50, y + 20);
            ctx.lineTo(x + 50, y - 20);
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.fillText(label, x - 60, y + 50);
        },

        drawColorSplash(ctx, x, y) {
            const colors = ['#ff4d4d', '#4fd1c5', '#ffff00', '#ff00ff'];
            colors.forEach((c, i) => {
                ctx.fillStyle = c;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(x - 30 + i * 20, y + Math.sin(Date.now() * 0.01 + i) * 20, 15, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#fff';
            ctx.fillText('Art Therapy: Emotional Expression', x - 80, y + 60);
        },

        drawVROverlay(ctx, x, y) {
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(x - 100, y - 60, 200, 120);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(x - 100, y - 60, 200, 120);
            ctx.fillStyle = '#ff4d4d';
            ctx.fillText('VR EXPOSURE: Controlled Activation', x - 80, y);
        },

        drawSchema(ctx, x, y, color, label) {
            ctx.strokeStyle = color;
            ctx.strokeRect(x, y, 60, 80);
            ctx.fillStyle = color;
            ctx.fillText('NEW STORY', x + 5, y + 40);
            ctx.fillText(label, x - 20, y + 100);
        },

        drawOxytocin(ctx, x, y) {
            ctx.fillStyle = '#ffb6c1';
            const time = Date.now() * 0.002;
            for (let i = 0; i < 8; i++) {
                ctx.beginPath();
                ctx.arc(x + Math.sin(time + i) * 40, y + Math.cos(time + i) * 40, 5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillText('Oxytocin Surge: Social Bonding', x - 70, y + 70);
        },

        drawSafety(ctx, x, y) {
            ctx.strokeStyle = '#4da6ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 60, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#4da6ff';
            ctx.fillText('Safety Boundary: Limbic Calming', x - 80, y + 80);
        },

        drawChangeTalk(ctx, x, y) {
            ctx.fillStyle = '#4fd1c5';
            ctx.font = 'italic 12px Arial';
            ctx.fillText('"I want to change..."', x, y);
            ctx.font = '12px Arial';
            ctx.fillText('Motivational Interviewing: Change-Talk', x - 50, y + 30);
        },

        drawPlay(ctx, x, y) {
            ctx.fillStyle = '#ffff00';
            const time = Date.now() * 0.01;
            ctx.beginPath();
            ctx.arc(x + Math.cos(time) * 30, y + Math.sin(time) * 30, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillText('Play Therapy: Reward & Social Activation', x - 90, y + 60);
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
