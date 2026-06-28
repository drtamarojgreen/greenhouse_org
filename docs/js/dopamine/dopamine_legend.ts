/**
 * @file dopamine_legend.js
 * @description Legend for Dopamine Simulation with detailed visual mapping.
 */

(function () {
    'use strict';
    const G = window.GreenhouseDopamine || {};
    window.GreenhouseDopamine = G;

    G.initLegend = function (container) {
        const legend = document.createElement('div');
        legend.className = 'dopamine-panel-section dopamine-legend-compact';

        legend.innerHTML = `
            <div class="dopamine-panel-header">Visual Mapping Guide</div>

            <div style="margin-bottom: 6px;">
                <div style="font-weight: bold; margin-bottom: 2px; color: #aaa; font-size: 9px;">Receptors & G-Proteins</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="background: #E0E0E0; border-radius: 50%;"></div> D1-like Receptor</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="background: #D0D0D0; border-radius: 50%;"></div> D2-like Receptor</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="background: #E0E0E0; clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"></div> Gs Protein</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="background: #D0D0D0; border-radius: 20%;"></div> Gi Protein</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="background: #A0AEC0; border-radius: 50%; border: 1px solid #FFF;"></div> Gq Protein</div>
            </div>

            <div style="margin-bottom: 6px;">
                <div style="font-weight: bold; margin-bottom: 2px; color: #aaa; font-size: 9px;">Dopamine & Dynamics</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="background: #E0E0E0; border-radius: 50%;"></div> Dopamine Particle</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="border: 1px solid #E0E0E0; border-radius: 50%;"></div> Phasic Burst</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="background: #FFFFFF; border-radius: 2px;"></div> Vesicle (RRP)</div>
            </div>

            <div style="margin-bottom: 6px;">
                <div style="font-weight: bold; margin-bottom: 2px; color: #aaa; font-size: 9px;">Striatal Anatomy</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="background: #A0AEC0; border-radius: 2px;"></div> Striosome Neuron</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="background: rgba(160, 174, 192, 0.1); border: 1px solid rgba(160, 174, 192, 0.3);"></div> Matrix Lattice</div>
            </div>

            <div style="margin-bottom: 6px;">
                <div style="font-weight: bold; margin-bottom: 2px; color: #aaa; font-size: 9px;">Cellular Interactions</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-bottom: 8px solid #A0AEC0; background: transparent;"></div> PV+ Interneuron</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="border: 1px solid rgba(160, 174, 192, 0.4); border-radius: 50%;"></div> Astrocyte</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="border: 1px solid #FFFFFF;"></div> AP Back-propagation</div>
            </div>
        `;

        if (G.rightPanel) {
            G.rightPanel.appendChild(legend);
        } else {
            container.appendChild(legend);
        }
    };

    G.renderLegend = function (ctx) {
        // Static UI legend managed via DOM
    };
})();
