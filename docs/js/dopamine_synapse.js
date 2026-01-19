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
            rrp: [], // Readily Releasable Pool
            reserve: [] // Reserve Pool
        },
        cleftDA: [], // Dopamine molecules in the cleft
        datActivity: 1.0,
        releaseRate: 0.1,
        pathologicalState: 'Healthy', // Healthy, Parkinsonian, etc.
        volumeTransmission: true
    };

    // Initialize vesicles
    for (let i = 0; i < 20; i++) {
        G.synapseState.vesicles.rrp.push({ y: -180, x: (Math.random() - 0.5) * 100, filled: true });
        G.synapseState.vesicles.reserve.push({ y: -250, x: (Math.random() - 0.5) * 150, filled: true });
    }

    G.updateSynapse = function () {
        const state = G.state;
        const sState = G.synapseState;

        // 29. Phasic Release Patterns & 30. Tonic Release
        let releaseChance = sState.releaseRate;
        if (state.mode === 'Phasic Burst') releaseChance = 0.5;

        if (Math.random() < releaseChance && sState.vesicles.rrp.length > 0) {
            // 28. Synaptotagmin Calcium Sensing (Simplified)
            const v = sState.vesicles.rrp.pop();
            // Release DA molecules
            for (let i = 0; i < 10; i++) {
                sState.cleftDA.push({
                    x: v.x + (Math.random() - 0.5) * 10,
                    y: -170,
                    z: (Math.random() - 0.5) * 10,
                    vx: (Math.random() - 0.5) * 2,
                    vy: Math.random() * 2 + 1,
                    vz: (Math.random() - 0.5) * 2,
                    life: 200
                });
            }
            // 34. Vesicle Endocytosis
            setTimeout(() => {
                sState.vesicles.reserve.push({ y: -250, x: (Math.random() - 0.5) * 150, filled: false });
            }, 1000);
        }

        // 25. Vesicle Filling & 26. RRP replenishment
        if (sState.vesicles.rrp.length < 10 && sState.vesicles.reserve.length > 0) {
            const v = sState.vesicles.reserve.shift();
            v.y = -180;
            v.filled = true;
            sState.vesicles.rrp.push(v);
        }

        // 36. DAT-Mediated Reuptake & 38. Volume Transmission
        sState.cleftDA.forEach((da, index) => {
            da.x += da.vx;
            da.y += da.vy;
            da.z += da.vz;
            da.life--;

            // Reuptake at the top (presynaptic)
            if (da.y < -160 && Math.random() < 0.05 * sState.datActivity) {
                sState.cleftDA.splice(index, 1);
            } else if (da.life <= 0) {
                sState.cleftDA.splice(index, 1);
            }
        });

        // 81. Parkinsonian DA Depletion
        if (sState.pathologicalState === 'Parkinsonian') {
            sState.releaseRate = 0.01;
            sState.datActivity = 0.2;
        }
    };

    G.renderSynapse = function (ctx, project) {
        const cam = G.state.camera;
        const w = G.width;
        const h = G.height;
        const sState = G.synapseState;

        // Render Vesicles
        sState.vesicles.rrp.forEach(v => {
            const p = project(v.x, v.y, 0, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) {
                ctx.fillStyle = '#aaa';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 8 * p.scale, 0, Math.PI * 2);
                ctx.fill();
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
        ctx.fillText(`DAT Activity: ${(sState.datActivity * 100).toFixed(0)}%`, 10, h - 60);
        ctx.fillText(`State: ${sState.pathologicalState}`, 10, h - 40);
    };
})();
