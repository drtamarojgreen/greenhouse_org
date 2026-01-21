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
        alphaSynuclein: { level: 0, aggregates: [] }, // 87. Alpha-Synuclein Pathology
        inflammation: 0, // 86. Neuroinflammation Effects
        hpaAxisActivity: 0.2, // 90. HPA Axis Interaction
        d2Supersensitivity: 1.0, // 89. D2 Receptor Supersensitivity
        addictionPlasticity: 0, // 84. Addiction-Related Plasticity
        schizophreniaMode: false, // 83. Schizophrenia D2 Overactivity
        adhdMode: false // 85. ADHD DAT Polymorphisms
    };

    G.updateClinical = function () {
        const state = G.state;
        const cState = G.clinicalState;
        const sState = G.synapseState;

        // 83. Schizophrenia D2 Overactivity
        cState.schizophreniaMode = state.mode === 'Schizophrenia';
        if (cState.schizophreniaMode) {
            // Enhanced D2 sensitivity or density
            cState.d2Supersensitivity = 2.0;
        }

        // 85. ADHD Mode (DAT Polymorphisms)
        cState.adhdMode = state.mode === 'ADHD';
        if (cState.adhdMode && sState) {
            sState.dat.activity = 1.5; // High reuptake, low tonic DA
        }

        // 84. Addiction-Related Plasticity
        if (state.mode === 'Cocaine' || state.mode === 'Amphetamine') {
            cState.addictionPlasticity = Math.min(1.0, cState.addictionPlasticity + 0.001);
        }

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

        // 81. Parkinsonian Terminal Loss visualization
        if (state.mode === 'Parkinsonian') {
            // Shrink terminals or reduce their number visually
            if (G.circuitState && G.circuitState.projections) {
                G.circuitState.projections.snc.label = "SNc (DEGENERATED)";
            }
        }

        // 87. Alpha-Synuclein Pathology (Inhibits vesicle release)
        if (state.mode === 'Alpha-Synuclein') {
            cState.alphaSynuclein.level = Math.min(1.0, cState.alphaSynuclein.level + 0.005);
            if (sState) sState.releaseRate = Math.max(0.01, 0.1 * (1.0 - cState.alphaSynuclein.level));

            // Generate visual aggregates
            if (cState.alphaSynuclein.aggregates.length < 15 && Math.random() > 0.95) {
                cState.alphaSynuclein.aggregates.push({
                    x: (Math.random() - 0.5) * 300,
                    y: -250 + Math.random() * 100, // Near presynaptic terminal
                    z: (Math.random() - 0.5) * 100,
                    size: 5 + Math.random() * 15
                });
            }
        }

        // 86. Neuroinflammation (Cytokines affecting synthesis)
        if (state.mode === 'Neuroinflammation') {
            cState.inflammation = Math.min(1.0, cState.inflammation + 0.005);
            if (sState && sState.synthesis) {
                sState.synthesis.thRate = Math.max(0.1, 1.0 - cState.inflammation * 0.7);
            }
        }

        // 90. HPA Axis Interaction (Stress hormones)
        if (state.mode === 'High Stress') {
            cState.hpaAxisActivity = Math.min(1.0, cState.hpaAxisActivity + 0.01);
            if (sState) {
                // Stress increases DA release initially but also increases reuptake/degradation
                sState.releaseRate = 0.2 * (1.0 + cState.hpaAxisActivity);
                sState.dat.activity = 1.0 + cState.hpaAxisActivity * 0.5;
            }
        } else {
            cState.hpaAxisActivity = Math.max(0.1, cState.hpaAxisActivity - 0.002);
        }
    };

    G.renderClinical = function (ctx, project) {
        const w = G.width;
        const h = G.height;
        const cam = G.state.camera;
        const cState = G.clinicalState;

        // Overlay Clinical Info
        ctx.fillStyle = '#ff9999';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`Oxidative Stress: ${(cState.oxidativeStress * 100).toFixed(1)}%`, w - 10, h - 200);
        ctx.fillText(`D2 Supersensitivity: ${cState.d2Supersensitivity.toFixed(2)}x`, w - 10, h - 180);

        if (cState.alphaSynuclein.level > 0.1) {
            ctx.fillText(`α-Synuclein: ${(cState.alphaSynuclein.level * 100).toFixed(1)}%`, w - 10, h - 160);

            // Render aggregates
            cState.alphaSynuclein.aggregates.forEach(agg => {
                const p = project(agg.x, agg.y, agg.z, cam, { width: w, height: h, near: 10, far: 5000 });
                if (p.scale > 0) {
                    ctx.fillStyle = '#ff0000';
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#ff0000';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, agg.size * p.scale, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            });
        }
        if (cState.inflammation > 0.1) {
            ctx.fillText(`Neuroinflammation: ${(cState.inflammation * 100).toFixed(1)}%`, w - 10, h - 140);
        }
        if (cState.hpaAxisActivity > 0.3) {
            ctx.fillText(`HPA Activity (Cortisol): ${(cState.hpaAxisActivity * 100).toFixed(1)}%`, w - 10, h - 120);
        }

        if (cState.oxidativeStress > 0.4) {
            // 88. Visual "damage" (glitch/noise)
            for(let i=0; i<10; i++) {
                ctx.fillStyle = `rgba(255, 100, 100, ${cState.oxidativeStress * 0.5})`;
                ctx.fillRect(Math.random()*w, Math.random()*h, 20, 2);
            }
        }

        if (cState.oxidativeStress > 0.7) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#f00';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('CRITICAL OXIDATIVE STRESS: PROTEIN DAMAGE', w / 2, h / 2);
        }
    };
})();
