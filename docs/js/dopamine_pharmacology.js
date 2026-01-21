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
        selectedDrug: null,
        datBlockade: 0,
        vesicleDepletion: 0,
        maoiActive: false, // 95. MAO Inhibitors
        antipsychoticType: 'None', // 96. Antipsychotic Binding Kinetics
        antipsychoticOffRate: 0,
        drugOccupancy: 0,
        doseResponse: { concentration: 0, effect: 0, history: [] },
        drugCombination: { active: false, compounds: [] }
    };

    G.updatePharmacology = function () {
        const state = G.state;
        const pState = G.pharmacologyState;
        const sState = G.synapseState;

        // Reset effects base
        pState.datBlockade = 0;
        pState.maoiActive = false;

        // 95. MAO Inhibitors (Selegiline)
        if (state.mode === 'MAOI' || state.scenarios.maoi) {
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
        if (state.mode === 'Cocaine' || state.scenarios.cocaine) {
            pState.datBlockade = 0.95;
            if (sState) sState.dat.activity = 0.05;
        }

        // 94. Amphetamine Mechanism
        if (state.mode === 'Amphetamine' || state.scenarios.amphetamine) {
            pState.datBlockade = 1.0;
            if (sState) {
                sState.dat.activity = -0.5; // Reversal of DAT (efflux)
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
            if (sState) sState.dat.activity = 0.5;
            // D2 effect in clinical state or molecular state
        } else {
            pState.drugCombination.active = false;
        }

        // 97. Partial Agonism (Aripiprazole)
        // Partial agonists act as agonists in low DA, but antagonists in high DA
        if (state.mode === 'Antipsychotic (Partial)' || (pState.selectedDrug && pState.selectedDrug.name === 'Aripiprazole')) {
            const daLevel = sState ? sState.cleftDA.length : 0;
            if (daLevel < 20) {
                // Acts as agonist
                if (G.clinicalState) G.clinicalState.d2Supersensitivity = 1.2;
            } else {
                // Acts as antagonist
                if (G.clinicalState) G.clinicalState.d2Supersensitivity = 0.8;
            }
        }

        // 96. Antipsychotic Binding Kinetics
        if (pState.antipsychoticType !== 'None') {
            const offRate = pState.antipsychoticOffRate;
            // Occupancy increases with concentration, decreases with off-rate
            pState.drugOccupancy = Math.min(1.0, pState.drugOccupancy + 0.05 - offRate * 0.1);
        } else {
            pState.drugOccupancy *= 0.9;
        }
    };

    G.renderPharmacology = function (ctx, project) {
        const state = G.state;
        const cam = state.camera;
        const w = G.width;
        const h = G.height;
        const pState = G.pharmacologyState;

        // Overlay Pharmacology Info
        ctx.fillStyle = '#99ff99';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`DAT Blockade: ${(pState.datBlockade * 100).toFixed(0)}%`, 10, h - 260);

        if (state.mode === 'Amphetamine' || state.scenarios.amphetamine) {
            ctx.fillText('Mechanism: DAT Efflux (Reversal)', 10, h - 280);
        } else if (state.mode === 'Cocaine' || state.scenarios.cocaine) {
            ctx.fillText('Mechanism: High-affinity Blockade', 10, h - 280);
        }

        if (pState.drugOccupancy > 0.1) {
            ctx.fillStyle = '#ffaa00';
            ctx.fillText(`Receptor Occupancy: ${(pState.drugOccupancy * 100).toFixed(1)}%`, 10, h - 300);

            // 96. Visual indicators of bound drug (small dots on receptors)
            G.state.receptors.forEach(r => {
                if (r.type.startsWith('D2')) {
                    const p = project(r.x, r.y, r.z, cam, { width: w, height: h, near: 10, far: 5000 });
                    if (p.scale > 0) {
                        ctx.fillStyle = '#ff0000';
                        ctx.beginPath();
                        ctx.arc(p.x + 10*p.scale, p.y - 10*p.scale, 3*p.scale, 0, Math.PI*2);
                        ctx.fill();
                    }
                }
            });
        }

        // 99. Render Dose-Response Curve
        if (pState.doseResponse.history.length > 2) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(w - 160, h - 170, 120, 130);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(w - 150, h - 50);
            ctx.lineTo(w - 50, h - 50); // X-axis
            ctx.moveTo(w - 150, h - 50);
            ctx.lineTo(w - 150, h - 150); // Y-axis
            ctx.stroke();

            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            pState.doseResponse.history.forEach((pt, i) => {
                const x = (w - 150) + pt.c * 100;
                const y = (h - 50) - pt.e * 100;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.fillText('Dose-Response', w - 150, h - 155);
            ctx.fillText('Conc →', w - 90, h - 35);
        }
    };
})();
