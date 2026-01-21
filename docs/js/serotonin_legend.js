/**
 * @file serotonin_legend.js
 * @description Legend for Serotonin Simulation.
 */

(function () {
    'use strict';
    const G = window.GreenhouseSerotonin || {};
    window.GreenhouseSerotonin = G;

    G.Legend = {
        visible: true,
        items: [
            { label: '5-HT1A', color: '#4d79ff', desc: 'Inhibitory Gi/o coupled' },
            { label: '5-HT1D', color: '#3399ff', desc: 'Presynaptic Autoreceptor' },
            { label: '5-HT2A', color: '#ff4d4d', desc: 'Excitatory Gq coupled' },
            { label: '5-HT3', color: '#4dff4d', desc: 'Ionotropic Na+/K+' },
            { label: '5-HT4/7', color: '#ff9900', desc: 'Gs Coupled' },
            { label: 'Serotonin', color: '#00ffcc', desc: 'Endogenous Agonist' },
            { label: 'LSD', color: '#ff00ff', desc: 'Psychedelic Agonist' },
            { label: 'SSRI', color: '#ffffff', desc: 'Reuptake Inhibitor' }
        ],

        renderLegend(ctx, w, h) {
            if (!this.visible) return;
            const legendW = 180;
            const legendH = this.items.length * 20 + 30;

            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(10, h - legendH - 10, legendW, legendH);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('INTERACTIVE LEGEND', 20, h - legendH);

            this.items.forEach((item, i) => {
                const y = h - legendH + 25 + i * 20;
                ctx.fillStyle = item.color;
                ctx.beginPath();
                ctx.arc(25, y - 4, 5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#fff';
                ctx.font = '10px Arial';
                ctx.fillText(item.label, 40, y);
            });
        }
    };

    const oldRender = G.render;
    G.render = function() {
        if (oldRender) oldRender.call(G);
        const ctx = G.ctx;
        const w = G.width;
        const h = G.height;
        if (G.Legend) G.Legend.renderLegend(ctx, w, h);
    };

})();
