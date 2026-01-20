/**
 * @file dopamine_pharmacology.js
 * @description Pharmacology and drug discovery for Dopamine Simulation.
 * Covers Enhancements 91-100.
 */

(function () {
    'use strict';
    const G = window.GreenhouseDopamine || {};
    window.GreenhouseDopamine = G;

    G.pharmacologyState = {
        activeDrugs: [],
        datBlockade: 0,
        vesicleDepletion: 0,
        doseResponse: { concentration: 0, effect: 0 }
    };

    G.updatePharmacology = function () {
        const state = G.state;
        const pState = G.pharmacologyState;
        const sState = G.synapseState;

        // Reset effects if no drug
        if (state.mode === 'D1R Signaling' || state.mode === 'D2R Signaling') {
            pState.datBlockade = 0;
            if (sState) sState.datActivity = 1.0;
        }

        // 93. Cocaine Simulation
        if (state.mode === 'Cocaine') {
            pState.datBlockade = 0.95;
            if (sState) sState.datActivity = 0.05;
        }

        // 94. Amphetamine Mechanism
        if (state.mode === 'Amphetamine') {
            pState.datBlockade = 1.0;
            if (sState) {
                sState.datActivity = -0.5; // Reversal of DAT (efflux)
                // Competitive inhibition and reversal
                if (state.timer % 10 === 0) {
                     sState.cleftDA.push({
                        x: (Math.random() - 0.5) * 50,
                        y: -170,
                        z: (Math.random() - 0.5) * 50,
                        vx: (Math.random() - 0.5) * 2,
                        vy: Math.random() * 2 + 1,
                        vz: (Math.random() - 0.5) * 2,
                        life: 200
                    });
                }
            }
        }
    };

    G.renderPharmacology = function (ctx, project) {
        const w = G.width;
        const h = G.height;
        const pState = G.pharmacologyState;

        // Overlay Pharmacology Info
        ctx.fillStyle = '#99ff99';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`DAT Blockade: ${(pState.datBlockade * 100).toFixed(0)}%`, 10, h - 260);

        if (G.state.mode === 'Amphetamine') {
            ctx.fillText('Mechanism: DAT Efflux (Reversal)', 10, h - 280);
        } else if (G.state.mode === 'Cocaine') {
            ctx.fillText('Mechanism: High-affinity Blockade', 10, h - 280);
        }
    };
})();
