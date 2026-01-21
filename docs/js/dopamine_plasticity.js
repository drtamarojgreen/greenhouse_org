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
        proteinSynthesis: 0, // 69. Protein Synthesis
        epigeneticShift: 0, // 68. Epigenetic Modifications
        lastPlasticityUpdate: 0
    };

    G.updatePlasticity = function () {
        const state = G.state;
        const pState = G.plasticityState;
        const mState = G.molecularState;
        const eState = G.electroState;

        // 61-62. LTP/LTD Modeling with STDP gate
        const stdpGate = eState ? eState.stdpWindow : 1.0;

        if (state.signalingActive && stdpGate > 0.1) {
            if (state.mode.includes('D1')) {
                // LTP for D1-MSN (facilitated by D1 and spikes)
                pState.synapticStrength = Math.min(2.5, pState.synapticStrength + 0.002 * stdpGate);
            } else if (state.mode.includes('D2')) {
                // LTD for D2-MSN
                pState.synapticStrength = Math.max(0.4, pState.synapticStrength - 0.001 * stdpGate);
            }
        }

        // 63. Endocannabinoid (eCB) Signaling
        if (state.signalingActive && state.mode.includes('D2')) {
            pState.ecbLevels = Math.min(1.0, pState.ecbLevels + 0.01);
        } else {
            pState.ecbLevels *= 0.99;
        }

        // 64. Dendritic Spine Remodeling
        if (pState.synapticStrength > 1.8) {
            pState.spineDensity = Math.min(2.5, pState.spineDensity + 0.0005);
        } else if (pState.synapticStrength < 0.6) {
            pState.spineDensity = Math.max(0.4, pState.spineDensity - 0.0005);
        }

        // 66. Immediate Early Gene (IEG) Induction
        if (mState && mState.crebActivation > 0.8) {
            pState.geneExpression.cFos = Math.min(1.0, pState.geneExpression.cFos + 0.008);
            pState.geneExpression.jun = Math.min(1.0, pState.geneExpression.jun + 0.008);

            // 69. Protein Synthesis triggered by IEGs
            pState.proteinSynthesis = Math.min(1.0, pState.proteinSynthesis + 0.002);
            // 68. Epigenetic modifications
            pState.epigeneticShift = Math.min(1.0, pState.epigeneticShift + 0.001);
        } else {
            pState.geneExpression.cFos *= 0.995;
            pState.geneExpression.jun *= 0.995;
            pState.proteinSynthesis *= 0.998;
        }
    };

    G.renderPlasticity = function (ctx, project) {
        const cam = G.state.camera;
        const w = G.width;
        const h = G.height;
        const pState = G.plasticityState;

        // 64. Dendritic Spine Remodeling Visuals
        // Draw small visual spines on receptors based on spineDensity
        if (G.state.receptors) {
            G.state.receptors.forEach(r => {
                const baseP = project(r.x, r.y, r.z, cam, { width: w, height: h, near: 10, far: 5000 });
                if (baseP.scale > 0) {
                    const spineCount = Math.floor(5 * pState.spineDensity);
                    for (let i = 0; i < spineCount; i++) {
                        const angle = (i / spineCount) * Math.PI * 2 + G.state.timer * 0.02;
                        const sx = r.x + Math.cos(angle) * (r.helixRadius + 10 * pState.spineDensity);
                        const sz = r.z + Math.sin(angle) * (r.helixRadius + 10 * pState.spineDensity);
                        const sPos = project(sx, r.y, sz, cam, { width: w, height: h, near: 10, far: 5000 });
                        if (sPos.scale > 0) {
                            ctx.fillStyle = '#fff';
                            ctx.beginPath();
                            ctx.arc(sPos.x, sPos.y, 2 * sPos.scale * pState.spineDensity, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                }
            });
        }

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
