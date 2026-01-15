// docs/js/synapse_tooltips.js

(function () {
    'use strict';

    const GreenhouseSynapseTooltips = {
        update(tooltipElem, hoveredId, mouseX, mouseY, config, currentLanguage) {
            if (hoveredId) {
                const label = (config.translations[hoveredId] && config.translations[hoveredId][currentLanguage])
                    || config.translations[hoveredId]
                    || hoveredId;

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

            drawLabel(w * 0.5, h * 0.1, config.translations.preSynapticTerminal[lang], 'preSynapticTerminal');
            drawLabel(w * 0.5, h * 0.82, config.translations.postSynapticTerminal[lang], 'postSynapticTerminal');

            ctx.restore();
        }
    };

    window.GreenhouseSynapseTooltips = GreenhouseSynapseTooltips;
})();
