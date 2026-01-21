// docs/js/synapse_molecular.js

(function () {
    'use strict';

    const G = window.GreenhouseSynapseApp || {};
    window.GreenhouseSynapseApp = G;

    G.Molecular = {
        drawSNARE(ctx, x, y, progress) {
            ctx.save();
            ctx.strokeStyle = '#ff9900';
            ctx.lineWidth = 2;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(x - 10, y);
            ctx.quadraticCurveTo(x, y - 20 * progress, x + 10, y);
            ctx.stroke();
            ctx.restore();
        },

        drawLipidBilayer(ctx, x, y, width, isPost) {
            ctx.save();
            ctx.strokeStyle = isPost ? '#2c3e50' : '#707870';
            ctx.lineWidth = 4;
            // Fluid-mosaic motion simulation
            const offset = Math.sin(Date.now() / 1000) * 2;
            ctx.beginPath();
            ctx.moveTo(x, y + offset);
            ctx.lineTo(x + width, y - offset);
            ctx.stroke();
            ctx.restore();
        }
    };
})();
