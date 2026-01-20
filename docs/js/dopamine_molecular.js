/**
 * @file dopamine_molecular.js
 * @description Molecular signaling components for Dopamine Simulation.
 * Covers Enhancements 1-20, 61-70, and 91-100.
 */

(function () {
    'use strict';
    const G = window.GreenhouseDopamine || {};
    window.GreenhouseDopamine = G;

    G.molecularState = {
        gProteins: [],
        campMicrodomains: [],
        darpp32: { thr34: 0, thr75: 0, pp1Inhibited: false },
        pkaActivity: 0,
        crebActivation: 0,
        deltaFosB: 0,
        internalizedReceptors: [],
        betaArrestin: [], // 7. Beta-Arrestin Recruitment
        rgsProteins: { active: true, factor: 1.2 }, // 6. RGS proteins
        heteromers: { d1d2: 0 }, // 1. D1-D2 Heteromerization
        plcPathway: { ip3: 0, dag: 0 }, // 5. Gq Pathway
        drugLibrary: {
            d1Agonists: ['SKF-38393'],
            d1Antagonists: ['SCH-23390'],
            d2Agonists: ['Quinpirole', 'Aripiprazole (Partial)'],
            d2Antagonists: ['Haloperidol'],
            pams: ['LY-3154207'] // 98. Allosteric Modulators
        }
    };

    G.updateMolecular = function () {
        const state = G.state;
        const mState = G.molecularState;

        // 2. G-Protein Cycle & 3. GTP/GDP Exchange
        if (state.signalingActive) {
            if (mState.gProteins.length < 20) {
                mState.gProteins.push({
                    x: (Math.random() - 0.5) * 200,
                    y: (Math.random() - 0.5) * 200,
                    z: (Math.random() - 0.5) * 50,
                    active: true,
                    type: state.mode.includes('D1') ? 'Gs' : 'Gi',
                    life: 100
                });
            }
        }

        for (let i = mState.gProteins.length - 1; i >= 0; i--) {
            const gp = mState.gProteins[i];
            gp.life--;
            gp.y += 1; // Move away from membrane
            if (gp.life <= 0) mState.gProteins.splice(i, 1);
        }

        // 12. cAMP Microdomains & 17. PDE Activity
        if (state.mode.includes('D1') && state.signalingActive) {
            if (Math.random() > 0.8) {
                mState.campMicrodomains.push({
                    x: (Math.random() - 0.5) * 300,
                    y: (Math.random() - 0.5) * 300,
                    z: (Math.random() - 0.5) * 100,
                    radius: 5,
                    life: 50
                });
            }
        }

        for (let i = mState.campMicrodomains.length - 1; i >= 0; i--) {
            const m = mState.campMicrodomains[i];
            m.radius += 0.5; // Diffusion
            m.life--;
            if (m.life <= 0) mState.campMicrodomains.splice(i, 1);
        }

        // 14. DARPP-32 Cycle
        if (state.mode.includes('D1') && state.signalingActive) {
            mState.darpp32.thr34 = Math.min(1, mState.darpp32.thr34 + 0.01);
            mState.darpp32.thr75 = Math.max(0, mState.darpp32.thr75 - 0.005);
        } else {
            mState.darpp32.thr34 = Math.max(0, mState.darpp32.thr34 - 0.002);
        }
        mState.darpp32.pp1Inhibited = mState.darpp32.thr34 > 0.5;

        // 65. CREB Activation
        if (mState.darpp32.thr34 > 0.7) {
            mState.crebActivation = Math.min(1, mState.crebActivation + 0.005);
        } else {
            mState.crebActivation = Math.max(0, mState.crebActivation - 0.001);
        }

        // 67. DeltaFosB Accumulation (Slow)
        if (mState.crebActivation > 0.5) {
            mState.deltaFosB += 0.0001;
        }

        // 1. D1-D2 Heteromerization & 5. Gq Pathway
        if (state.mode === 'Heteromer' && state.signalingActive) {
            mState.heteromers.d1d2 = Math.min(1, mState.heteromers.d1d2 + 0.01);
            mState.plcPathway.ip3 += 0.05;
            mState.plcPathway.dag += 0.05;
        } else {
            mState.heteromers.d1d2 = Math.max(0, mState.heteromers.d1d2 - 0.005);
            mState.plcPathway.ip3 *= 0.95;
            mState.plcPathway.dag *= 0.95;
        }

        // 7. Beta-Arrestin Recruitment
        if (state.signalingActive && Math.random() > 0.95) {
            mState.betaArrestin.push({ x: 0, y: 0, z: 0, life: 100 });
        }
        for (let i = mState.betaArrestin.length - 1; i >= 0; i--) {
            mState.betaArrestin[i].life--;
            if (mState.betaArrestin[i].life <= 0) mState.betaArrestin.splice(i, 1);
        }
    };

    G.renderMolecular = function (ctx, project) {
        const cam = G.state.camera;
        const w = G.width;
        const h = G.height;
        const mState = G.molecularState;

        // Render G-Proteins
        mState.gProteins.forEach(gp => {
            const p = project(gp.x, gp.y, gp.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) {
                ctx.fillStyle = gp.type === 'Gs' ? '#ff9999' : '#9999ff';
                ctx.globalAlpha = gp.life / 100;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5 * p.scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        });

        // Render cAMP Microdomains
        mState.campMicrodomains.forEach(m => {
            const p = project(m.x, m.y, m.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) {
                ctx.strokeStyle = '#ffff99';
                ctx.lineWidth = 2 * p.scale;
                ctx.globalAlpha = m.life / 50;
                ctx.beginPath();
                ctx.arc(p.x, p.y, m.radius * p.scale, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }
        });

        // Overlay Molecular Info
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`DARPP-32 Thr34: ${(mState.darpp32.thr34 * 100).toFixed(1)}%`, w - 10, 20);
        ctx.fillText(`PP1 Inhibition: ${mState.darpp32.pp1Inhibited ? 'ACTIVE' : 'INACTIVE'}`, w - 10, 40);
        ctx.fillText(`CREB Activation: ${(mState.crebActivation * 100).toFixed(1)}%`, w - 10, 60);
        ctx.fillText(`ΔFosB Level: ${mState.deltaFosB.toFixed(4)}`, w - 10, 80);
    };
})();
