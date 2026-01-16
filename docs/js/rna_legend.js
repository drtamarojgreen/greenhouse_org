/**
 * @file rna_legend.js
 * @description Separate legend component for the RNA repair simulation.
 */

(function() {
    'use strict';

    console.log("RNA Legend script loaded.");

    const RNALegend = {
        /**
         * @function update
         * @description Draws the legend on the provided canvas context.
         * @param {CanvasRenderingContext2D} ctx
         * @param {number} width
         * @param {number} height
         * @param {Object} colors
         */
        update: function(ctx, width, height, colors) {
            const startX = 20;
            const startY = height - 100;
            const itemHeight = 25;

            ctx.save();
            // Reset transformation for legend so it stays fixed
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(startX - 10, startY - 30, 220, 110);
            ctx.strokeStyle = '#4a5568';
            ctx.strokeRect(startX - 10, startY - 30, 220, 110);

            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('RNA Repair Legend:', startX, startY - 10);

            const items = [
                { color: colors.METHYL, text: 'Methylation (Damage)' },
                { color: colors.BACKBONE, text: 'Phosphodiester Backbone' },
                { color: colors.ENZYME, text: 'Repair Enzymes', stroke: colors.GLOW }
            ];

            items.forEach((item, i) => {
                ctx.beginPath();
                ctx.arc(startX + 10, startY + i * itemHeight, 6, 0, Math.PI * 2);
                ctx.fillStyle = item.color;
                ctx.fill();
                if (item.stroke) {
                    ctx.strokeStyle = item.stroke;
                    ctx.setLineDash([2, 2]);
                    ctx.stroke();
                }
                ctx.fillStyle = '#cbd5e0';
                ctx.font = '12px Arial';
                ctx.fillText(item.text, startX + 25, startY + i * itemHeight + 5);
            });

            ctx.restore();
        }
    };

    window.Greenhouse = window.Greenhouse || {};
    window.Greenhouse.RNALegend = RNALegend;

})();
