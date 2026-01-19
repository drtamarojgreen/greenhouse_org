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

        updateTransport() {
            // TPH Synthesis: Tryptophan -> 5-HT
            const synthesized = this.tryptophan * this.synthesisRate * this.tphActivity * 0.01;
            this.tryptophan -= synthesized;
            this.vesicle5HT += synthesized;

            // VMAT2 Loading into vesicles (simplified as a pool here)
            // Phasic release: every 200 ticks
            if (G.state.timer % 200 === 0 && this.vesicle5HT > 5) {
                const releaseAmount = Math.min(this.vesicle5HT, 10);
                this.vesicle5HT -= releaseAmount;
                for (let i = 0; i < releaseAmount; i++) {
                    if (G.Kinetics) G.Kinetics.spawnLigand('Serotonin', 0, -150, 0);
                }
            }

            // SERT Reuptake
            if (G.Kinetics && G.Kinetics.activeLigands) {
                G.Kinetics.activeLigands.forEach((l, index) => {
                    if (l.name === 'Serotonin' && !l.boundTo) {
                        // SERT is at the top (presynaptic)
                        const distToSert = Math.abs(l.y + 150) + Math.abs(l.x) + Math.abs(l.z);
                        if (distToSert < 50 && Math.random() < this.reuptakeRate * this.sertActivity) {
                            G.Kinetics.activeLigands.splice(index, 1);
                            this.vesicle5HT += 1;
                        }
                    }
                });
            }

            // MAO Degradation
            if (Math.random() < this.degradationRate * this.maoActivity) {
                if (this.vesicle5HT > 0) this.vesicle5HT -= 0.1;
            }

            // Replenish tryptophan
            if (this.tryptophan < 100) this.tryptophan += 0.05;
        },

        renderTransport(ctx, project, cam, w, h) {
            // Draw Pre-synaptic terminal
            const pre = project(0, -200, 0, cam, { width: w, height: h, near: 10, far: 5000 });
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

    const oldUpdate = G.update;
    G.update = function() {
        if (oldUpdate) oldUpdate.call(G);
        G.Transport.updateTransport();
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
