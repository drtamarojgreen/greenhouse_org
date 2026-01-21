// docs/js/synapse_tooltips.js

(function () {
    'use strict';

    const G = window.GreenhouseSynapseApp || {};
    window.GreenhouseSynapseApp = G;

    G.Tooltips = {
        update(tooltipElem, hoveredId, mouseX, mouseY, config, currentLanguage) {
            if (hoveredId) {
                const lang = currentLanguage || 'en';
                const chem = G.Chemistry;

                let label = '';

                // Intelligent label resolution
                if (chem.neurotransmitters[hoveredId]) {
                    label = chem.neurotransmitters[hoveredId].name[lang];
                } else if (chem.receptors[hoveredId]) {
                    label = chem.receptors[hoveredId].name[lang];
                } else if (config.translations[hoveredId]) {
                    label = config.translations[hoveredId][lang] || config.translations[hoveredId];
                } else {
                    label = hoveredId;
                }

                tooltipElem.style.display = 'block';
                tooltipElem.innerHTML = label;

                // Keep tooltip within bounds
                const xOffset = mouseX + 25;
                const yOffset = mouseY - 25;
                tooltipElem.style.left = `${xOffset}px`;
                tooltipElem.style.top = `${yOffset}px`;
            } else {
                tooltipElem.style.display = 'none';
            }
        },

        drawLabels(ctx, w, h, config, currentLanguage, hoveredId, sidebarHoveredId) {
            const activeId = hoveredId || sidebarHoveredId;
            const lang = currentLanguage || 'en';

            ctx.save();
            ctx.font = `italic 500 11px ${config.font}`;
            ctx.textAlign = 'center';

            // Static Labels (Subtle)
            const drawLabel = (x, y, text, id) => {
                const isActive = activeId === id;
                ctx.fillStyle = isActive ? '#00F2FF' : 'rgba(255,255,255,0.3)';
                ctx.fillText(text.toUpperCase(), x, y);
            };

            if (config.translations.preSynapticTerminal) {
                drawLabel(w * 0.5, h * 0.1, config.translations.preSynapticTerminal[lang], 'preSynapticTerminal');
            }
            if (config.translations.postSynapticTerminal) {
                drawLabel(w * 0.5, h * 0.82, config.translations.postSynapticTerminal[lang], 'postSynapticTerminal');
            }

            ctx.restore();
        }
    };
})();
