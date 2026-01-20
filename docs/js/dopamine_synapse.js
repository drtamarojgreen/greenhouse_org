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
        thActivity: 1.0,
        maoActivity: 0.5,
        comtActivity: 0.3,
        astrocytes: [], // 80. Tripartite Synapse / 43. Astrocyte Reuptake
        metabolites: { dopac: 0, hva: 0 }
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

        // 29. Phasic Release Patterns & 30. Tonic Release
        let releaseChance = sState.releaseRate;
        if (state.mode === 'Phasic Burst') releaseChance = 0.6;

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

        // 36. DAT-Mediated Reuptake & 38. Volume Transmission
        // DAT efficiency depends on Sodium and Chloride gradients
        const datEfficiency = sState.dat.activity * (sState.dat.na / 140) * (sState.dat.cl / 120);

        for (let i = sState.cleftDA.length - 1; i >= 0; i--) {
            const da = sState.cleftDA[i];
            da.x += da.vx;
            da.y += da.vy;
            da.z += da.vz;
            da.life--;

            // 43. Astrocyte Reuptake
            let astrocyteHit = false;
            sState.astrocytes.forEach(ast => {
                const dx = da.x - ast.x;
                const dy = da.y - ast.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
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

        // 81. Parkinsonian DA Depletion
        if (sState.pathologicalState === 'Parkinsonian') {
            sState.releaseRate = 0.01;
            sState.datActivity = 0.2;
        }

        // 40-42. Degradation & Metabolites
        if (sState.cleftDA.length > 0) {
            const degraded = Math.random() * sState.maoActivity * 0.1;
            sState.metabolites.dopac += degraded;
            sState.metabolites.hva += degraded * sState.comtActivity;
        }
    };

    G.renderSynapse = function (ctx, project) {
        const cam = G.state.camera;
        const w = G.width;
        const h = G.height;
        const sState = G.synapseState;

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

        // Render DA molecules
        sState.cleftDA.forEach(da => {
            const p = project(da.x, da.y, da.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) {
                ctx.fillStyle = '#00ff00';
                ctx.globalAlpha = da.life / 200;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2 * p.scale, 0, Math.PI * 2);
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
        ctx.fillText(`State: ${sState.pathologicalState}`, 10, h - 40);
    };
})();
