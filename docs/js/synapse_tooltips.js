// docs/js/synapse_tooltips.js

(function () {
    'use strict';

    const G = window.GreenhouseSynapseApp || {};
    window.GreenhouseSynapseApp = G;

    G.Tooltips = {
        update(el, hoveredId, mx, my, config, lang) {
            if (!hoveredId) {
                el.style.display = 'none';
                return;
            }

            el.style.display = 'block';
            el.style.left = (mx + 20) + 'px';
            el.style.top = (my + 20) + 'px';
            el.innerHTML = `<strong>${config.translations[hoveredId][lang]}</strong>`;
        },

        drawLabels(ctx, w, h, config, lang, h1, h2) {
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = 'italic 10px sans-serif';
            ctx.fillText(config.translations.preSynapticTerminal[lang].toUpperCase(), w * 0.5, h * 0.1);
        }
    };
})();
