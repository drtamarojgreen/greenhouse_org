/**
 * @file dopamine_synapse.js
 * @description Presynaptic and synaptic dynamics for Dopamine Simulation.
 * Covers Enhancements 21-45, 71-80, and 81-90.
 */

(function () {
    'use strict';
    const G = window.GreenhouseDopamine || {};
    window.GreenhouseDopamine = G;

    G.synapseState = {
        vesicles: {
            rrp: [], // 26. Readily Releasable Pool
            reserve: [] // Reserve Pool
        },
        cleftDA: [],
        dat: { activity: 1.0, na: 140, cl: 120 }, // 36. DAT dependencies (Na+, Cl-)
        vmat2: { activity: 1.0, phGradient: 2.0 }, // 24. VMAT2 Transport
        releaseRate: 0.1,
        pathologicalState: 'Healthy',
        volumeTransmission: true,
        // 21. Tyrosine Hydroxylase (TH) Regulation
        synthesis: {
            tyrosine: 100,
            ldopa: 0,
            dopamine: 50,
            thRate: 1.0,
            ddcRate: 1.0
        },
        maoActivity: 0.5, // 40. Monoamine Oxidase
        comtActivity: 0.3, // 41. COMT
        astrocytes: [], // 80. Tripartite Synapse / 43. Astrocyte Reuptake
        metabolites: { dopac: 0, hva: 0, '3mt': 0 }, // 42. Metabolite Tracking
        glutamate: [], // 77. Glutamate Co-transmission
        autoreceptorFeedback: 1.0, // 31. D2-Short Autoreceptor Feedback
        terminalGeometry: { width: 300, height: 200 }, // 35. Axon Terminal Geometry
        caChannelInhibition: 1.0, // 32. Presynaptic Ca2+ Channel Inhibition
        tortuosity: 1.5, // 39. Tortuosity & Extracellular Space
        cleftGradient: [] // 45. Synaptic Cleft Concentration Profile
    };

    // Initialize vesicles
    for (let i = 0; i < 20; i++) {
        G.synapseState.vesicles.rrp.push({
            y: -180, x: (Math.random() - 0.5) * 120,
            filled: 1.0,
            snareState: 'Primed' // 27. SNARE Complex Assembly
        });
        G.synapseState.vesicles.reserve.push({
            y: -260, x: (Math.random() - 0.5) * 180,
            filled: 1.0,
            snareState: 'Docked'
        });
    }

    // Initialize astrocyte processes
    for (let i = 0; i < 3; i++) {
        G.synapseState.astrocytes.push({
            x: 200 + i * 50, y: -50, z: (Math.random() - 0.5) * 100,
            radius: 40 + Math.random() * 20
        });
    }

    G.updateSynapse = function () {
        const state = G.state;
        const sState = G.synapseState;

        // 31. D2-Short Autoreceptor Feedback & 32. Ca2+ Channel Inhibition
        // If DA in cleft is high, activate autoreceptors (D2-Short)
        const cleftConcentration = sState.cleftDA.length;
        if (cleftConcentration > 50) {
            sState.autoreceptorFeedback = Math.max(0.2, sState.autoreceptorFeedback - 0.05);
            sState.caChannelInhibition = Math.max(0.3, sState.caChannelInhibition - 0.04);
        } else {
            sState.autoreceptorFeedback = Math.min(1.0, sState.autoreceptorFeedback + 0.02);
            sState.caChannelInhibition = Math.min(1.0, sState.caChannelInhibition + 0.01);
        }

        // 29. Phasic Release Patterns & 30. Tonic Release
        // Release is also gated by Ca2+ channel status
        let releaseChance = sState.releaseRate * sState.autoreceptorFeedback * sState.caChannelInhibition;
        if (state.mode === 'Phasic Burst') releaseChance = 0.6 * sState.autoreceptorFeedback * sState.caChannelInhibition;

        // 28. Synaptotagmin Calcium Sensing Trigger
        if (Math.random() < releaseChance && sState.vesicles.rrp.length > 0) {
            const vIndex = sState.vesicles.rrp.findIndex(v => v.snareState === 'Primed');
            if (vIndex !== -1) {
                const v = sState.vesicles.rrp.splice(vIndex, 1)[0];

                // 33. Kiss-and-Run Fusion Mode (occasional)
                const isKissAndRun = Math.random() > 0.8;
                const releaseFactor = isKissAndRun ? 0.4 : 1.0;

                // Release DA molecules proportional to filling
                const count = Math.floor(15 * v.filled * releaseFactor);
                for (let i = 0; i < count; i++) {
                    sState.cleftDA.push({
                        x: v.x + (Math.random() - 0.5) * 15,
                        y: -170, z: (Math.random() - 0.5) * 15,
                        vx: (Math.random() - 0.5) * 2.5,
                        vy: Math.random() * 3 + 1,
                        vz: (Math.random() - 0.5) * 2.5,
                        life: 180 + Math.random() * 50
                    });
                }

                // 77. Glutamate Co-transmission
                // Approximately 10% of vesicles co-release glutamate in specific projections
                if (Math.random() > 0.9) {
                    for (let i = 0; i < 5; i++) {
                        sState.glutamate.push({
                            x: v.x + (Math.random() - 0.5) * 10,
                            y: -170, z: (Math.random() - 0.5) * 10,
                            vx: (Math.random() - 0.5) * 2,
                            vy: Math.random() * 4 + 2,
                            vz: (Math.random() - 0.5) * 2,
                            life: 150
                        });
                    }
                }

                // 34. Vesicle Endocytosis
                setTimeout(() => {
                    sState.vesicles.reserve.push({
                        y: -260, x: (Math.random() - 0.5) * 180,
                        filled: 0, snareState: 'Docked'
                    });
                }, 800);
            }
        }

        // 25. Vesicle Filling (VMAT2) & 26. RRP replenishment
        sState.vesicles.reserve.forEach(v => {
            if (v.filled < 1.0) {
                // Filling rate depends on VMAT2 and proton gradient
                v.filled += 0.005 * sState.vmat2.activity * (sState.vmat2.phGradient / 2.0);
            }
        });

        if (sState.vesicles.rrp.length < 12 && sState.vesicles.reserve.length > 0) {
            const readyIndex = sState.vesicles.reserve.findIndex(v => v.filled > 0.8);
            if (readyIndex !== -1) {
                const v = sState.vesicles.reserve.splice(readyIndex, 1)[0];
                v.y = -180;
                v.snareState = 'Primed';
                sState.vesicles.rrp.push(v);
            }
        }

        // 36. DAT-Mediated Reuptake, 37. DAT Phosphorylation, 38. Volume Transmission
        // 37. PKC-mediated DAT phosphorylation reduces its activity
        const pkcLevel = G.molecularState ? G.molecularState.plcPathway.pkc : 0;
        const datPhosphoInhibition = 1.0 - (pkcLevel * 0.4);

        // 44. Competitive Inhibition at DAT (by Serotonin/Norepinephrine)
        const competitiveInhibition = state.mode === 'Competitive' ? 0.5 : 1.0;

        const datEfficiency = sState.dat.activity * (sState.dat.na / 140) * (sState.dat.cl / 120) * datPhosphoInhibition * competitiveInhibition;

        for (let i = sState.cleftDA.length - 1; i >= 0; i--) {
            const da = sState.cleftDA[i];

            // 39. Tortuosity: slowed diffusion in extracellular space
            const diffusionScale = da.y < -150 ? 1.0 : (1.0 / sState.tortuosity);
            da.x += da.vx * diffusionScale;
            da.y += da.vy * diffusionScale;
            da.z += da.vz * diffusionScale;
            da.life--;

            // 43. Astrocyte Reuptake & Active Clearing
            let astrocyteHit = false;
            sState.astrocytes.forEach(ast => {
                const dx = da.x - ast.x;
                const dy = da.y - ast.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                // 43. Active "suction" towards astrocyte process
                if (dist < ast.radius * 2) {
                    da.vx += (ast.x - da.x) * 0.01;
                    da.vy += (ast.y - da.y) * 0.01;
                }

                if (dist < ast.radius) astrocyteHit = true;
            });

            // Reuptake at the top (presynaptic DAT)
            if (da.y < -160 && Math.random() < 0.06 * datEfficiency) {
                sState.cleftDA.splice(i, 1);
            } else if (astrocyteHit && Math.random() < 0.1) {
                sState.cleftDA.splice(i, 1);
            } else if (da.life <= 0) {
                sState.cleftDA.splice(i, 1);
            }
        }

        // Update Glutamate molecules
        for (let i = sState.glutamate.length - 1; i >= 0; i--) {
            const glu = sState.glutamate[i];
            glu.x += glu.vx; glu.y += glu.vy; glu.z += glu.vz;
            glu.life--;
            if (glu.y > 0 || glu.life <= 0) sState.glutamate.splice(i, 1);
        }

        // 81. Parkinsonian DA Depletion
        if (sState.pathologicalState === 'Parkinsonian') {
            sState.releaseRate = 0.01;
            sState.datActivity = 0.2;
        }

        // 21-23. Synthesis Pathway (TH -> DDC)
        const thEfficiency = sState.synthesis.thRate * (G.molecularState ? (1.0 + G.molecularState.darpp32.thr34 * 0.5) : 1.0);
        if (sState.synthesis.tyrosine > 0) {
            const conversion = 0.1 * thEfficiency;
            sState.synthesis.tyrosine -= conversion;
            sState.synthesis.ldopa += conversion;
        }
        if (sState.synthesis.ldopa > 0) {
            const conversion = 0.5 * sState.synthesis.ddcRate;
            sState.synthesis.ldopa -= conversion;
            sState.synthesis.dopamine += conversion;
        }
        // Refill vesicles from cytosolic DA pool
        sState.vesicles.reserve.forEach(v => {
            if (v.filled < 1.0 && sState.synthesis.dopamine > 0.1) {
                const fill = 0.01 * sState.vmat2.activity;
                v.filled += fill;
                sState.synthesis.dopamine -= fill;
            }
        });

        // 40-42. Detailed Degradation & Metabolites
        // MAO acts on intracellular DA and DOPAC
        // COMT acts on extracellular DA (to 3-MT) and DOPAC (to HVA)
        if (sState.cleftDA.length > 0) {
            const daCount = sState.cleftDA.length;
            const comtDeg = daCount * sState.comtActivity * 0.001;
            sState.metabolites['3mt'] += comtDeg;

            const maoDeg = daCount * sState.maoActivity * 0.001;
            sState.metabolites.dopac += maoDeg;
        }

        if (sState.metabolites.dopac > 0) {
            const hvaConv = sState.metabolites.dopac * sState.comtActivity * 0.01;
            sState.metabolites.dopac -= hvaConv;
            sState.metabolites.hva += hvaConv;
        }
    };

    G.renderSynapse = function (ctx, project) {
        const cam = G.state.camera;
        const w = G.width;
        const h = G.height;
        const sState = G.synapseState;

        // 35. Render Axon Terminal Geometry
        const t = sState.terminalGeometry;
        const p1 = project(-t.width/2, -300, 0, cam, { width: w, height: h, near: 10, far: 5000 });
        const p2 = project(t.width/2, -300, 0, cam, { width: w, height: h, near: 10, far: 5000 });
        const p3 = project(t.width/2, -150, 0, cam, { width: w, height: h, near: 10, far: 5000 });
        const p4 = project(-t.width/2, -150, 0, cam, { width: w, height: h, near: 10, far: 5000 });

        ctx.strokeStyle = 'rgba(100, 100, 200, 0.3)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        // 80. Render Astrocyte Processes (Tripartite Synapse)
        sState.astrocytes.forEach(ast => {
            const p = project(ast.x, ast.y, ast.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) {
                ctx.strokeStyle = '#004444';
                ctx.lineWidth = 2 * p.scale;
                ctx.beginPath();
                ctx.arc(p.x, p.y, ast.radius * p.scale, 0, Math.PI * 2);
                ctx.stroke();
                // Star shape indicator for astrocyte
                ctx.fillStyle = '#002222';
                ctx.globalAlpha = 0.3;
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        });

        // Render Vesicles
        [...sState.vesicles.reserve, ...sState.vesicles.rrp].forEach(v => {
            const p = project(v.x, v.y, 0, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) {
                ctx.fillStyle = v.filled > 0.9 ? '#88ff88' : '#666';
                ctx.strokeStyle = v.snareState === 'Primed' ? '#fff' : '#444';
                ctx.lineWidth = 2 * p.scale;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 7 * p.scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        });

        // 45. Render Synaptic Cleft Concentration Profile (Gradient)
        if (sState.cleftDA.length > 10) {
            const gradientY = -160;
            const pG = project(0, gradientY, 0, cam, { width: w, height: h, near: 10, far: 5000 });
            if (pG.scale > 0) {
                const grad = ctx.createRadialGradient(pG.x, pG.y, 0, pG.x, pG.y, 100 * pG.scale);
                grad.addColorStop(0, `rgba(0, 255, 0, ${Math.min(0.3, sState.cleftDA.length / 500)})`);
                grad.addColorStop(1, 'rgba(0, 255, 0, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(pG.x, pG.y, 100 * pG.scale, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Render DA molecules
        sState.cleftDA.forEach(da => {
            const p = project(da.x, da.y, da.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) {
                ctx.fillStyle = '#00ff00';
                ctx.globalAlpha = Math.max(0, da.life / 200);
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2 * p.scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        });

        // 77. Render Glutamate molecules
        sState.glutamate.forEach(glu => {
            const p = project(glu.x, glu.y, glu.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) {
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = Math.max(0, glu.life / 150);
                ctx.beginPath();
                ctx.arc(p.x, p.y, 1.5 * p.scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        });

        // Overlay Synapse Info
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Vesicles (RRP): ${sState.vesicles.rrp.length}`, 10, h - 100);
        ctx.fillText(`Cleft DA Concentration: ${sState.cleftDA.length}`, 10, h - 80);
        ctx.fillText(`DAT Activity: ${(sState.dat.activity * 100).toFixed(0)}%`, 10, h - 60);
        ctx.fillText(`Autoreceptor Feedback: ${(sState.autoreceptorFeedback * 100).toFixed(0)}%`, 10, h - 40);
        ctx.fillText(`State: ${sState.pathologicalState}`, 10, h - 20);
    };
})();
