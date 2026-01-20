/**
 * @file dopamine_plasticity.js
 * @description Neuroplasticity and long-term changes for Dopamine Simulation.
 * Covers Enhancements 61-70.
 */

(function () {
    'use strict';
    const G = window.GreenhouseDopamine || {};
    window.GreenhouseDopamine = G;

    G.plasticityState = {
        synapticStrength: 1.0,
        spineDensity: 1.0,
        ecbLevels: 0, // 63. eCB signaling
        geneExpression: { cFos: 0, jun: 0 }, // 66. IEG Induction
        bdnfLevels: 0.5, // 70. BDNF Interaction
        lastPlasticityUpdate: 0
    };

    G.updatePlasticity = function () {
        const state = G.state;
        const pState = G.plasticityState;
        const mState = G.molecularState;

        // 61-62. LTP/LTD Modeling
        if (state.signalingActive) {
            if (state.mode.includes('D1')) {
                // LTP for D1-MSN
                pState.synapticStrength = Math.min(2.0, pState.synapticStrength + 0.001);
            } else if (state.mode.includes('D2')) {
                // LTD for D2-MSN
                pState.synapticStrength = Math.max(0.5, pState.synapticStrength - 0.0005);
            }
        }

        // 63. Endocannabinoid (eCB) Signaling
        if (state.signalingActive && state.mode.includes('D2')) {
            pState.ecbLevels = Math.min(1.0, pState.ecbLevels + 0.01);
        } else {
            pState.ecbLevels *= 0.99;
        }

        // 64. Dendritic Spine Remodeling
        if (pState.synapticStrength > 1.5) {
            pState.spineDensity = Math.min(2.0, pState.spineDensity + 0.0001);
        } else if (pState.synapticStrength < 0.7) {
            pState.spineDensity = Math.max(0.5, pState.spineDensity - 0.0001);
        }

        // 66. Immediate Early Gene (IEG) Induction
        if (mState && mState.crebActivation > 0.8) {
            pState.geneExpression.cFos = Math.min(1.0, pState.geneExpression.cFos + 0.005);
            pState.geneExpression.jun = Math.min(1.0, pState.geneExpression.jun + 0.005);
        } else {
            pState.geneExpression.cFos *= 0.995;
            pState.geneExpression.jun *= 0.995;
        }
    };

    G.renderPlasticity = function (ctx, project) {
        const w = G.width;
        const h = G.height;
        const pState = G.plasticityState;

        // Overlay Plasticity Info
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Synaptic Strength: ${pState.synapticStrength.toFixed(3)}`, 10, 100);
        ctx.fillText(`Spine Density: ${pState.spineDensity.toFixed(3)}`, 10, 120);
        ctx.fillText(`eCB Levels: ${(pState.ecbLevels * 100).toFixed(1)}%`, 10, 140);
        ctx.fillText(`c-Fos Expression: ${(pState.geneExpression.cFos * 100).toFixed(1)}%`, 10, 160);
    };
})();
