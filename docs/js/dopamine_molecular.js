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
        darpp32: { thr34: 0, thr75: 0.2, pp1Inhibited: false }, // 14. DARPP-32 Cycle, 15. PP1 Inhibition
        pka: { reg: 10, cat: 0, subunits: [] }, // 13. PKA Holoenzyme Dynamics
        ac5: { activity: 0, inhibitedByCa: false }, // 11. Adenylate Cyclase Isoforms (AC5)
        pde: { pde4: 1.0, pde10a: 1.0 }, // 17. PDE Activity
        crebActivation: 0,
        deltaFosB: 0,
        internalizedReceptors: [], // 9. Receptor Internalization, 10. Receptor Recycling
        betaArrestin: [], // 7. Beta-Arrestin Recruitment
        rgsProteins: { active: true, factor: 1.5, visual: [] }, // 6. RGS proteins
        grkPhosphorylation: 0, // 8. GRK Phosphorylation
        camkii: { active: 0, calmodulin: 0 }, // 20. Calmodulin/CaMKII Activation
        er: { x: 0, y: 300, z: 0, width: 300, height: 80, caContent: 1.0 }, // 18. Endoplasmic Reticulum
        heteromers: { d1d2: 0 }, // 1. D1-D2 Heteromerization
        plcPathway: { ip3: 0, dag: 0, pkc: 0, ip3Particles: [] }, // 5. Gq Pathway, 18. IP3, 19. DAG
        erkPathway: { level: 0, visual: [] }, // 16. ERK/MAPK Cascade
        drugLibrary: {
            d1Agonists: [
                { name: 'SKF-38393', ki: 1.0, efficacy: 0.8 },
                { name: 'Fenoldopam', ki: 2.3, efficacy: 1.0 },
                { name: 'A-77636', ki: 1.1, efficacy: 1.0 }
            ],
            d1Antagonists: [
                { name: 'SCH-23390', ki: 0.2, efficacy: 0 },
                { name: 'Ecopipam', ki: 0.1, efficacy: 0 }
            ],
            d2Agonists: [
                { name: 'Quinpirole', ki: 4.8, efficacy: 0.9 },
                { name: 'Bromocriptine', ki: 2.5, efficacy: 0.8 },
                { name: 'Pramipexole', ki: 2.2, efficacy: 1.0 }
            ],
            d2Antagonists: [
                { name: 'Haloperidol', ki: 0.5, efficacy: 0 },
                { name: 'Risperidone', ki: 3.0, efficacy: 0 },
                { name: 'Clozapine', ki: 125, efficacy: 0 }
            ],
            pams: [
                { name: 'LY-3154207', ki: 10, efficacy: 1.5 },
                { name: 'DETQ', ki: 15, efficacy: 1.2 }
            ] // 98. Allosteric Modulators
        }
    };

    G.updateMolecular = function () {
        const state = G.state;
        const mState = G.molecularState;

        // 2. G-Protein Cycle & 3. GTP/GDP Exchange Rates
        // Constants (simplified but based on ~0.1 - 1.0 s^-1 rates)
        const kGtpBinding = 0.5;
        const kGdpRelease = 0.1;

        if (state.signalingActive) {
            if (mState.gProteins.length < 30) {
                const type = state.mode.includes('D1') ? 'Gs' : (state.mode === 'Heteromer' ? 'Gq' : 'Gi');
                const x = (Math.random() - 0.5) * 300;
                const z = (Math.random() - 0.5) * 100;

                // 2. Visualize dissociation of Gα from Gβγ subunits
                // 3. GTP binding state
                mState.gProteins.push({
                    x: x, y: 0, z: z,
                    type: type,
                    subunit: 'alpha',
                    gtpBound: false,
                    exchangeTimer: 0,
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

        // 6. RGS Protein Logic
        if (mState.rgsProteins.active && mState.gProteins.length > 5 && Math.random() > 0.95) {
            mState.rgsProteins.visual.push({
                x: (Math.random() - 0.5) * 300,
                y: 100 + Math.random() * 50,
                z: (Math.random() - 0.5) * 100,
                life: 60
            });
        }
        for (let i = mState.rgsProteins.visual.length - 1; i >= 0; i--) {
            const rgs = mState.rgsProteins.visual[i];
            rgs.life--;
            // Find nearby G-alpha and speed up its decay
            mState.gProteins.forEach(gp => {
                if (gp.subunit === 'alpha' && Math.abs(gp.x - rgs.x) < 50 && Math.abs(gp.y - rgs.y) < 50) {
                    gp.life -= 5;
                    rgs.x += (gp.x - rgs.x) * 0.1;
                    rgs.y += (gp.y - rgs.y) * 0.1;
                }
            });
            if (rgs.life <= 0) mState.rgsProteins.visual.splice(i, 1);
        }

        for (let i = mState.gProteins.length - 1; i >= 0; i--) {
            const gp = mState.gProteins[i];

            if (gp.subunit === 'alpha') {
                // 3. GTP/GDP Exchange logic
                if (!gp.gtpBound) {
                    gp.exchangeTimer += kGdpRelease; // Simulate GDP release
                    if (gp.exchangeTimer >= 1.0) {
                        gp.gtpBound = true;
                        gp.exchangeTimer = 0;
                    }
                } else {
                    // 6. RGS proteins accelerate termination (accelerate GTP hydrolysis)
                    const rgsFactor = mState.rgsProteins.active ? mState.rgsProteins.factor : 1.0;
                    gp.life -= 1 * rgsFactor;
                }
            } else {
                gp.life -= 1.0;
            }

            // Subunits move independently
            gp.x += gp.vx || 0;
            gp.y += gp.vy || 0.8;

            if (gp.life <= 0) mState.gProteins.splice(i, 1);
        }

        // 11. AC5 Activity modeled by Gs/Gi balance
        // AC5 is the predominant isoform in striatum
        let acGs = mState.gProteins.filter(gp => gp.type === 'Gs' && gp.subunit === 'alpha').length;
        let acGi = mState.gProteins.filter(gp => gp.type === 'Gi' && gp.subunit === 'alpha').length;

        // Gs stimulates, Gi inhibits AC5
        mState.ac5.activity = Math.max(0, acGs * 0.25 - acGi * 0.4);

        // AC5 is also inhibited by high Ca2+ (Enhancement 11)
        if (mState.camkii.calmodulin > 0.6) {
            mState.ac5.activity *= 0.4;
            mState.ac5.inhibitedByCa = true;
        } else {
            mState.ac5.inhibitedByCa = false;
        }

        // 12. cAMP Microdomains & 17. PDE Activity
        if (mState.ac5.activity > 0.1) {
            if (Math.random() < mState.ac5.activity) {
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

            // 17. PDE-mediated degradation (PDE4 and PDE10A)
            const pdeDegradation = (mState.pde.pde4 + mState.pde.pde10a) * 0.6;
            m.life -= pdeDegradation;

            if (m.life <= 0) mState.campMicrodomains.splice(i, 1);
        }

        // 13. PKA Holoenzyme Dynamics
        const campLevel = mState.campMicrodomains.length;
        if (campLevel > 8 && mState.pka.reg > 0) {
            mState.pka.reg -= 0.1;
            mState.pka.cat += 0.1;

            // Visualize dissociation
            if (Math.random() > 0.9) {
                mState.pka.subunits.push({
                    x: (Math.random() - 0.5) * 200,
                    y: 100,
                    z: (Math.random() - 0.5) * 100,
                    type: 'cat',
                    life: 200,
                    vx: (Math.random() - 0.5) * 1,
                    vy: 0.5 + Math.random() * 0.5
                });
            }
        } else if (campLevel < 4 && mState.pka.cat > 0) {
            mState.pka.reg += 0.1;
            mState.pka.cat -= 0.1;
        }

        // Update PKA subunits
        for (let i = mState.pka.subunits.length - 1; i >= 0; i--) {
            const s = mState.pka.subunits[i];
            s.life--;
            s.x += s.vx;
            s.y += s.vy;
            if (s.life <= 0) mState.pka.subunits.splice(i, 1);
        }

        // 14. DARPP-32 Cycle & 15. PP1 Inhibition
        // Thr34 is phosphorylated by PKA
        if (mState.pka.cat > 2) {
            mState.darpp32.thr34 = Math.min(1, mState.darpp32.thr34 + 0.01);
        } else {
            // 15. PP1 Inhibition: PP1 dephosphorylates Thr34, but is inhibited by Thr34 itself
            const pp1Activity = mState.darpp32.pp1Inhibited ? 0.001 : 0.005;
            mState.darpp32.thr34 = Math.max(0, mState.darpp32.thr34 - pp1Activity);
        }

        // Thr75 is phosphorylated by Cdk5 (Enhancement 14)
        // Cdk5 is often constitutively active or modulated by other pathways
        mState.darpp32.thr75 = Math.min(1.0, mState.darpp32.thr75 + 0.001);

        // Phospho-Thr75-DARPP-32 inhibits PKA (Enhancement 14)
        if (mState.darpp32.thr75 > 0.5) {
            mState.pka.cat *= 0.99;
        }

        mState.darpp32.pp1Inhibited = mState.darpp32.thr34 > 0.6;

        // 16. ERK/MAPK Cascade
        // Activated by D1 signaling and Gq pathway
        if (state.signalingActive) {
            const activationSource = (state.mode.includes('D1') ? 0.003 : 0) + (mState.plcPathway.pkc * 0.01);
            mState.erkPathway.level = Math.min(1.0, mState.erkPathway.level + activationSource);

            if (mState.erkPathway.level > 0.3 && Math.random() > 0.9) {
                mState.erkPathway.visual.push({
                    x: (Math.random()-0.5)*200, y: 150, z: (Math.random()-0.5)*100, life: 90
                });
            }
        } else {
            mState.erkPathway.level = Math.max(0, mState.erkPathway.level - 0.002);
        }
        for (let i = mState.erkPathway.visual.length - 1; i >= 0; i--) {
            const v = mState.erkPathway.visual[i];
            v.life--;
            v.y += 0.3;
            if (v.life <= 0) mState.erkPathway.visual.splice(i, 1);
        }

        // 65. CREB Activation
        if (mState.darpp32.thr34 > 0.7 || mState.erkPathway.level > 0.8) {
            mState.crebActivation = Math.min(1, mState.crebActivation + 0.005);
        } else {
            mState.crebActivation = Math.max(0, mState.crebActivation - 0.001);
        }

        // 98. Allosteric Modulators (PAMs)
        const pamFactor = state.mode === 'PAM' ? 1.5 : 1.0;

        // 1. D1-D2 Heteromerization & 5. Gq Pathway
        if ((state.mode === 'Heteromer' || state.scenarios.heteromer) && state.signalingActive) {
            mState.heteromers.d1d2 = Math.min(1, mState.heteromers.d1d2 + 0.01 * pamFactor);
            mState.plcPathway.ip3 = Math.min(1, mState.plcPathway.ip3 + 0.02 * pamFactor);
            mState.plcPathway.dag = Math.min(1, mState.plcPathway.dag + 0.02);
            mState.plcPathway.pkc = Math.min(1, mState.plcPathway.pkc + 0.015);

            // 18. IP3 Dynamics: visualize diffusion
            if (Math.random() > 0.8) {
                mState.plcPathway.ip3Particles.push({
                    x: (Math.random() - 0.5) * 100,
                    y: 0,
                    z: (Math.random() - 0.5) * 50,
                    life: 150,
                    vx: (Math.random() - 0.5) * 1,
                    vy: 2.0 // Diffuse towards ER (downward in our spatial model)
                });
            }

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
            if (r.life > 50) {
                r.y += 0.2; // Move deeper into cytosol (internalization)
            } else {
                r.y -= 0.8; // Move back to membrane (recycling)
            }
            if (r.life <= 0) mState.internalizedReceptors.splice(i, 1);
        }

        // 18. IP3 Particle Update & ER Interaction
        for (let i = mState.plcPathway.ip3Particles.length - 1; i >= 0; i--) {
            const p = mState.plcPathway.ip3Particles[i];
            p.life--;
            p.x += p.vx;
            p.y += p.vy;

            // Check collision with ER
            if (p.y > mState.er.y - 40 && p.y < mState.er.y + 40 && Math.abs(p.x - mState.er.x) < mState.er.width / 2) {
                // 18. IP3 binds to IP3R on ER, triggering Ca2+ release
                mState.camkii.calmodulin = Math.min(1.0, mState.camkii.calmodulin + 0.1);
                mState.plcPathway.ip3Particles.splice(i, 1);
                continue;
            }

            if (p.life <= 0) mState.plcPathway.ip3Particles.splice(i, 1);
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

        // 18. Render Endoplasmic Reticulum (ER)
        const pER = project(mState.er.x, mState.er.y, mState.er.z, cam, { width: w, height: h, near: 10, far: 5000 });
        if (pER.scale > 0) {
            ctx.strokeStyle = 'rgba(255, 100, 255, 0.4)';
            ctx.lineWidth = 4 * pER.scale;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.ellipse(pER.x, pER.y, (mState.er.width / 2) * pER.scale, (mState.er.height / 2) * pER.scale, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(255, 100, 255, 0.1)';
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = `${10 * pER.scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText("ER (IP3R / Ca2+ Store)", pER.x, pER.y);
        }

        // 8. GRK Phosphorylation visual (pulsing orange on receptors)
        if (mState.grkPhosphorylation > 0.5) {
             G.state.receptors.forEach(r => {
                 const p = project(r.x, r.y, r.z, cam, { width: w, height: h, near: 10, far: 5000 });
                 if (p.scale > 0) {
                     ctx.strokeStyle = '#ff9900';
                     ctx.globalAlpha = (Math.sin(G.state.timer * 0.1) * 0.5 + 0.5) * mState.grkPhosphorylation;
                     ctx.lineWidth = 15 * p.scale;
                     ctx.beginPath();
                     ctx.arc(p.x, p.y, 25 * p.scale, 0, Math.PI * 2);
                     ctx.stroke();
                     ctx.globalAlpha = 1.0;
                 }
             });
        }

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

        // 6. Render RGS Proteins
        mState.rgsProteins.visual.forEach(rgs => {
            const p = project(rgs.x, rgs.y, rgs.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) {
                ctx.fillStyle = '#ff00ff';
                ctx.globalAlpha = rgs.life / 60;
                ctx.fillRect(p.x - 3*p.scale, p.y - 3*p.scale, 6*p.scale, 6*p.scale);
                ctx.globalAlpha = 1.0;
            }
        });

        // Render G-Proteins (Subunits)
        mState.gProteins.forEach(gp => {
            const p = project(gp.x, gp.y, gp.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) {
                if (gp.type === 'Gs') ctx.fillStyle = gp.subunit === 'alpha' ? (gp.gtpBound ? '#ff0000' : '#ff9999') : '#ffcccc';
                else if (gp.type === 'Gq') ctx.fillStyle = gp.subunit === 'alpha' ? (gp.gtpBound ? '#00ff00' : '#99ff99') : '#ccffcc';
                else ctx.fillStyle = gp.subunit === 'alpha' ? (gp.gtpBound ? '#0000ff' : '#9999ff') : '#ccccff';

                ctx.globalAlpha = Math.min(1, gp.life / 100);
                const size = gp.subunit === 'alpha' ? 4 : 3;
                ctx.beginPath();
                if (gp.subunit === 'alpha') {
                    ctx.arc(p.x, p.y, size * p.scale, 0, Math.PI * 2);
                    // 3. GDP/GTP Visual indicator (Glow if bound)
                    if (gp.gtpBound) {
                        ctx.shadowBlur = 5 * p.scale;
                        ctx.shadowColor = ctx.fillStyle;
                    }
                    ctx.fill();
                    ctx.shadowBlur = 0;
                } else {
                    // Render Gβγ as a small ellipse or distinct shape
                    ctx.ellipse(p.x, p.y, size * p.scale, (size / 1.5) * p.scale, 0, 0, Math.PI * 2);
                }
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        });

        // 18. Render IP3 Particles
        mState.plcPathway.ip3Particles.forEach(ip3 => {
            const p = project(ip3.x, ip3.y, ip3.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) {
                ctx.fillStyle = '#00ffff';
                ctx.globalAlpha = Math.min(1, ip3.life / 50);
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2 * p.scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        });

        // 19. Render DAG (Membrane-bound yellow dots)
        if (mState.plcPathway.dag > 0.2) {
            for (let i = 0; i < 20; i++) {
                const angle = (i / 20) * Math.PI * 2 + G.state.timer * 0.01;
                const r = 250; // Membrane radius approximation
                const dx = Math.cos(angle) * r;
                const dz = Math.sin(angle) * r;
                const p = project(dx, 0, dz, cam, { width: w, height: h, near: 10, far: 5000 });
                if (p.scale > 0) {
                    ctx.fillStyle = '#ffff00';
                    ctx.globalAlpha = mState.plcPathway.dag * 0.5;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 2 * p.scale, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                }
            }
        }

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

        // 13. Render PKA Catalytic Subunits
        mState.pka.subunits.forEach(s => {
            const p = project(s.x, s.y, s.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) {
                ctx.fillStyle = '#ff3300';
                ctx.globalAlpha = Math.min(1, s.life / 50);
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3 * p.scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        });

        // 16. Render ERK/MAPK Cascade visuals
        mState.erkPathway.visual.forEach(v => {
            const p = project(v.x, v.y, v.z, cam, { width: w, height: h, near: 10, far: 5000 });
            if (p.scale > 0) {
                ctx.fillStyle = '#ff00ff';
                ctx.globalAlpha = v.life / 90;
                ctx.font = `${8 * p.scale}px Arial`;
                ctx.fillText("ERK", p.x, p.y);
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
        ctx.fillText(`AC5 Activity: ${(mState.ac5.activity * 100).toFixed(1)}% ${mState.ac5.inhibitedByCa ? '(Ca2+ INHIBITED)' : ''}`, w - 10, h - 300);

        // Additional indicators
        if (mState.plcPathway.pkc > 0.1) {
            ctx.fillStyle = '#99ff99';
            ctx.fillText(`PKC Activation: ${(mState.plcPathway.pkc * 100).toFixed(1)}%`, w - 10, 100);
        }
        if (mState.erkPathway.level > 0.1) {
            ctx.fillStyle = '#ff99ff';
            ctx.fillText(`ERK/MAPK: ${(mState.erkPathway.level * 100).toFixed(1)}%`, w - 10, 120);
        }
    };
})();
