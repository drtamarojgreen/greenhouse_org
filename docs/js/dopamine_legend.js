/**
 * @file dopamine_legend.js
 * @description Legend for Dopamine Simulation.
 */

(function () {
    'use strict';
    const G = window.GreenhouseDopamine || {};
    window.GreenhouseDopamine = G;

    G.initLegend = function (container) {
        const legend = document.createElement('div');
        legend.className = 'dopamine-legend';
        legend.style.position = 'absolute';
        legend.style.bottom = '10px';
        legend.style.right = '10px';
        legend.style.background = 'rgba(0, 0, 0, 0.7)';
        legend.style.padding = '10px';
        legend.style.borderRadius = '5px';
        legend.style.color = '#fff';
        legend.style.fontSize = '12px';
        legend.style.pointerEvents = 'none';
        legend.style.zIndex = '100';

        legend.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">Legend</div>
            <div style="display: flex; align-items: center; margin-bottom: 3px;">
                <div style="width: 12px; height: 12px; background: #ff4d4d; border-radius: 50%; margin-right: 5px;"></div> D1 Receptor (Gs)
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 3px;">
                <div style="width: 12px; height: 12px; background: #4d79ff; border-radius: 50%; margin-right: 5px;"></div> D2 Receptor (Gi)
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 3px;">
                <div style="width: 12px; height: 12px; background: #00ff00; border-radius: 50%; margin-right: 5px;"></div> Dopamine (DA)
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 3px;">
                <div style="width: 12px; height: 12px; background: #ff9999; border-radius: 50%; margin-right: 5px;"></div> Gs Protein
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 3px;">
                <div style="width: 12px; height: 12px; background: #9999ff; border-radius: 50%; margin-right: 5px;"></div> Gi Protein
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 3px;">
                <div style="width: 12px; height: 2px; border: 1px solid #ffff99; border-radius: 50%; margin-right: 5px;"></div> cAMP Microdomain
            </div>
            <div style="margin-top: 5px; font-style: italic;">Structures show 7-TM helices, IL3, and C-tail.</div>
        `;

        container.appendChild(legend);
    };

    G.renderLegend = function (ctx) {
        // Legend is DOM-based, but we could add canvas-specific annotations here
    };
})();
