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
            if (activeEnhancement.id === 84) { // GABA
                this.drawSynapse(ctx, w * 0.5, h * 0.45, '#4da6ff', 'GABAergic Potentiation (Inhibitory)');
            }
            if (activeEnhancement.id === 85) { // Lithium
                this.drawStabilization(ctx, w * 0.5, h * 0.5, '#ffffff', 'Intracellular Signal Stabilization');
            }
            if (activeEnhancement.id === 86) { // SNRI
                this.drawSynapseDual(ctx, w * 0.5, h * 0.45, '#00ff00', '#ffff00', 'Dual Action: 5-HT & NE');
            }
            if (activeEnhancement.id === 87) { // Ketamine
                this.drawRapidSynaptogenesis(ctx, w * 0.5, h * 0.5, '#4fd1c5', 'Rapid Synaptogenesis Burst');
            }
            if (activeEnhancement.id === 88) { // MAOI
                this.drawSynapse(ctx, w * 0.5, h * 0.45, '#ff9900', 'MAO Enzyme Inhibition');
            }
            if (activeEnhancement.id === 89) { // Acetylcholinesterase
                this.drawSynapse(ctx, w * 0.5, h * 0.45, '#ff9900', 'Inhibiting Enzyme Breakdown (ACh)');
            }
            if (activeEnhancement.id === 90) { // Side Effects
                this.drawEPS(ctx, w * 0.6, h * 0.6, '#ff4d4d', 'Extrapyramidal Side Effects (EPS)');
            }
            if (activeEnhancement.id === 91) { // BBB
                this.drawBBB(ctx, w * 0.5, h * 0.5, '#ffffff', 'Blood-Brain Barrier Permeability');
            }
            if (activeEnhancement.id === 92) { // Occupancy
                this.drawOccupancy(ctx, w * 0.5, h * 0.5, '#39ff14', 'Receptor Occupancy: ~70-80%');
            }
            if (activeEnhancement.id === 93) { // Tolerance
                this.drawDownregulation(ctx, w * 0.5, h * 0.5, '#ff9900', 'Receptor Down-regulation');
            }
            if (activeEnhancement.id === 94) { // Withdrawal
                this.drawRebound(ctx, w * 0.5, h * 0.6, '#ff0000', 'Withdrawal Rebound Effect');
            }
            if (activeEnhancement.id === 95) { // Pharmacogenomic
                this.drawDNAVariation(ctx, w * 0.5, h * 0.5, '#4da6ff', 'Genetic Metabolism Variation');
            }
            if (activeEnhancement.id === 96) { // Steady State
                this.drawConcentrationCurve(ctx, w * 0.6, h * 0.3, '#4da6ff', 'Steady-State Concentration Tracking');
            }
            if (activeEnhancement.id === 97) { // Polypharmacy
                this.drawInteractions(ctx, w * 0.5, h * 0.5);
            }
            if (activeEnhancement.id === 98) { // Novel Targets
                this.drawNovel(ctx, w * 0.5, h * 0.5, '#ffffff', 'Orphan Receptor Research');
            }
            if (activeEnhancement.id === 99) { // Metabolic
                this.drawMetabolic(ctx, w * 0.5, h * 0.5);
            }
            if (activeEnhancement.id === 100) { // Offline
                this.drawOfflineSync(ctx, w * 0.5, h * 0.5);
            }
        },

        drawStabilization(ctx, x, y, color, label) {
            const time = Date.now() * 0.001;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - 100, y);
            for (let i = 0; i < 200; i++) {
                const noise = Math.sin(time + i * 0.1) * (20 * Math.exp(-i * 0.01));
                ctx.lineTo(x - 100 + i, y + noise);
            }
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.fillText(label, x - 80, y + 40);
        },

        drawSynapseDual(ctx, x, y, color1, color2, label) {
            this.drawSynapse(ctx, x, y, color1, label);
            // Add second neurotransmitter
            ctx.fillStyle = color2;
            const time = Date.now() * 0.002;
            for (let i = 0; i < 10; i++) {
                const ox = Math.cos(time + i) * 30;
                const oy = (i * 4 + time * 12) % 40 - 20;
                ctx.beginPath();
                ctx.arc(x + ox, y + oy, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        },

        drawOccupancy(ctx, x, y, color, label) {
            const receptors = 10;
            const occupied = 7;
            for (let i = 0; i < receptors; i++) {
                ctx.fillStyle = i < occupied ? color : '#333';
                ctx.beginPath();
                ctx.arc(x - 100 + i * 20, y, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#666';
                ctx.stroke();
            }
            ctx.fillStyle = color;
            ctx.fillText(label, x - 60, y + 40);
        },

        drawSynapse(ctx, x, y, color, label) {
            // Presynaptic terminal
            ctx.fillStyle = '#333';
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - 50, y - 80);
            ctx.quadraticCurveTo(x, y - 100, x + 50, y - 80);
            ctx.lineTo(x + 40, y - 30);
            ctx.lineTo(x - 40, y - 30);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Transporters (SERT/DAT)
            ctx.fillStyle = '#555';
            ctx.fillRect(x - 35, y - 35, 10, 10);
            ctx.fillRect(x + 25, y - 35, 10, 10);

            // Postsynaptic density
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.rect(x - 60, y + 30, 120, 15);
            ctx.fill();
            ctx.stroke();

            // Receptors
            ctx.strokeStyle = '#4da6ff';
            for(let i=0; i<4; i++) {
                ctx.beginPath();
                ctx.arc(x - 45 + i*30, y + 30, 8, Math.PI, 0);
                ctx.stroke();
            }

            // Neurotransmitters
            ctx.fillStyle = color;
            const time = Date.now() * 0.002;
            for (let i = 0; i < 20; i++) {
                const ox = Math.sin(time + i) * 40;
                const oy = (i * 4 + time * 15) % 60 - 30;
                ctx.beginPath();
                ctx.arc(x + ox, y + oy, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Inhibition markers (Red 'X' on transporters)
            if (label.includes('Inhibition') || label.includes('Blockade')) {
                ctx.strokeStyle = '#ff4d4d';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x - 35, y - 35); ctx.lineTo(x - 25, y - 25);
                ctx.moveTo(x - 25, y - 35); ctx.lineTo(x - 35, y - 25);
                ctx.moveTo(x + 25, y - 35); ctx.lineTo(x + 35, y - 25);
                ctx.moveTo(x + 35, y - 35); ctx.lineTo(x + 25, y - 25);
                ctx.stroke();
            }

            ctx.fillStyle = color;
            ctx.font = 'bold 12px Arial';
            ctx.fillText(label, x - 100, y + 70);
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
            // Endothelial cells
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            for(let i=0; i<4; i++) {
                ctx.fillRect(x - 120 + i*60, y - 5, 55, 10);
            }

            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x - 120, y);
            ctx.lineTo(x + 120, y);
            ctx.stroke();

            // Blood side vs CNS side
            ctx.fillStyle = 'rgba(255, 77, 77, 0.1)';
            ctx.fillRect(x - 120, y - 100, 240, 100);
            ctx.fillStyle = 'rgba(77, 166, 255, 0.1)';
            ctx.fillRect(x - 120, y, 240, 100);

            // Molecules
            const time = Date.now() * 0.005;
            for (let i = 0; i < 8; i++) {
                const tx = x - 100 + i * 30;
                const ty = y - 60 + (time + i*5) % 120;
                const isLarge = i % 3 === 0;
                const isLipophilic = i % 2 === 0;

                if (ty < y) {
                    ctx.fillStyle = isLarge ? '#ff4d4d' : '#f6e05e';
                } else {
                    ctx.fillStyle = isLarge && ty < y + 10 ? '#ff4d4d' : '#4da6ff';
                    if (isLarge && ty < y + 15) return; // Blocked large ones
                }

                ctx.beginPath();
                ctx.arc(tx, Math.min(ty, y - 5) > y - 10 && isLarge ? y - 10 : ty, isLarge ? 6 : 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = color;
            ctx.fillText(label, x - 100, y + 80);
            ctx.font = '10px Arial';
            ctx.fillText('BLOOD SIDE', x + 50, y - 20);
            ctx.fillText('CNS SIDE', x + 50, y + 30);
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
            const w = 200, h = 120;
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.strokeRect(x, y, w, h);

            // Zones
            ctx.fillStyle = 'rgba(255, 77, 77, 0.1)'; ctx.fillRect(x, y, w, 30); // Toxic
            ctx.fillStyle = 'rgba(57, 255, 20, 0.1)'; ctx.fillRect(x, y + 30, w, 50); // Therapeutic
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; ctx.fillRect(x, y + 80, w, 40); // Sub-therapeutic

            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, y + h);
            for (let i = 0; i < w; i++) {
                const doseEffect = Math.sin(i * 0.2) * 5;
                const val = h - (h * 0.6 * (1 - Math.exp(-i * 0.03)) + 30 + doseEffect);
                ctx.lineTo(x + i, y + val);
            }
            ctx.stroke();

            ctx.fillStyle = color;
            ctx.font = 'bold 11px Arial';
            ctx.fillText(label, x, y - 15);
            ctx.fillStyle = '#fff';
            ctx.font = '9px Arial';
            ctx.fillText('TOXIC', x + w + 5, y + 20);
            ctx.fillText('THERAPEUTIC', x + w + 5, y + 60);
            ctx.fillText('SUB-THERAPEUTIC', x + w + 5, y + 100);
        },

        drawEPS(ctx, x, y, color, label) {
            const time = Date.now() * 0.01;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x + Math.sin(time) * 5, y + Math.cos(time) * 5, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillText(label, x - 50, y + 30);
        },

        drawRebound(ctx, x, y, color, label) {
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.moveTo(x - 50, y);
            ctx.lineTo(x, y - 40);
            ctx.lineTo(x + 50, y + 20);
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.fillText(label, x - 60, y + 50);
        },

        drawDNAVariation(ctx, x, y, color, label) {
            ctx.strokeStyle = color;
            ctx.beginPath();
            for (let i = 0; i < 20; i++) {
                const py = y - 40 + i * 4;
                const px = x + Math.sin(i * 0.5) * 15;
                ctx.lineTo(px, py);
            }
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.fillText(label, x - 60, y + 60);
        },

        drawInteractions(ctx, x, y) {
            ctx.strokeStyle = '#ff4d4d';
            ctx.beginPath();
            ctx.moveTo(x - 40, y - 40);
            ctx.lineTo(x + 40, y + 40);
            ctx.moveTo(x + 40, y - 40);
            ctx.lineTo(x - 40, y + 40);
            ctx.stroke();
            ctx.fillStyle = '#ff4d4d';
            ctx.fillText('Complex Drug Interaction', x - 70, y + 60);
        },

        drawNovel(ctx, x, y, color, label) {
            ctx.strokeStyle = color;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(x, y, 30, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = color;
            ctx.fillText('?', x - 5, y + 5);
            ctx.fillText(label, x - 60, y + 50);
        },

        drawMetabolic(ctx, x, y) {
            ctx.fillStyle = '#ff9900';
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillText('Metabolic Health Impact', x - 70, y + 40);
        },

        drawOfflineSync(ctx, x, y) {
            ctx.fillStyle = '#4fd1c5';
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#4fd1c5';
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillText('PWA: Local Model Synced', x - 70, y + 40);
        }
    };

    window.GreenhouseCognitionMedications = GreenhouseCognitionMedications;
})();
