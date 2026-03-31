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
        highlightedItem: null,
        items: [
            { label: '5-HT1A', color: '#E0E0E0', desc: 'Inhibitory Gi/o coupled' },
            { label: '5-HT1D', color: '#A0AEC0', desc: 'Presynaptic Autoreceptor' },
            { label: '5-HT2A', color: '#E0E0E0', desc: 'Excitatory Gq coupled' },
            { label: '5-HT3', color: '#FFFFFF', desc: 'Ionotropic Na+/K+' },
            { label: '5-HT4/7', color: '#E0E0E0', desc: 'Gs Coupled' },
            { label: 'Serotonin', color: '#E0E0E0', desc: 'Endogenous Agonist' },
            { label: 'LSD', color: '#D0D0D0', desc: 'Psychedelic Agonist' },
            { label: 'SSRI', color: '#FFFFFF', desc: 'Reuptake Inhibitor' }
        ],

        renderLegend(ctx, w, h) {
            if (!this.visible || !G.showInteractiveLegend) return;
            const legendW = 200;
            const legendH = this.items.length * 22 + 40;
            const startX = 10;
            const startY = h - legendH - 10;

            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.strokeStyle = '#4a5568';
            ctx.lineWidth = 1;
            ctx.fillRect(startX, startY, legendW, legendH);
            ctx.strokeRect(startX, startY, legendW, legendH);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('INTERACTIVE LEGEND', startX + 10, startY + 20);

            this.items.forEach((item, i) => {
                const y = startY + 45 + i * 22;

                // Interaction: Highlight if hovered or clicked
                const isHighlighted = (this.highlightedItem === item.label);

                // Legend Pulsation (#58)
                let pulseScale = 1.0;
                if (G.state.receptors) {
                    const isBound = G.state.receptors.some(r => r.type.startsWith(item.label) && r.state !== 'Inactive');
                    if (isBound) {
                        pulseScale = 1.1 + Math.sin(G.state.timer * 0.1) * 0.1;
                    }
                }

                if (isHighlighted) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.fillRect(startX + 5, y - 15, legendW - 10, 20);
                }

                ctx.fillStyle = item.color;
                ctx.beginPath();
                ctx.arc(startX + 15, y - 5, 6 * pulseScale, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = isHighlighted ? '#E0E0E0' : '#fff';
                ctx.font = isHighlighted ? 'bold 11px Arial' : '11px Arial';
                ctx.fillText(item.label, startX + 30, y);

                // Show description if highlighted
                if (isHighlighted) {
                    ctx.fillStyle = '#aaa';
                    ctx.font = '9px Arial';
                    ctx.fillText(item.desc, startX + 10, y + 10);
                }
            });
        },

        checkInteraction(mx, my, w, h) {
            if (!this.visible || !G.showInteractiveLegend) return false;
            const legendW = 200;
            const legendH = this.items.length * 22 + 40;
            const startX = 10;
            const startY = h - legendH - 10;

            if (mx >= startX && mx <= startX + legendW && my >= startY && my <= startY + legendH) {
                // Determine which item
                const relativeY = my - (startY + 30);
                const index = Math.floor(relativeY / 22);
                if (index >= 0 && index < this.items.length) {
                    this.highlightedItem = this.items[index].label;
                    return true;
                }
            }
            this.highlightedItem = null;
            return false;
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
