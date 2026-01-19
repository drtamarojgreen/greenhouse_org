/**
 * @file dopamine_controls.js
 * @description UI controls for Dopamine Simulation.
 */

(function () {
    'use strict';
    const G = window.GreenhouseDopamine || {};
    window.GreenhouseDopamine = G;

    G.createUI = function (container) {
        const controls = document.createElement('div');
        controls.className = 'dopamine-controls';

        const modes = ['D1R Signaling', 'D2R Signaling', 'GTP/GDP Exchange', 'cAMP Release'];
        modes.forEach(mode => {
            const btn = document.createElement('button');
            btn.className = 'dopamine-btn';
            btn.innerText = mode;
            btn.onclick = () => {
                console.log(`Switching to ${mode}`);
                G.state.mode = mode;
            };
            controls.appendChild(btn);
        });

        container.appendChild(controls);

        const info = document.createElement('div');
        info.className = 'dopamine-info';
        info.id = 'dopamine-info-display';
        info.innerHTML = '<strong>Dopamine Signaling</strong><br>Select a mode to visualize pathway.';
        container.appendChild(info);
    };
})();
