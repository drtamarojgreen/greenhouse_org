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
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="background: #ff4d4d;"></div> D1-like Receptor</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="background: #4d79ff;"></div> D2-like Receptor</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="background: #ff9999;"></div> Gs Protein</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="background: #9999ff;"></div> Gi Protein</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="background: #99ff99;"></div> Gq Protein (Heteromers)</div>
            </div>

            <div style="margin-bottom: 6px;">
                <div style="font-weight: bold; margin-bottom: 2px; color: #aaa; font-size: 9px;">Dopamine & Dynamics</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="background: #00ff00;"></div> Dopamine Particle</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="border: 1px solid #00ff00;"></div> Phasic Burst</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="background: #ffff00; border-radius: 2px;"></div> Vesicle (RRP)</div>
            </div>

            <div style="margin-bottom: 6px;">
                <div style="font-weight: bold; margin-bottom: 2px; color: #aaa; font-size: 9px;">Striatal Anatomy</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="background: #8B4513;"></div> Striosome Neuron</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="background: rgba(0, 255, 255, 0.1); border: 1px solid rgba(0, 255, 255, 0.3);"></div> Matrix Lattice</div>
            </div>

            <div style="margin-bottom: 6px;">
                <div style="font-weight: bold; margin-bottom: 2px; color: #aaa; font-size: 9px;">Cellular Interactions</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-bottom: 8px solid #ff00ff; background: transparent;"></div> PV+ Interneuron</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="border: 1px solid rgba(0, 255, 255, 0.4);"></div> Astrocyte</div>
                <div class="dopamine-legend-item"><div class="dopamine-legend-swatch" style="border: 1px solid #ffff00;"></div> AP Back-propagation</div>
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
