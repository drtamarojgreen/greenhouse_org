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
        membranePotential: -70, // mV
        pulses: [],

        updateSignaling() {
            let totalGi = 0;
            let totalGs = 0;
            let totalGq = 0;
            let totalIonotropic = 0;

            if (G.state.receptors) {
                G.state.receptors.forEach(r => {
                    if (r.state === 'Active') {
                        if (r.coupling === 'Gi/o') totalGi++;
                        if (r.coupling === 'Gs') totalGs++;
                        if (r.coupling === 'Gq/11') totalGq++;
                        if (r.coupling === 'Ionotropic') totalIonotropic++;
                    }
                });
            }

            // cAMP dynamics
            const adenylateCyclaseBase = 0.1;
            this.cAMP += (totalGs * 0.5) - (totalGi * 0.4) - (this.cAMP * 0.05);
            this.cAMP = Math.max(0, this.cAMP);

            // Calcium/PLC dynamics
            this.ip3 += (totalGq * 0.3) - (this.ip3 * 0.1);
            this.calcium += (this.ip3 * 0.2) + (totalIonotropic * 0.5) - (this.calcium * 0.1);
            this.calcium = Math.max(0, this.calcium);

            // Electrophysiology
            // 5-HT1A (Gi/o) opens GIRK -> Hyperpolarization
            // 5-HT2A (Gq) can close K+ channels -> Depolarization
            // 5-HT3 (Ionotropic) -> Rapid Depolarization
            const girkEffect = totalGi * -2;
            const hcnEffect = (this.cAMP * 0.5); // Ih current modulation
            const ionotropicEffect = totalIonotropic * 5;

            this.membranePotential += (girkEffect + hcnEffect + ionotropicEffect + (-70 - this.membranePotential) * 0.05);

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
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(w - 200, 10, 190, 120);
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`cAMP: ${this.cAMP.toFixed(2)}`, w - 190, 30);
            ctx.fillText(`Calcium: ${this.calcium.toFixed(2)}`, w - 190, 50);
            ctx.fillText(`IP3: ${this.ip3.toFixed(2)}`, w - 190, 70);
            ctx.fillText(`Vmem: ${this.membranePotential.toFixed(1)} mV`, w - 190, 90);

            // Draw membrane potential bar
            ctx.fillStyle = '#444';
            ctx.fillRect(w - 190, 100, 170, 10);
            const vWidth = ((this.membranePotential + 90) / 60) * 170; // Map -90..-30 to 0..170
            ctx.fillStyle = this.membranePotential > -60 ? '#ff4d4d' : '#4d79ff';
            ctx.fillRect(w - 190, 100, Math.max(0, Math.min(170, vWidth)), 10);
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
