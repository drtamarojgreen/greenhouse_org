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
        controls.style.flexWrap = 'wrap';
        controls.style.maxWidth = '600px';

        const modes = [
            'D1R Signaling', 'D2R Signaling', 'Heteromer',
            'Parkinsonian', 'L-DOPA Pulse',
            'Cocaine', 'Amphetamine', 'Phasic Burst',
            'Schizophrenia', 'ADHD', 'Drug Combo',
            'Alpha-Synuclein', 'Neuroinflammation', 'MAOI',
            'Antipsychotic (Fast-off)', 'Antipsychotic (Slow-off)'
        ];
        modes.forEach(mode => {
            const btn = document.createElement('button');
            btn.className = 'dopamine-btn';
            btn.innerText = mode;
            btn.onclick = () => {
                console.log(`Switching to ${mode}`);
                G.state.mode = mode;
                G.state.signalingActive = true;

                // Special handlers
                if (mode === 'Parkinsonian') {
                    if (G.synapseState) G.synapseState.pathologicalState = 'Parkinsonian';
                } else if (mode === 'D1R Signaling' || mode === 'D2R Signaling') {
                    if (G.synapseState) G.synapseState.pathologicalState = 'Healthy';
                }
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
