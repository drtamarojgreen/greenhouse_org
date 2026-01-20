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
        maoiActive: false, // 95. MAO Inhibitors
        antipsychoticType: 'None', // 96. Antipsychotic Binding Kinetics
        antipsychoticOffRate: 0,
        doseResponse: { concentration: 0, effect: 0, history: [] },
        drugCombination: { active: false, compounds: [] }
    };

    G.updatePharmacology = function () {
        const state = G.state;
        const pState = G.pharmacologyState;
        const sState = G.synapseState;

        // Reset effects if no drug
        if (state.mode === 'D1R Signaling' || state.mode === 'D2R Signaling') {
            pState.datBlockade = 0;
            if (sState) sState.dat.activity = 1.0;
            pState.maoiActive = false;
        }

        // 95. MAO Inhibitors (Selegiline)
        if (state.mode === 'MAOI') {
            pState.maoiActive = true;
            if (sState) sState.maoActivity = 0.05;
        }

        // 96. Antipsychotic Binding Kinetics
        if (state.mode === 'Antipsychotic (Fast-off)') {
            pState.antipsychoticType = 'Fast-off';
            pState.antipsychoticOffRate = 0.5;
        } else if (state.mode === 'Antipsychotic (Slow-off)') {
            pState.antipsychoticType = 'Slow-off';
            pState.antipsychoticOffRate = 0.05;
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

        // 99. Dose-Response Curve Generation
        if (state.signalingActive) {
            pState.doseResponse.concentration = Math.min(1.0, pState.doseResponse.concentration + 0.005);
            pState.doseResponse.effect = G.molecularState ? G.molecularState.darpp32.thr34 : 0;
            if (state.timer % 20 === 0) {
                pState.doseResponse.history.push({
                    c: pState.doseResponse.concentration,
                    e: pState.doseResponse.effect
                });
            }
        } else {
            pState.doseResponse.concentration = 0;
        }

        // 100. Drug Combination Testing
        if (state.mode === 'Drug Combo') {
            pState.drugCombination.active = true;
            // Modeled as simultaneous DAT blockade and D2 agonism
            pState.datBlockade = 0.5;
            if (sState) sState.datActivity = 0.5;
            // D2 effect in clinical state or molecular state
        } else {
            pState.drugCombination.active = false;
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

        // 99. Render Dose-Response Curve
        if (pState.doseResponse.history.length > 2) {
            ctx.strokeStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(w - 150, h - 50);
            ctx.lineTo(w - 50, h - 50); // Axis
            ctx.lineTo(w - 50, h - 150);
            ctx.stroke();

            ctx.strokeStyle = '#0f0';
            ctx.beginPath();
            pState.doseResponse.history.forEach((pt, i) => {
                const x = (w - 150) + pt.c * 100;
                const y = (h - 50) - pt.e * 100;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.fillText('Dose-Response', w - 150, h - 160);
        }
    };
})();
