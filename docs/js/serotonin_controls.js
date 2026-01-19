/**
 * @file serotonin_controls.js
 * @description UI controls for Serotonin Simulation.
 */

(function () {
    'use strict';
    const G = window.GreenhouseSerotonin || {};
    window.GreenhouseSerotonin = G;

    G.createUI = function (container) {
        const controls = document.createElement('div');
        controls.className = 'serotonin-controls';

        const views = ['5-HT1A Complex', 'Ligand Pocket', 'Lipid Interactions', 'Extracellular Loop'];
        views.forEach(view => {
            const btn = document.createElement('button');
            btn.className = 'serotonin-btn';
            btn.innerText = view;
            btn.onclick = () => {
                console.log(`Switching to ${view}`);
            };
            controls.appendChild(btn);
        });

        container.appendChild(controls);

        const info = document.createElement('div');
        info.className = 'serotonin-info';
        info.innerHTML = '<strong>Serotonin Structural Model</strong><br>Visualization of 5-HT1A in complex with Gi.';
        container.appendChild(info);
    };
})();
