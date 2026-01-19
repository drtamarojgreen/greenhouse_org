/**
 * @file dopamine_electrophysiology.js
 * @description Electrophysiological components for Dopamine Simulation.
 * Covers Enhancements 46-60.
 */

(function () {
    'use strict';
    const G = window.GreenhouseDopamine || {};
    window.GreenhouseDopamine = G;

    G.electroState = {
        membranePotential: -80, // mV
        threshold: -50,
        channels: {
            girk: 0,
            hcn: 0.1,
            nmda: 0.2,
            ampa: 0.5
        },
        isUpState: false,
        spikeCount: 0
    };

    G.updateElectrophysiology = function () {
        const state = G.state;
        const eState = G.electroState;
        const mState = G.molecularState;
        const sState = G.synapseState;

        // 46. GIRK Channel Activation (by D2/Gi)
        if (state.mode.includes('D2') && state.signalingActive) {
            eState.channels.girk = Math.min(1, eState.channels.girk + 0.01);
        } else {
            eState.channels.girk = Math.max(0, eState.channels.girk - 0.005);
        }

        // 47. HCN Channel Modulation (by cAMP)
        if (mState && mState.campMicrodomains.length > 0) {
            eState.channels.hcn = Math.min(1, eState.channels.hcn + 0.02);
        } else {
            eState.channels.hcn = Math.max(0.1, eState.channels.hcn - 0.005);
        }

        // 52. Resting Membrane Potential & 53. Up-state/Down-state
        let targetPotential = -80;
        if (sState && sState.cleftDA.length > 50) {
            targetPotential = -60; // Influence of DA
        }

        // D1 increases excitability (Up-state), D2 decreases it
        if (state.mode.includes('D1') && state.signalingActive) targetPotential += 15;
        if (state.mode.includes('D2') && state.signalingActive) targetPotential -= 10;

        // GIRK effect (Hyperpolarization)
        targetPotential -= eState.channels.girk * 15;

        // HCN effect (Depolarization)
        targetPotential += eState.channels.hcn * 10;

        // Smooth transition
        eState.membranePotential += (targetPotential - eState.membranePotential) * 0.05;

        // 60. Input Resistance Scaling (Placeholder for visual)
        eState.isUpState = eState.membranePotential > -65;

        // Simple Spike generation
        if (eState.membranePotential > eState.threshold && Math.random() > 0.9) {
            eState.spikeCount++;
            eState.membranePotential = 30; // Spike peak
            setTimeout(() => { eState.membranePotential = -90; }, 10); // AHP
        }
    };

    G.renderElectrophysiology = function (ctx, project) {
        const w = G.width;
        const h = G.height;
        const eState = G.electroState;

        // Render Membrane Potential Graph
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(10, h - 150);
        ctx.lineTo(w / 4, h - 150);
        ctx.stroke();

        // Potential indicator
        const yPos = h - 150 - (eState.membranePotential + 80) * 2;
        ctx.fillStyle = eState.isUpState ? '#ff5555' : '#55ff55';
        ctx.beginPath();
        ctx.arc(w / 8, yPos, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Membrane Potential: ${eState.membranePotential.toFixed(1)} mV`, 10, h - 200);
        ctx.fillText(`State: ${eState.isUpState ? 'UP-STATE' : 'DOWN-STATE'}`, 10, h - 180);
        ctx.fillText(`Spikes: ${eState.spikeCount}`, 10, h - 160);

        // Render Channel Status
        ctx.fillText(`GIRK: ${(eState.channels.girk * 100).toFixed(0)}%`, 10, h - 240);
        ctx.fillText(`HCN: ${(eState.channels.hcn * 100).toFixed(0)}%`, 10, h - 220);
    };
})();
