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

        // Toggle Buttons for Physiological States
        const states = [
            { name: 'Depression', toggle: () => { G.Transport.tphActivity = G.Transport.tphActivity === 1.0 ? 0.3 : 1.0; } },
            { name: 'Inflammation', toggle: () => { G.Transport.inflammationActive = !G.Transport.inflammationActive; } },
            { name: 'Pineal Mode', toggle: () => { G.Transport.pinealMode = !G.Transport.pinealMode; } },
            { name: 'Serotonin Syndrome', toggle: () => {
                if (!G.ssActive) {
                    G.Transport.sertActivity = 0;
                    G.Transport.maoActivity = 0;
                    G.ssActive = true;
                } else {
                    G.Transport.sertActivity = 1.0;
                    G.Transport.maoActivity = 1.0;
                    G.ssActive = false;
                }
            }}
        ];

        states.forEach(state => {
            const btn = document.createElement('button');
            btn.className = 'serotonin-btn';
            btn.innerText = `Toggle ${state.name}`;
            btn.onclick = () => {
                state.toggle();
                btn.style.borderColor = btn.style.borderColor === 'red' ? '#4a5568' : 'red';
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
