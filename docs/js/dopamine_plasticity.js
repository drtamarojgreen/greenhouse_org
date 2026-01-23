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
        bdnfParticles: [],
        proteinSynthesis: 0, // 69. Protein Synthesis
        epigeneticShift: 0, // 68. Epigenetic Modifications
        deltaFosB: 0, // 67. DeltaFosB Accumulation
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
                // LTP for D1-MSN (facilitated by D1, spikes, and BDNF)
                pState.synapticStrength = Math.min(2.5, pState.synapticStrength + 0.002 * stdpGate * pState.bdnfLevels);
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

        // 70. BDNF Interaction
        if (state.signalingActive && state.mode.includes('D1') && Math.random() > 0.95) {
            pState.bdnfParticles.push({
                x: (Math.random() - 0.5) * 400,
                y: 300, z: (Math.random() - 0.5) * 200,
                life: 100, vy: -2
            });
        }
        for (let i = pState.bdnfParticles.length - 1; i >= 0; i--) {
            const p = pState.bdnfParticles[i];
            p.life--; p.y += p.vy;
            if (p.life <= 0) pState.bdnfParticles.splice(i, 1);
        }
        pState.bdnfLevels = 0.5 + (pState.bdnfParticles.length / 20);

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

            // 67. DeltaFosB Accumulation (Slow)
            pState.deltaFosB = Math.min(5.0, pState.deltaFosB + 0.0005);
        } else {
            pState.geneExpression.cFos *= 0.995;
            pState.geneExpression.jun *= 0.995;
            pState.proteinSynthesis *= 0.998;
        }

        // Update UI metrics in the left panel
        if (G.leftPanel && G.updateMetric) {
            G.updateMetric(G.leftPanel, 'Plasticity', 'Synaptic Strength', pState.synapticStrength.toFixed(3));
            G.updateMetric(G.leftPanel, 'Plasticity', 'Spine Density', pState.spineDensity.toFixed(3));
            G.updateMetric(G.leftPanel, 'Plasticity', 'eCB Levels', `${(pState.ecbLevels * 100).toFixed(1)}%`);
            G.updateMetric(G.leftPanel, 'Plasticity', 'c-Fos', `${(pState.geneExpression.cFos * 100).toFixed(1)}%`);
            G.updateMetric(G.leftPanel, 'Plasticity', 'DeltaFosB', pState.deltaFosB.toFixed(4));
        }
    };

    G.renderPlasticity = function (ctx, project) {
        const cam = G.state.camera;
        const w = G.width;
        const h = G.height;
        const pState = G.plasticityState;

        // 68. Render Epigenetic Markers (Histone Acetylation)
        if (pState.epigeneticShift > 0.2) {
             ctx.fillStyle = '#ffff00';
             ctx.globalAlpha = pState.epigeneticShift * 0.3;
             // Draw some background "chromatin" or symbols
             for(let i=0; i<10; i++) {
                 ctx.fillText("Ac", 50 + i*20, 50);
             }
             ctx.globalAlpha = 1.0;
        }

        // 70. Render BDNF Particles
        pState.bdnfParticles.forEach(p => {
            const pos = project(p.x, p.y, p.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (pos.scale > 0) {
                ctx.fillStyle = '#ff00ff';
                ctx.globalAlpha = p.life / 100;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 4 * pos.scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        });

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

    };
})();
