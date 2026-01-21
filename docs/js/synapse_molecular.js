// docs/js/synapse_molecular.js

(function () {
    'use strict';

    const GreenhouseSynapseMolecular = {
        scaffoldingProteins: [
            { id: 'psd95', x: 0.4, y: 0.7, size: 8 },
            { id: 'psd95', x: 0.5, y: 0.72, size: 8 },
            { id: 'psd95', x: 0.6, y: 0.7, size: 8 }
        ],

        init() {
            console.log("Synapse Molecular: Initialized.");
        },

        drawScaffolding(ctx, w, h) {
            // Proposal 16: Visualize recruitment of scaffolding proteins (e.g., PSD-95)
            ctx.fillStyle = '#FFD700'; // Gold
            this.scaffoldingProteins.forEach(p => {
                ctx.beginPath();
                ctx.rect(w * p.x - p.size / 2, h * p.y, p.size, p.size);
                ctx.fill();
            });
        },

        drawSNAREComplex(ctx, w, h, frame) {
            // Proposal 7: Visualize detailed structure of the SNARE complex
            ctx.strokeStyle = '#ADFF2F';
            ctx.lineWidth = 2;
            const centerX = w * 0.5;
            const bulbY = h * 0.4;

            ctx.beginPath();
            ctx.moveTo(centerX - 10, bulbY);
            ctx.quadraticCurveTo(centerX, bulbY + 20 * Math.sin(frame * 0.1), centerX + 10, bulbY);
            ctx.stroke();
        },

        drawLipidBilayer(ctx, w, h) {
            // Proposal 33: Detailed structure of the lipid bilayer
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            const surfaceY = h * 0.68;
            for (let x = 0; x < w; x += 10) {
                // Heads
                ctx.beginPath(); ctx.arc(x, surfaceY, 3, 0, Math.PI * 2); ctx.stroke();
                // Tails
                ctx.beginPath(); ctx.moveTo(x, surfaceY + 3); ctx.lineTo(x, surfaceY + 10); ctx.stroke();
            }
            ctx.restore();
        }
    };

    window.GreenhouseSynapseMolecular = GreenhouseSynapseMolecular;
})();
