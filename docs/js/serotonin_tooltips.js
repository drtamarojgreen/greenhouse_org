/**
 * @file serotonin_tooltips.js
 * @description Contextual tooltips for the Serotonin simulation.
 */

(function () {
    'use strict';

    const G = window.GreenhouseSerotonin || {};
    window.GreenhouseSerotonin = G;

    G.Tooltips = {
        tooltipData: {
            '5-HT1A': 'Inhibitory autoreceptor; regulates mood and anxiety.',
            '5-HT2A': 'Excitatory; target of psychedelics and atypical antipsychotics.',
            '5-HT2C': 'Regulates appetite and energy balance.',
            '5-HT3': 'Ionotropic channel; involved in nausea and vomiting.',
            'SERT': 'Serotonin transporter; target of SSRIs like Prozac.',
            'MAO-A': 'Monoamine oxidase A; degrades serotonin.',
            'TPH2': 'Tryptophan hydroxylase 2; rate-limiting synthesis enzyme.'
        },

        renderTooltips(ctx, w, h) {
            if (!G.hoverDistance || G.viewMode === '2D-Closeup') return;
            // Hover logic is handled in serotonin.js via updateContextualCursor
            // If hoverDistance is set, we show info about the target if known
            // This is a placeholder for more complex tooltip rendering
        }
    };

    const oldRender = G.render;
    G.render = function() {
        if (oldRender) oldRender.call(G);
        if (G.Tooltips.renderTooltips) G.Tooltips.renderTooltips(G.ctx, G.width, G.height);
    };

})();
