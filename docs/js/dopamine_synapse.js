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
            ddcRate: 1.0,
            fluxVisuals: [] // 22. Tyrosine -> L-DOPA -> DA visuals
        },
        maoActivity: 0.5, // 40. Monoamine Oxidase
        comtActivity: 0.3, // 41. COMT
        astrocytes: [], // 80. Tripartite Synapse / 43. Astrocyte Reuptake
        metabolites: { dopac: 0, hva: 0, '3mt': 0, visual: [] }, // 42. Metabolite Tracking
        glutamate: [], // 77. Glutamate Co-transmission
        autoreceptorFeedback: 1.0, // 31. D2-Short Autoreceptor Feedback
        terminalGeometry: { width: 300, height: 200 }, // 35. Axon Terminal Geometry
        kissAndRunCount: 0, // 33. Kiss-and-run visual indicator
        caChannelInhibition: 1.0, // 32. Presynaptic Ca2+ Channel Inhibition
        tortuosity: 1.5, // 39. Tortuosity & Extracellular Space
        extracellularObstacles: [], // 39. Visual obstacles
        cleftGradient: [] // 45. Synaptic Cleft Concentration Profile
    };

    // Initialize extracellular obstacles for tortuosity
    for (let i = 0; i < 20; i++) {
        G.synapseState.extracellularObstacles.push({
            x: (Math.random() - 0.5) * 600,
            y: -100 + Math.random() * 200,
            z: (Math.random() - 0.5) * 200,
            radius: 5 + Math.random() * 10
        });
    }

    // Initialize vesicles
    for (let i = 0; i < 20; i++) {
        G.synapseState.vesicles.rrp.push({
            y: -180, x: (Math.random() - 0.5) * 120,
            filled: 1.0,
            snareState: 'Primed', // 27. SNARE Complex Assembly
            snareProteins: {
                syntaxin: 1.0,
                snap25: 1.0,
                synaptobrevin: 1.0
            }
        });
        G.synapseState.vesicles.reserve.push({
            y: -260, x: (Math.random() - 0.5) * 180,
            filled: 1.0,
            snareState: 'Docked',
            snareProteins: {
                syntaxin: 0.2,
                snap25: 0.2,
                synaptobrevin: 1.0
            }
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
                if (isKissAndRun) sState.kissAndRunCount = 20;

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
                        filled: 0,
                        snareState: 'Docked',
                        snareProteins: { syntaxin: 0.1, snap25: 0.1, synaptobrevin: 1.0 }
                    });
                }, 800);
            }
        }

        // 25. Vesicle Filling (VMAT2) kinetics & 26. RRP replenishment
        // Experimental filling rate ~5-15 mins in vivo, scaled for simulation
        const kFill = 0.005;
        sState.vesicles.reserve.forEach(v => {
            if (v.filled < 1.0) {
                // Filling rate depends on VMAT2 and proton gradient (pH gradient of 2.0 is standard)
                // 24. VMAT2 proton-gradient dependency
                v.filled += kFill * sState.vmat2.activity * (sState.vmat2.phGradient / 2.0);
            }
        });

        if (sState.vesicles.rrp.length < 12 && sState.vesicles.reserve.length > 0) {
            const readyIndex = sState.vesicles.reserve.findIndex(v => v.filled > 0.8);
            if (readyIndex !== -1) {
                const v = sState.vesicles.reserve.splice(readyIndex, 1)[0];
                v.y = -180;
                v.snareState = 'Primed';
                // 27. Assemble SNARE complex upon priming
                if (!v.snareProteins) {
                    v.snareProteins = { syntaxin: 0.1, snap25: 0.1, synaptobrevin: 1.0 };
                }
                v.snareProteins.syntaxin = 1.0;
                v.snareProteins.snap25 = 1.0;
                sState.vesicles.rrp.push(v);
            }
        }

        // 36. DAT-Mediated Reuptake, 37. DAT Phosphorylation, 38. Volume Transmission
        // 37. PKC-mediated DAT phosphorylation reduces its activity
        const pkcLevel = G.molecularState ? G.molecularState.plcPathway.pkc : 0;
        const datPhosphoInhibition = 1.0 - (pkcLevel * 0.4);

        // 44. Competitive Inhibition at DAT (by Serotonin/Norepinephrine)
        const competitiveInhibition = state.mode === 'Competitive' ? 0.5 : 1.0;

        // Scenario-based effects
        const cocaineEffect = state.scenarios.cocaine ? 0.1 : 1.0;
        const amphetamineEffect = state.scenarios.amphetamine ? -0.5 : 1.0;
        const adhdEffect = state.scenarios.adhd ? 1.5 : 1.0;

        const datEfficiency = sState.dat.activity * (sState.dat.na / 140) * (sState.dat.cl / 120) * datPhosphoInhibition * competitiveInhibition * cocaineEffect * adhdEffect;

        for (let i = sState.cleftDA.length - 1; i >= 0; i--) {
            const da = sState.cleftDA[i];

            // 38. Volume Transmission & 39. Tortuosity: slowed diffusion in extracellular space
            const diffusionScale = da.y < -150 ? 1.0 : (1.0 / sState.tortuosity);
            da.x += da.vx * diffusionScale;
            da.y += da.vy * diffusionScale;
            da.z += da.vz * diffusionScale;
            da.life--;

            // 38. Volume Transmission visual: fade out molecules as they move far from cleft
            const distance = Math.sqrt(da.x*da.x + da.z*da.z);
            if (distance > 200) da.life -= 2;

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

        // 39. Collisions with extracellular obstacles (Tortuosity)
        sState.extracellularObstacles.forEach(obs => {
            const dx = da.x - obs.x;
            const dy = da.y - obs.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < obs.radius) {
                // Bounce effect
                da.vx *= -0.5;
                da.vy *= -0.5;
                da.x += da.vx * 2;
                da.y += da.vy * 2;
            }
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
            sState.dat.activity = 0.2;
        }

        // 21-23. Synthesis Pathway (TH -> DDC)
        const thEfficiency = sState.synthesis.thRate * (G.molecularState ? (1.0 + G.molecularState.darpp32.thr34 * 0.5) : 1.0);
        if (sState.synthesis.tyrosine > 0) {
            const conversion = 0.1 * thEfficiency;
            sState.synthesis.tyrosine -= conversion;
            sState.synthesis.ldopa += conversion;
            // 22. Flux visuals
            if (Math.random() > 0.9) {
                sState.synthesis.fluxVisuals.push({ x: -100, y: -280, type: 'ldopa', life: 60 });
            }
        }
        if (sState.synthesis.ldopa > 0) {
            const conversion = 0.5 * sState.synthesis.ddcRate;
            sState.synthesis.ldopa -= conversion;
            sState.synthesis.dopamine += conversion;
            if (Math.random() > 0.9) {
                sState.synthesis.fluxVisuals.push({ x: -80, y: -250, type: 'da', life: 60 });
            }
        }
        for (let i = sState.synthesis.fluxVisuals.length - 1; i >= 0; i--) {
            const f = sState.synthesis.fluxVisuals[i];
            f.life--;
            f.y += 0.5;
            if (f.life <= 0) sState.synthesis.fluxVisuals.splice(i, 1);
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

            // 42. Visual Metabolites
            if (Math.random() > 0.98) {
                const da = sState.cleftDA[Math.floor(Math.random() * sState.cleftDA.length)];
                sState.metabolites.visual.push({ x: da.x, y: da.y, z: da.z, type: 'dopac', life: 120 });
            }
        }

        if (sState.metabolites.dopac > 0) {
            const hvaConv = sState.metabolites.dopac * sState.comtActivity * 0.01;
            sState.metabolites.dopac -= hvaConv;
            sState.metabolites.hva += hvaConv;
        }

        for (let i = sState.metabolites.visual.length - 1; i >= 0; i--) {
            const m = sState.metabolites.visual[i];
            m.life--;
            m.x += (Math.random()-0.5);
            m.y += (Math.random()-0.5);
            if (m.life <= 0) sState.metabolites.visual.splice(i, 1);
        }
    };

    G.renderSynapse = function (ctx, project) {
        const cam = G.state.camera;
        const w = G.width;
        const h = G.height;
        const sState = G.synapseState;

        // 39. Render Extracellular Obstacles
        sState.extracellularObstacles.forEach(obs => {
            const p = project(obs.x, obs.y, obs.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) {
                ctx.fillStyle = 'rgba(100, 100, 100, 0.2)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, obs.radius * p.scale, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        const state = G.state;

        // 24. Render VMAT2 Proton Gradient (Visualized as purple glow inside terminal)
        const pTerminal = project(0, -225, 0, cam, { width: w, height: h, near: 10, far: 5000 });
        if (pTerminal.scale > 0) {
            const vmatGrad = ctx.createRadialGradient(pTerminal.x, pTerminal.y, 0, pTerminal.x, pTerminal.y, 150 * pTerminal.scale);
            vmatGrad.addColorStop(0, `rgba(150, 0, 255, ${0.1 * sState.vmat2.phGradient / 2.0})`);
            vmatGrad.addColorStop(1, 'rgba(150, 0, 255, 0)');
            ctx.fillStyle = vmatGrad;
            ctx.beginPath();
            ctx.arc(pTerminal.x, pTerminal.y, 150 * pTerminal.scale, 0, Math.PI * 2);
            ctx.fill();
        }

        // 35. Render Axon Terminal Geometry (3D-like bulb)
        const t = sState.terminalGeometry;
        ctx.strokeStyle = 'rgba(100, 100, 200, 0.4)';
        ctx.fillStyle = 'rgba(100, 100, 255, 0.05)';

        const pCenter = project(0, -225, 0, cam, { width: w, height: h, near: 10, far: 5000 });
        if (pCenter.scale > 0) {
            ctx.beginPath();
            ctx.ellipse(pCenter.x, pCenter.y, (t.width/2) * pCenter.scale, (t.height/2) * pCenter.scale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.setLineDash([10, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // 22. Render Synthesis Flux
        sState.synthesis.fluxVisuals.forEach(f => {
            const p = project(f.x, f.y, 0, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) {
                ctx.fillStyle = f.type === 'ldopa' ? '#ffaa00' : '#00ff00';
                ctx.font = `${8 * p.scale}px Arial`;
                ctx.fillText(f.type.toUpperCase(), p.x, p.y);
            }
        });

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

        // 42. Render Visual Metabolites
        sState.metabolites.visual.forEach(m => {
            const p = project(m.x, m.y, m.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) {
                ctx.fillStyle = '#ff5500';
                ctx.globalAlpha = m.life / 120;
                ctx.font = `${7 * p.scale}px Arial`;
                ctx.fillText(m.type.toUpperCase(), p.x, p.y);
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

                // 27. Render SNARE Proteins (small colored ticks/lines around vesicle)
                if (v.snareProteins) {
                    const radius = 9 * p.scale;
                    // Syntaxin (Red)
                    if (v.snareProteins.syntaxin > 0.5) {
                        ctx.strokeStyle = '#f00';
                        ctx.beginPath();
                        ctx.moveTo(p.x + radius, p.y);
                        ctx.lineTo(p.x + radius + 3*p.scale, p.y);
                        ctx.stroke();
                    }
                    // SNAP-25 (Blue)
                    if (v.snareProteins.snap25 > 0.5) {
                        ctx.strokeStyle = '#00f';
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y + radius);
                        ctx.lineTo(p.x, p.y + radius + 3*p.scale);
                        ctx.stroke();
                    }
                    // Synaptobrevin (Yellow)
                    if (v.snareProteins.synaptobrevin > 0.5) {
                        ctx.strokeStyle = '#ff0';
                        ctx.beginPath();
                        ctx.moveTo(p.x - radius, p.y);
                        ctx.lineTo(p.x - radius - 3*p.scale, p.y);
                        ctx.stroke();
                    }
                }
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
        ctx.fillText(`Vesicles: ${sState.vesicles.rrp.length}`, 10, h - 100);
        ctx.fillText(`Cleft DA: ${sState.cleftDA.length}`, 10, h - 85);
        ctx.fillText(`DAT: ${(sState.dat.activity * 100).toFixed(0)}%`, 10, h - 70);
        ctx.fillText(`Autoreceptor: ${(sState.autoreceptorFeedback * 100).toFixed(0)}%`, 10, h - 55);
        ctx.fillText(`Status: ${sState.pathologicalState}`, 10, h - 40);

        // 33. Kiss-and-run Indicator
        if (sState.kissAndRunCount > 0) {
            sState.kissAndRunCount--;
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('KISS-AND-RUN FUSION', 10, h - 120);
        }
    };
})();
