/**
 * @file inflammation_tooltips.js
 * @description Tooltip definitions and drawing logic for the Inflammation App.
 */

(function () {
    'use strict';

    const GreenhouseInflammationTooltips = {
        definitions: {
            pathogenLoad: 'Initial immune trigger intensity (Infections, toxins).',
            stressCortisol: 'Systemic stress load (Increases BBB permeability).',
            sleepRestoration: 'Clears metabolic waste and restores BBB integrity.',
            nutrientDensity: 'Provides building blocks for resolving inflammation.',
            physicalActivity: 'Induces anti-inflammatory myokine release (IL-10).',
            nsaids: 'Non-steroidal anti-inflammatory drugs (Pain/Fever relief).',
            corticosteroids: 'Broad immune suppression and glial dampening.',
            biologics: 'Targeted anti-TNF antibodies for severe flares.',
            mode_macro: 'View the whole brain and regional heatmaps.',
            mode_micro: 'View cellular networks, glia, and rolling leukocytes.',
            mode_mol: 'View cytokines, neurotransmitters, and cell membranes.',
            metric_tnf: 'Tumor Necrosis Factor alpha: Primary pro-inflammatory driver.',
            metric_il10: 'Interleukin 10: Primary anti-inflammatory orchestrator.',
            metric_bbb: 'Blood-Brain Barrier Integrity: Barrier protecting brain from pathogens.',
            card_0: 'The five classical signs of inflammation in tissue.',
            card_1: 'Comparison of short-term vs long-term immune responses.',
            card_2: 'The delicate balance between pro- and anti-inflammatory signals.',
            card_3: 'How the blood-brain barrier fails during chronic signaling.',
            card_4: 'The role of cortisol and nutrition in the inflammatory pathway.',
            card_5: 'Biological mechanisms that actively terminate the inflammatory response.'
        },

        draw(ctx, app, x, y) {
            const el = app.ui.hoveredElement;
            if (!el) return;

            const title = el.label || 'Unknown';
            const desc = el.description || this.definitions[el.id] || '';

            ctx.font = 'bold 12px sans-serif';
            const titleMetrics = ctx.measureText(title);
            ctx.font = '11px sans-serif';
            const descMetrics = ctx.measureText(desc);

            const padding = 12;
            const tw = Math.max(titleMetrics.width, descMetrics.width) + padding * 2;
            const th = desc ? 42 : 28;

            const tx = Math.min(app.canvas.width - tw - 10, x + 15);
            const ty = y - th - 10;

            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.strokeStyle = '#4ca1af';
            ctx.lineWidth = 1.5;

            if (app.roundRect) {
                app.roundRect(ctx, tx, ty, tw, th, 8, true, true);
            } else {
                ctx.fillRect(tx, ty, tw, th);
                ctx.strokeRect(tx, ty, tw, th);
            }

            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';

            ctx.fillStyle = '#4ca1af';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(title, tx + padding, ty + 18);

            if (desc) {
                ctx.fillStyle = '#fff';
                ctx.font = '11px sans-serif';
                ctx.fillText(desc, tx + padding, ty + 34);
            }
            ctx.restore();
        }
    };

    window.GreenhouseInflammationTooltips = GreenhouseInflammationTooltips;
})();
