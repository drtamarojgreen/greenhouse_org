/**
 * @file serotonin_transport.js
 * @description Synthesis, transport, and synaptic dynamics for the Serotonin simulation.
 */

(function () {
    'use strict';

    const G = window.GreenhouseSerotonin || {};
    window.GreenhouseSerotonin = G;

    G.Transport = {
        tryptophan: 100,
        vesicle5HT: 0,
        synthesisRate: 0.1,
        reuptakeRate: 0.05,
        degradationRate: 0.02,

        tphActivity: 1.0,
        vmat2Activity: 1.0,
        sertActivity: 1.0,
        maoActivity: 1.0,
        firingMode: 'tonic', // 'tonic' or 'phasic'
        synapticWeight: 1.0,
        longTermAvg5HT: 5,
        astrocyte5HT: 0,
        serotonylatedProteins: 0,
        sensorySensitivity: 1.0,
        sertAllele: 'Long', // 'Short' or 'Long' (Category 8, #79)
        sertPhosphorylation: 0, // Category 4, #36

        updateTransport() {
            const current5HT = G.Kinetics ? G.Kinetics.activeLigands.filter(l => l.name === 'Serotonin').length : 0;

            // TPH2 Activation by CaMKII/PKA
            // High Calcium or cAMP increases TPH activity
            const signalingBoost = G.Signaling ? (G.Signaling.calcium * 0.05 + G.Signaling.cAMP * 0.02) : 0;
            const effectiveTPHActivity = this.tphActivity * (1.0 + signalingBoost);

            // TPH Synthesis: Tryptophan -> 5-HT
            const synthesized = this.tryptophan * this.synthesisRate * effectiveTPHActivity * 0.01;
            this.tryptophan -= synthesized;
            this.vesicle5HT += synthesized;

            // Autoreceptor Feedback Logic
            let releaseInhibition = 1.0;
            if (G.state.receptors) {
                G.state.receptors.forEach(r => {
                    // 5-HT1B/D are often presynaptic autoreceptors
                    if ((r.type === '5-HT1B' || r.type === '5-HT1D') && r.state === 'Active') {
                        releaseInhibition *= 0.5; // Each active autoreceptor reduces release probability
                    }
                    // 5-HT1A can be somatodendritic autoreceptor
                    if (r.type === '5-HT1A' && r.state === 'Active') {
                        this.tphActivity *= 0.99; // Chronic activation reduces synthesis (very simplified)
                    } else {
                        this.tphActivity = Math.min(1.0, this.tphActivity + 0.001); // Recovery
                    }
                });
            }

            // Kynurenine Pathway Competition (Depletes tryptophan under inflammation)
            if (this.inflammationActive) {
                this.tryptophan -= 0.1;
            }

            // Melatonin Conversion (Conversion of 5-HT in pineal-like conditions)
            if (this.pinealMode && this.vesicle5HT > 0) {
                this.melatonin = (this.melatonin || 0) + 0.05;
                this.vesicle5HT -= 0.05;
            }

            // VMAT2 Loading into vesicles (simplified as a pool here)
            // Release patterns (Category 5, #47)
            let shouldRelease = false;
            let releaseAmount = 0;

            if (this.firingMode === 'tonic') {
                if (G.state.timer % 50 === 0 && Math.random() < 0.3 * releaseInhibition) {
                    shouldRelease = true;
                    releaseAmount = 2;
                }
            } else if (this.firingMode === 'phasic') {
                if (G.state.timer % 300 === 0 && Math.random() < releaseInhibition) {
                    shouldRelease = true;
                    releaseAmount = 15; // Burst
                }
            }

            if (shouldRelease && this.vesicle5HT > releaseAmount) {
                this.vesicle5HT -= releaseAmount;
                for (let i = 0; i < releaseAmount; i++) {
                    if (G.Kinetics) G.Kinetics.spawnLigand('Serotonin', 0, -150, 0);
                }
            }

            // SERT Polymorphisms (Category 8, #79)
            // 'Short' allele (s) results in lower SERT expression/activity
            const alleleEffect = this.sertAllele === 'Short' ? 0.6 : 1.0;

            // SERT Phosphorylation (Category 4, #36)
            // p38 MAPK or PKC can phosphorylate SERT, usually reducing reuptake efficiency
            const phosphorylationEffect = 1.0 - (this.sertPhosphorylation * 0.5);

            const totalSertEfficiency = this.sertActivity * alleleEffect * phosphorylationEffect;

            // SERT & Glial Reuptake (Revised to avoid splice-in-loop bug)
            if (G.Kinetics && G.Kinetics.activeLigands) {
                for (let i = G.Kinetics.activeLigands.length - 1; i >= 0; i--) {
                    const l = G.Kinetics.activeLigands[i];
                    if (l.name === 'Serotonin' && !l.boundTo) {
                        // SERT is at the top (presynaptic)
                        const distToSert = Math.abs(l.y + 150) + Math.abs(l.x) + Math.abs(l.z);
                        if (distToSert < 50 && Math.random() < this.reuptakeRate * totalSertEfficiency) {
                            G.Kinetics.activeLigands.splice(i, 1);
                            this.vesicle5HT += 1;
                            continue;
                        }

                        // Glial Serotonin Reuptake via PMAT (Category 5, #50)
                        // Astrocytes are simulated at the periphery
                        const distToGlia = Math.sqrt(l.x*l.x + l.z*l.z);
                        if (distToGlia > 200 && Math.random() < 0.02) {
                            G.Kinetics.activeLigands.splice(i, 1);
                            this.astrocyte5HT += 1;
                        }
                    }
                }
            }

            // MAO Degradation
            if (Math.random() < this.degradationRate * this.maoActivity) {
                if (this.vesicle5HT > 0) this.vesicle5HT -= 0.1;
            }

            // L-Tryptophan Transport via LAT1 (Category 4, #33)
            // Tryptophan availability depends on competition (simulated)
            const bbbTransportRate = 0.05 * (this.pinealMode ? 1.5 : 1.0) * (this.inflammationActive ? 0.5 : 1.0);
            if (this.tryptophan < 100) this.tryptophan += bbbTransportRate;

            // Monoamine Oxidase (MAO-A) Degradation steps (Category 4, #37)
            // Model degradation into 5-HIAA placeholder
            if (Math.random() < this.degradationRate * this.maoActivity) {
                this.hiaa = (this.hiaa || 0) + 0.1;
            }

            // Serotonylation of proteins (Category 4, #39)
            // Covalent attachment of 5-HT to proteins (e.g. small GTPases)
            if (current5HT > 8 && Math.random() < 0.005) {
                this.serotonylatedProteins += 1;
            }

            // Sensory Processing Sensitivity (Category 8, #80)
            // 5-HT role in filtering sensory input in thalamus
            this.sensorySensitivity = 1.0 / (1.0 + current5HT * 0.05);

            // Dynamic SERT Phosphorylation by signaling (p38/PKC simulation)
            if (G.Signaling) {
                this.sertPhosphorylation = G.Signaling.pkc * 0.2;
            }

            // Synaptic Scaling (Category 5, #48)
            this.longTermAvg5HT = this.longTermAvg5HT * 0.99 + current5HT * 0.01;

            // Homeostatic scaling: if 5-HT is low for a long time, increase synaptic weight
            if (this.longTermAvg5HT < 3) {
                this.synapticWeight = Math.min(2.0, this.synapticWeight + 0.001);
            } else if (this.longTermAvg5HT > 10) {
                this.synapticWeight = Math.max(0.5, this.synapticWeight - 0.001);
            }

            // Glutamate Co-release (VGLUT3) logic
            // Release glutamate if vesicle 5-HT is high and not inhibited
            this.glutamateCoRelease = (this.vesicle5HT > 20 && releaseInhibition > 0.5);

            // Heterosynaptic Modulation (Category 5, #49)
            // If current synapse has high 5-HT, it "spills over" to modulate neighbors
            this.heterosynapticEffect = current5HT > 10;
        },

        renderTransport(ctx, project, cam, w, h) {
            // Draw Astrocytes (Category 5, #50)
            const astrocytePos = project(250, 0, 0, cam, { width: w, height: h, near: 10, far: 5000 });
            if (astrocytePos.scale > 0) {
                ctx.fillStyle = 'rgba(100, 200, 100, 0.2)';
                ctx.beginPath();
                ctx.arc(astrocytePos.x, astrocytePos.y, 100 * astrocytePos.scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.fillText('Astrocyte (Glial Reuptake)', astrocytePos.x, astrocytePos.y - 110 * astrocytePos.scale);
            }

            // Volume Transmission Visualization (extrasynaptic cloud)
            const extracellular5HT = G.Kinetics ? G.Kinetics.activeLigands.filter(l => l.name === 'Serotonin' && !l.boundTo).length : 0;
            if (extracellular5HT > 5) {
                ctx.fillStyle = `rgba(0, 255, 200, ${Math.min(0.2, extracellular5HT * 0.01)})`;
                ctx.fillRect(0, 0, w, h); // Full screen tint for volume transmission
            }

            // Draw Pre-synaptic terminal
            const pre = project(0, -200, 0, cam, { width: w, height: h, near: 10, far: 5000 });

            // HUD for Melatonin
            if (this.pinealMode) {
                ctx.fillStyle = '#cc99ff';
                ctx.fillText(`Melatonin: ${(this.melatonin || 0).toFixed(1)}`, 20, 150);
            }

            // HUD for Serotonylation and Sensory Sensitivity
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.fillText(`Serotonylation: ${this.serotonylatedProteins}`, 20, 165);
            ctx.fillText(`Sensory Filter: ${(100 - this.sensorySensitivity * 100).toFixed(0)}%`, 20, 180);
            ctx.fillText(`SERT Allele: ${this.sertAllele}`, 20, 195);
            ctx.fillText(`SERT Phos: ${(this.sertPhosphorylation * 100).toFixed(0)}%`, 20, 210);
            ctx.fillText(`5-HIAA: ${(this.hiaa || 0).toFixed(1)}`, 20, 225);
            if (pre.scale > 0) {
                ctx.fillStyle = 'rgba(100, 100, 150, 0.3)';
                ctx.beginPath();
                ctx.arc(pre.x, pre.y, 80 * pre.scale, Math.PI, 0);
                ctx.fill();

                ctx.fillStyle = '#fff';
                ctx.font = '10px Arial';
                ctx.fillText('Presynaptic Terminal', pre.x, pre.y - 40 * pre.scale);
                ctx.fillText(`Vesicle 5-HT: ${this.vesicle5HT.toFixed(1)}`, pre.x, pre.y - 20 * pre.scale);
            }

            // Draw SERT molecules
            for (let i = -2; i <= 2; i++) {
                const sp = project(i * 30, -150, 0, cam, { width: w, height: h, near: 10, far: 5000 });
                if (sp.scale > 0) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(sp.x - 5 * sp.scale, sp.y - 10 * sp.scale, 10 * sp.scale, 20 * sp.scale);
                    if (i === 0) ctx.fillText('SERT', sp.x, sp.y + 25 * sp.scale);
                }
            }
        }
    };


    const oldRender = G.render;
    G.render = function() {
        if (oldRender) oldRender.call(G);

        const ctx = G.ctx;
        const w = G.width;
        const h = G.height;
        const cam = G.state.camera;
        if (!window.GreenhouseModels3DMath) return;
        const project = window.GreenhouseModels3DMath.project3DTo2D.bind(window.GreenhouseModels3DMath);

        G.Transport.renderTransport(ctx, project, cam, w, h);
    };

})();
