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
        gProteins: [], // 2. G-Protein Cycle: Dissociation of Gα from Gβγ
        campMicrodomains: [],
        darpp32: { thr34: 0, thr75: 0, pp1Inhibited: false },
        pka: { reg: 10, cat: 0 }, // 13. PKA Holoenzyme Dynamics
        crebActivation: 0,
        deltaFosB: 0,
        internalizedReceptors: [], // 9. Receptor Internalization
        betaArrestin: [], // 7. Beta-Arrestin Recruitment
        rgsProteins: { active: true, factor: 1.5 }, // 6. RGS proteins
        grkPhosphorylation: 0, // 8. GRK Phosphorylation
        camkii: { active: 0, calmodulin: 0 }, // 20. Calmodulin/CaMKII Activation
        heteromers: { d1d2: 0 }, // 1. D1-D2 Heteromerization
        plcPathway: { ip3: 0, dag: 0, pkc: 0 }, // 5. Gq Pathway, 18. IP3, 19. DAG
        erkPathway: 0, // 16. ERK/MAPK Cascade
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
            if (mState.gProteins.length < 30) {
                const type = state.mode.includes('D1') ? 'Gs' : (state.mode === 'Heteromer' ? 'Gq' : 'Gi');
                const x = (Math.random() - 0.5) * 300;
                const z = (Math.random() - 0.5) * 100;

                // 2. Visualize dissociation of Gα from Gβγ subunits
                mState.gProteins.push({
                    x: x, y: 0, z: z,
                    type: type,
                    subunit: 'alpha',
                    life: 100 + Math.random() * 50,
                    vx: (Math.random() - 0.5) * 2,
                    vy: 0.8
                });
                mState.gProteins.push({
                    x: x, y: 0, z: z,
                    type: type,
                    subunit: 'betagamma',
                    life: 100 + Math.random() * 50,
                    vx: (Math.random() - 0.5) * 2,
                    vy: 0.5
                });
            }
            // 8. GRK Phosphorylation feedback
            mState.grkPhosphorylation = Math.min(1, mState.grkPhosphorylation + 0.002);
        } else {
            mState.grkPhosphorylation = Math.max(0, mState.grkPhosphorylation - 0.001);
        }

        for (let i = mState.gProteins.length - 1; i >= 0; i--) {
            const gp = mState.gProteins[i];
            // 6. RGS proteins accelerate termination (accelerate GTP hydrolysis)
            const rgsFactor = mState.rgsProteins.active ? mState.rgsProteins.factor : 1.0;
            gp.life -= 1 * rgsFactor;

            // Subunits move independently
            gp.x += gp.vx || 0;
            gp.y += gp.vy || 0.8;

            if (gp.life <= 0) mState.gProteins.splice(i, 1);
        }

        // 12. cAMP Microdomains & 17. PDE Activity
        if (state.mode.includes('D1') && state.signalingActive) {
            if (Math.random() > 0.85) {
                mState.campMicrodomains.push({
                    x: (Math.random() - 0.5) * 400,
                    y: 50 + (Math.random() * 100),
                    z: (Math.random() - 0.5) * 100,
                    radius: 2,
                    life: 60
                });
            }
        }

        for (let i = mState.campMicrodomains.length - 1; i >= 0; i--) {
            const m = mState.campMicrodomains[i];
            m.radius += 0.4; // 12. Local cAMP gradients
            m.life -= 1.2; // 17. PDE-mediated degradation
            if (m.life <= 0) mState.campMicrodomains.splice(i, 1);
        }

        // 13. PKA Holoenzyme Dynamics
        const campLevel = mState.campMicrodomains.length;
        if (campLevel > 10 && mState.pka.reg > 0) {
            mState.pka.reg -= 0.1;
            mState.pka.cat += 0.1;
        } else if (campLevel < 5 && mState.pka.cat > 0) {
            mState.pka.reg += 0.1;
            mState.pka.cat -= 0.1;
        }

        // 14. DARPP-32 Cycle
        if (mState.pka.cat > 2) {
            mState.darpp32.thr34 = Math.min(1, mState.darpp32.thr34 + 0.01);
        } else {
            mState.darpp32.thr34 = Math.max(0, mState.darpp32.thr34 - 0.005);
        }
        mState.darpp32.pp1Inhibited = mState.darpp32.thr34 > 0.6;

        // 16. ERK/MAPK Cascade
        if (state.signalingActive) {
            mState.erkPathway = Math.min(1, mState.erkPathway + 0.003);
        } else {
            mState.erkPathway = Math.max(0, mState.erkPathway - 0.002);
        }

        // 65. CREB Activation
        if (mState.darpp32.thr34 > 0.7 || mState.erkPathway > 0.8) {
            mState.crebActivation = Math.min(1, mState.crebActivation + 0.005);
        } else {
            mState.crebActivation = Math.max(0, mState.crebActivation - 0.001);
        }

        // 1. D1-D2 Heteromerization & 5. Gq Pathway
        if (state.mode === 'Heteromer' && state.signalingActive) {
            mState.heteromers.d1d2 = Math.min(1, mState.heteromers.d1d2 + 0.01);
            mState.plcPathway.ip3 = Math.min(1, mState.plcPathway.ip3 + 0.02);
            mState.plcPathway.dag = Math.min(1, mState.plcPathway.dag + 0.02);
            mState.plcPathway.pkc = Math.min(1, mState.plcPathway.pkc + 0.015);

            // 20. CaMKII Activation via Gq-mediated Ca2+ rise (simplified)
            mState.camkii.calmodulin = Math.min(1, mState.camkii.calmodulin + 0.05);
        } else {
            mState.heteromers.d1d2 = Math.max(0, mState.heteromers.d1d2 - 0.005);
            mState.plcPathway.ip3 *= 0.98;
            mState.plcPathway.dag *= 0.98;
            mState.plcPathway.pkc *= 0.98;
        }

        // 7. Beta-Arrestin Recruitment & 9. Receptor Internalization
        if (mState.grkPhosphorylation > 0.8 && state.signalingActive) {
            if (Math.random() > 0.97) {
                mState.betaArrestin.push({ x: (Math.random()-0.5)*100, y: 0, z: (Math.random()-0.5)*50, life: 120 });
            }
            if (mState.betaArrestin.length > 5 && Math.random() > 0.9) {
                // Internalize a receptor
                mState.internalizedReceptors.push({
                    x: (Math.random() - 0.5) * 100,
                    y: 0,
                    z: (Math.random() - 0.5) * 50,
                    life: 300 // Time until recycling
                });
            }
        }

        for (let i = mState.betaArrestin.length - 1; i >= 0; i--) {
            mState.betaArrestin[i].life--;
            mState.betaArrestin[i].y += 0.5;
            if (mState.betaArrestin[i].life <= 0) mState.betaArrestin.splice(i, 1);
        }

        // 10. Receptor Recycling
        for (let i = mState.internalizedReceptors.length - 1; i >= 0; i--) {
            const r = mState.internalizedReceptors[i];
            r.life--;
            r.y += 0.2; // Move deeper into cytosol
            if (r.life <= 0) mState.internalizedReceptors.splice(i, 1);
        }

        // 20. CaMKII Auto-phosphorylation & Decay
        if (mState.camkii.calmodulin > 0.5) {
            mState.camkii.active = Math.min(1, mState.camkii.active + 0.02);
        }
        mState.camkii.calmodulin *= 0.95;
        mState.camkii.active *= 0.99;
    };

    G.renderMolecular = function (ctx, project) {
        const cam = G.state.camera;
        const w = G.width;
        const h = G.height;
        const mState = G.molecularState;

        // Render CaMKII activation (halo around receptors when active)
        if (mState.camkii.active > 0.1) {
            G.state.receptors.forEach(r => {
                const p = project(r.x, r.y, r.z, cam, { width: w, height: h, near: 10, far: 5000 });
                if (p.scale > 0) {
                    ctx.strokeStyle = '#ffff00';
                    ctx.globalAlpha = mState.camkii.active * 0.5;
                    ctx.lineWidth = 10 * p.scale;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 40 * p.scale, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 1.0;
                }
            });
        }

        // Render G-Proteins (Subunits)
        mState.gProteins.forEach(gp => {
            const p = project(gp.x, gp.y, gp.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) {
                if (gp.type === 'Gs') ctx.fillStyle = gp.subunit === 'alpha' ? '#ff9999' : '#ffcccc';
                else if (gp.type === 'Gq') ctx.fillStyle = gp.subunit === 'alpha' ? '#99ff99' : '#ccffcc';
                else ctx.fillStyle = gp.subunit === 'alpha' ? '#9999ff' : '#ccccff';

                ctx.globalAlpha = Math.min(1, gp.life / 100);
                const size = gp.subunit === 'alpha' ? 4 : 3;
                ctx.beginPath();
                if (gp.subunit === 'alpha') {
                    ctx.arc(p.x, p.y, size * p.scale, 0, Math.PI * 2);
                } else {
                    // Render Gβγ as a small ellipse or distinct shape
                    ctx.ellipse(p.x, p.y, size * p.scale, (size / 1.5) * p.scale, 0, 0, Math.PI * 2);
                }
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        });

        // 9. Render Internalized Receptors
        mState.internalizedReceptors.forEach(r => {
            const p = project(r.x, r.y + 50, r.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) {
                ctx.strokeStyle = '#fff';
                ctx.setLineDash([2, 2]);
                ctx.beginPath();
                ctx.arc(p.x, p.y, 10 * p.scale, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
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

        // Additional indicators
        if (mState.plcPathway.pkc > 0.1) {
            ctx.fillStyle = '#99ff99';
            ctx.fillText(`PKC Activation: ${(mState.plcPathway.pkc * 100).toFixed(1)}%`, w - 10, 100);
        }
        if (mState.erkPathway > 0.1) {
            ctx.fillStyle = '#ff99ff';
            ctx.fillText(`ERK/MAPK: ${(mState.erkPathway * 100).toFixed(1)}%`, w - 10, 120);
        }
    };
})();
