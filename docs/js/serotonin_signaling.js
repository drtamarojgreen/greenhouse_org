/**
 * @file serotonin_signaling.js
 * @description Intracellular signaling and electrophysiology for the Serotonin simulation.
 */

(function () {
    'use strict';

    const G = window.GreenhouseSerotonin || {};
    window.GreenhouseSerotonin = G;

    G.Signaling = {
        cAMP: 0,
        calcium: 0,
        ip3: 0,
        dag: 0,
        pkc: 0,
        rhoA: 0,
        akt: 0,
        creb: 0,
        adaptation: 0,
        inputResistance: 100, // MOhms
        membranePotential: -70, // mV
        pulses: [],

        updateSignaling() {
            let totalGi = 0;
            let totalGs = 0;
            let totalGq = 0;
            let totalIonotropic = 0;
            let girkActivation = 0;
            let ht2aActive = false;
            let ht4Active = false;

            if (G.state.receptors) {
                G.state.receptors.forEach(r => {
                    const efficiency = r.couplingEfficiency || 1.0;
                    if (r.state === 'Active') {
                        if (r.coupling === 'Gi/o') {
                            totalGi += efficiency;
                            // Gβγ-mediated GIRK activation
                            girkActivation += efficiency * 0.8;
                        }
                        if (r.coupling === 'Gs') {
                            totalGs += efficiency;
                            if (r.type === '5-HT4') ht4Active = true;
                        }
                        if (r.coupling === 'Gq/11') {
                            totalGq += efficiency * (r.pathwayBias || 1.0);
                            if (r.type === '5-HT2A') ht2aActive = true;
                        }
                        if (r.coupling === 'Ionotropic') totalIonotropic += efficiency;
                    }
                });
            }

            // cAMP dynamics
            const adenylateCyclaseBase = 0.1;
            this.cAMP += (totalGs * 0.5) - (totalGi * 0.4) - (this.cAMP * 0.05);
            this.cAMP = Math.max(0, this.cAMP);

            // Calcium/PLC dynamics
            this.ip3 += (totalGq * 0.3) - (this.ip3 * 0.1);
            this.dag += (totalGq * 0.2) - (this.dag * 0.1);

            // Protein Kinase C (PKC) Isoforms (Category 3, #25)
            this.pkc += (this.dag * 0.5 + this.calcium * 0.1) - (this.pkc * 0.05);

            // RhoA/ROCK Pathway (Category 3, #26)
            this.rhoA += (totalGq * 0.4) - (this.rhoA * 0.05);

            // AKT/mTOR Pathway (Category 3, #28)
            this.akt += (this.cAMP * 0.2 + totalGs * 0.3) - (this.akt * 0.03);

            // CREB Transcription factor (Category 3, #29)
            this.creb += (this.cAMP * 0.1 + this.calcium * 0.1 + this.akt * 0.05) - (this.creb * 0.01);

            // Calcium Oscillations (Stochastic ER release)
            const erReleaseThreshold = 0.5;
            if (this.ip3 > erReleaseThreshold && Math.random() < this.ip3 * 0.05) {
                this.calcium += 2.0; // Oscillatory spike
                this.triggerPulse(0, 0, 0); // Internal visual pulse
            }
            this.calcium += (totalIonotropic * 0.5) - (this.calcium * 0.1);
            this.calcium = Math.max(0, this.calcium);

            // Co-transmission (Glutamate)
            // If VGLUT3 is co-releasing glutamate, it adds to ionotropic effect
            const glutamateEffect = (G.Transport && G.Transport.glutamateCoRelease) ? 2.0 : 0;

            // Electrophysiology
            // 5-HT1A (Gi/o) opens GIRK via Gβγ -> Hyperpolarization
            // 5-HT2A (Gq) can close K+ channels -> Depolarization
            // 5-HT3 (Ionotropic) -> Rapid Depolarization
            const girkEffect = girkActivation * -2.5;
            const hcnEffect = (this.cAMP * 0.5); // Ih current modulation
            const ionotropicEffect = (totalIonotropic + glutamateEffect) * 5;

            // NMDA/AMPA Potentiation (5-HT2A and 5-HT4 mediated)
            const potentiationFactor = (ht2aActive || ht4Active) ? 1.5 : 1.0;

            // A-type Potassium Current (Kv4.2) modulation
            // 5-HT often inhibits Kv4.2 to increase dendritic excitability
            const kv42Inhibition = (totalGq > 0.5) ? 1.2 : 1.0;

            const excitabilityShift = (ionotropicEffect * potentiationFactor * kv42Inhibition);

            // Membrane Resistance Modulation (Category 6, #57)
            this.inputResistance = 100 * (1.0 + (girkActivation * -0.2) + (this.cAMP * 0.05));
            const resistanceFactor = this.inputResistance / 100;

            // Spike Frequency Adaptation (Category 6, #56)
            // If Vmem is high, adaptation builds up to slow down firing
            if (this.membranePotential > -50) {
                this.adaptation += 0.2;
            } else {
                this.adaptation *= 0.98;
            }

            this.membranePotential += (girkEffect + hcnEffect + excitabilityShift - (this.adaptation * 0.5)) * resistanceFactor + (-70 - this.membranePotential) * 0.05;

            // Update pulses
            this.pulses = this.pulses.filter(p => {
                p.radius += 5;
                p.life -= 0.02;
                return p.life > 0;
            });
        },

        triggerPulse(x, y, z) {
            this.pulses.push({ x, y, z, radius: 10, life: 1.0 });
        },

        renderSignaling(ctx, project, cam, w, h) {
            // Render intracellular signaling "glow" based on Calcium/cAMP
            const glowIntensity = Math.min(0.3, (this.calcium + this.cAMP * 0.1) * 0.05);
            if (glowIntensity > 0) {
                const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
                grad.addColorStop(0, `rgba(0, 255, 255, ${glowIntensity})`);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
            }

            // Render pulses
            this.pulses.forEach(p => {
                const pt = project(p.x, p.y, p.z, cam, { width: w, height: h, near: 10, far: 5000 });
                if (pt.scale > 0) {
                    ctx.strokeStyle = `rgba(0, 255, 200, ${p.life})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, p.radius * pt.scale, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });

            // HUD for signaling levels
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(w - 210, 10, 200, 220);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('INTRACELLULAR SIGNALING', w - 200, 30);

            ctx.font = '11px Arial';
            ctx.fillText(`cAMP: ${this.cAMP.toFixed(2)}`, w - 200, 50);
            ctx.fillText(`Calcium: ${this.calcium.toFixed(2)}`, w - 200, 70);
            ctx.fillText(`IP3: ${this.ip3.toFixed(2)}`, w - 200, 90);
            ctx.fillText(`PKC: ${this.pkc.toFixed(2)}`, w - 200, 105);
            ctx.fillText(`RhoA: ${this.rhoA.toFixed(2)}`, w - 200, 120);
            ctx.fillText(`AKT: ${this.akt.toFixed(2)}`, w - 200, 135);
            ctx.fillText(`CREB: ${this.creb.toFixed(2)}`, w - 200, 150);
            ctx.fillText(`Rin: ${this.inputResistance.toFixed(1)} MΩ`, w - 200, 162);
            ctx.fillText(`Adaptation: ${this.adaptation.toFixed(2)}`, w - 200, 174);
            ctx.fillText(`Vmem: ${this.membranePotential.toFixed(1)} mV`, w - 200, 186);

            if (G.Transport && G.Transport.glutamateCoRelease) {
                ctx.fillStyle = '#ffcc00';
                ctx.fillText('Glutamate Co-transmission: ON', w - 200, 135);
            }

            // Draw membrane potential bar
            ctx.fillStyle = '#444';
            ctx.fillRect(w - 200, 190, 180, 8);
            const vWidth = ((this.membranePotential + 90) / 60) * 180;
            ctx.fillStyle = this.membranePotential > -60 ? '#ff4d4d' : '#4d79ff';
            ctx.fillRect(w - 200, 190, Math.max(0, Math.min(180, vWidth)), 8);

            // Draw Pathway Bias indicator for 5-HT2A if active
            const ht2a = G.state.receptors ? G.state.receptors.find(r => r.type === '5-HT2A') : null;
            if (ht2a && ht2a.state === 'Active') {
                ctx.fillStyle = ht2a.biasedLigand ? '#ff00ff' : '#ff4d4d';
                ctx.fillText(ht2a.biasedLigand ? 'Biased Agonism Active' : 'Balanced Agonism', w - 200, 150);
            }
        }
    };

    const oldUpdate = G.update;
    G.update = function() {
        if (oldUpdate) oldUpdate.call(G);
        G.Signaling.updateSignaling();
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

        G.Signaling.renderSignaling(ctx, project, cam, w, h);
    };

})();
