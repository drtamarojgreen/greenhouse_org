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
                let subtext = '';

                // Intelligent label resolution (Enhancement #25, #27, #31, #35)
                if (chem.neurotransmitters[hoveredId]) {
                    const nt = chem.neurotransmitters[hoveredId];
                    label = nt.name[lang];
                    subtext = `<div style="font-size: 10px; color: #aaa; margin-top: 5px;">
                        MW: ${nt.molecularWeight}<br>
                        pKa: ${nt.pKa}
                    </div>`;
                } else if (chem.receptors[hoveredId]) {
                    const r = chem.receptors[hoveredId];
                    label = r.name[lang];
                    subtext = `<div style="font-size: 10px; color: #aaa; margin-top: 5px;">
                        Stoichiometry: ${r.stoichiometry}<br>
                        PDB: ${r.pdbId}
                    </div>`;
                } else if (chem.transporters[hoveredId]) {
                    const t = chem.transporters[hoveredId];
                    label = t.name;
                    subtext = `<div style="font-size: 10px; color: #aaa; margin-top: 5px;">
                        Targets: ${t.targets.join(', ')}<br>
                        Helices: ${t.transmembrane_helices || '12'}
                    </div>`;
                } else if (chem.ions[hoveredId]) {
                    const i = chem.ions[hoveredId];
                    label = i.name[lang];
                    subtext = `<div style="font-size: 10px; color: #aaa; margin-top: 5px;">
                        Charge: ${i.charge}<br>
                        Effect: ${i.effect}
                    </div>`;
                } else if (config.translations[hoveredId]) {
                    label = config.translations[hoveredId][lang] || config.translations[hoveredId];
                    // Special subtext for specific IDs
                    if (hoveredId === 'mitochondria') {
                        subtext = `<div style="font-size: 10px; color: #aaa; margin-top: 5px;">
                            ATP generation via oxidative<br>phosphorylation.
                        </div>`;
                    } else if (hoveredId === 'astrocyte') {
                        subtext = `<div style="font-size: 10px; color: #aaa; margin-top: 5px;">
                            Tripartite synapse support &<br>glutamate clearance.
                        </div>`;
                    } else if (hoveredId === 'psd95') {
                        subtext = `<div style="font-size: 10px; color: #aaa; margin-top: 5px;">
                            Scaffolding protein organizing<br>receptor clusters.
                        </div>`;
                    } else if (hoveredId === 'snare') {
                        subtext = `<div style="font-size: 10px; color: #aaa; margin-top: 5px;">
                            Molecular machinery for<br>vesicle-membrane fusion.
                        </div>`;
                    }
                } else {
                    label = hoveredId;
                }

                tooltipElem.style.display = 'block';
                tooltipElem.innerHTML = `<div style="font-weight: bold; color: #00F2FF;">${label}</div>${subtext}`;

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
