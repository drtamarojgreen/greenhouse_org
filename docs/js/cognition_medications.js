/**
 * @file cognition_medications.js
 * @description Medication Management features for the Cognition model.
 * Covers Enhancements 81-100.
 */

(function () {
    'use strict';

    const GreenhouseCognitionMedications = {
        init(app) {
            this.app = app;
            console.log('CognitionMedications: Initialized');
        },

        render(ctx) {
            const activeEnhancement = this.app.activeEnhancement;
            if (!activeEnhancement || activeEnhancement.category !== 'Medication') return;

            const w = this.app.canvas.width;
            const h = this.app.canvas.height;

            // Header
            ctx.fillStyle = '#4fd1c5';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(`MEDICATION MECHANISM: ${activeEnhancement.name.toUpperCase()}`, 20, 70);

            ctx.font = '12px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Target Region: ${this.app.config.regions[activeEnhancement.region]?.name || activeEnhancement.region}`, 20, 90);

            // Specific logic
            if (activeEnhancement.id === 81) { // SSRI
                this.drawSynapse(ctx, w * 0.5, h * 0.45, '#00ff00', 'Serotonin Reuptake Inhibition');
            }
            if (activeEnhancement.id === 82) { // Dopamine Blockade
                this.drawSynapse(ctx, w * 0.5, h * 0.45, '#ff4d4d', 'D2 Receptor Blockade');
            }
            if (activeEnhancement.id === 83) { // ADHD Stimulants
                this.drawSynapse(ctx, w * 0.5, h * 0.45, '#ffff00', 'Increased NE/DA Concentration');
            }
            if (activeEnhancement.id === 87) { // Ketamine
                this.drawRapidSynaptogenesis(ctx, w * 0.5, h * 0.5, '#4fd1c5', 'Rapid Synaptogenesis Burst');
            }
            if (activeEnhancement.id === 91) { // BBB
                this.drawBBB(ctx, w * 0.5, h * 0.5, '#ffffff', 'Blood-Brain Barrier Permeability');
            }
            if (activeEnhancement.id === 93) { // Tolerance
                this.drawDownregulation(ctx, w * 0.5, h * 0.5, '#ff9900', 'Receptor Down-regulation');
            }
            if (activeEnhancement.id === 96) { // Steady State
                this.drawConcentrationCurve(ctx, w * 0.6, h * 0.3, '#4da6ff', 'Steady-State Concentration Tracking');
            }
        },

        drawSynapse(ctx, x, y, color, label) {
            // Presynaptic terminal
            ctx.fillStyle = '#333';
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - 40, y - 60);
            ctx.quadraticCurveTo(x, y - 80, x + 40, y - 60);
            ctx.lineTo(x + 30, y - 20);
            ctx.lineTo(x - 30, y - 20);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Postsynaptic density
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.rect(x - 50, y + 20, 100, 10);
            ctx.fill();
            ctx.stroke();

            // Neurotransmitters
            ctx.fillStyle = color;
            const time = Date.now() * 0.002;
            for (let i = 0; i < 15; i++) {
                const ox = Math.sin(time + i) * 30;
                const oy = (i * 3 + time * 10) % 40 - 20;
                ctx.beginPath();
                ctx.arc(x + ox, y + oy, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            // Inhibition markers if SSRI
            if (label.includes('Inhibition')) {
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x - 20, y - 30);
                ctx.lineTo(x + 20, y - 10);
                ctx.moveTo(x + 20, y - 30);
                ctx.lineTo(x - 20, y - 10);
                ctx.stroke();
            }

            ctx.fillStyle = color;
            ctx.font = 'bold 12px Arial';
            ctx.fillText(label, x - 80, y + 60);
        },

        drawRapidSynaptogenesis(ctx, x, y, color, label) {
            const time = Date.now() * 0.005;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + time;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(angle) * 40, y + Math.sin(angle) * 40);
                ctx.stroke();
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x + Math.cos(angle) * 40, y + Math.sin(angle) * 40, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = color;
            ctx.fillText(label, x - 60, y + 70);
        },

        drawBBB(ctx, x, y, color, label) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(x - 100, y);
            ctx.lineTo(x + 100, y);
            ctx.stroke();

            // Molecules attempting to cross
            const time = Date.now() * 0.005;
            for (let i = 0; i < 6; i++) {
                const tx = x - 90 + i * 35;
                const ty = y - 40 + (time + i) % 80;
                if (ty < y) ctx.fillStyle = '#ff0000'; // Blocked
                else ctx.fillStyle = '#4da6ff'; // Crossed

                ctx.beginPath();
                ctx.arc(tx, ty, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = color;
            ctx.fillText(label, x - 80, y + 60);
        },

        drawDownregulation(ctx, x, y, color, label) {
            ctx.fillStyle = '#333';
            ctx.fillRect(x - 60, y, 120, 10);

            // Receptors disappearing
            const time = Math.sin(Date.now() * 0.002);
            const count = 3 + Math.round(time * 2);
            ctx.fillStyle = color;
            for (let i = 0; i < 5; i++) {
                if (i < count) {
                    ctx.beginPath();
                    ctx.arc(x - 50 + i * 25, y - 5, 8, Math.PI, 0);
                    ctx.fill();
                } else {
                    ctx.strokeStyle = 'rgba(255,153,0,0.2)';
                    ctx.beginPath();
                    ctx.arc(x - 50 + i * 25, y - 5, 8, Math.PI, 0);
                    ctx.stroke();
                }
            }
            ctx.fillStyle = color;
            ctx.fillText(label, x - 60, y + 30);
        },

        drawConcentrationCurve(ctx, x, y, color, label) {
            const w = 150, h = 80;
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.strokeRect(x, y, w, h);

            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y + h);
            for (let i = 0; i < w; i++) {
                const steady = h * 0.7 * (1 - Math.exp(-i * 0.05));
                const ripple = Math.sin(i * 0.4) * 5;
                const val = h - (steady + ripple);
                ctx.lineTo(x + i, y + val);
            }
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.font = '10px Arial';
            ctx.fillText(label, x, y - 10);
            ctx.fillText('Steady State Range', x + 10, y + 25);
        }
    };

    window.GreenhouseCognitionMedications = GreenhouseCognitionMedications;
})();
