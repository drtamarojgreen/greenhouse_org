/**
 * @file dopamine_clinical.js
 * @description Clinical and pathological states for Dopamine Simulation.
 * Covers Enhancements 81-90.
 */

(function () {
    'use strict';
    const G = window.GreenhouseDopamine || {};
    window.GreenhouseDopamine = G;

    G.clinicalState = {
        oxidativeStress: 0, // 88. Oxidative Stress
        alphaSynuclein: 0, // 87. Alpha-Synuclein Pathology
        inflammation: 0, // 86. Neuroinflammation Effects
        hpaAxisActivity: 0.2, // 90. HPA Axis Interaction
        d2Supersensitivity: 1.0 // 89. D2 Receptor Supersensitivity
    };

    G.updateClinical = function () {
        const state = G.state;
        const cState = G.clinicalState;
        const sState = G.synapseState;

        // 88. Oxidative Stress from DA metabolism
        if (sState && sState.cleftDA.length > 200) {
            cState.oxidativeStress = Math.min(1.0, cState.oxidativeStress + 0.001);
        }

        // 82. L-DOPA Induced Dyskinesia (Pulsatile simulation)
        if (state.mode === 'L-DOPA Pulse') {
            if (state.timer % 500 < 50) {
                // Large burst
                if (sState) sState.releaseRate = 0.8;
            } else {
                if (sState) sState.releaseRate = 0.05;
            }
        }

        // 89. D2 Receptor Supersensitivity (Compensatory)
        if (sState && sState.pathologicalState === 'Parkinsonian') {
            cState.d2Supersensitivity = Math.min(2.0, cState.d2Supersensitivity + 0.0001);
        }
    };

    G.renderClinical = function (ctx, project) {
        const w = G.width;
        const h = G.height;
        const cState = G.clinicalState;

        // Overlay Clinical Info
        ctx.fillStyle = '#ff9999';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`Oxidative Stress: ${(cState.oxidativeStress * 100).toFixed(1)}%`, w - 10, h - 200);
        ctx.fillText(`D2 Supersensitivity: ${cState.d2Supersensitivity.toFixed(2)}x`, w - 10, h - 180);

        if (cState.oxidativeStress > 0.5) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#f00';
            ctx.fillText('CRITICAL OXIDATIVE STRESS', w / 2 + 100, h / 2);
        }
    };
})();
