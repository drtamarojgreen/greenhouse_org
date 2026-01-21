// docs/js/synapse_neurotransmitters.js

(function () {
    'use strict';

    const G = window.GreenhouseSynapseApp || {};
    window.GreenhouseSynapseApp = G;

    G.Particles = {
        particles: [],
        ions: [],

        create(w, h, count, config, isBurst) {
            const chem = G.Chemistry;
            if (!chem) return;
            const nt = chem.neurotransmitters[config.activeNT];

            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: w * (0.45 + Math.random() * 0.1),
                    y: h * (isBurst ? 0.38 : 0.32),
                    vx: (Math.random() - 0.5) * 2,
                    vy: isBurst ? (2 + Math.random() * 4) : (1 + Math.random() * 2),
                    life: 1.0,
                    chemistry: nt
                });
            }
        },

        createIon(x, y, ionType) {
            const chem = G.Chemistry;
            if (!chem) return;
            const ion = chem.ions[ionType];
            if (!ion) return;

            for (let i = 0; i < 3; i++) {
                this.ions.push({
                    x: x, y: y,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: 1 + Math.random() * 2,
                    life: 1.0,
                    ion: ion
                });
            }
        },

        updateAndDraw(ctx, w, h) {
            this.particles.forEach((p, i) => {
                p.x += p.vx; p.y += p.vy; p.life -= 0.005;
                if (p.life <= 0 || p.y > h * 0.9) this.particles.splice(i, 1);

                ctx.save();
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.chemistry.color;
                ctx.shadowBlur = 10; ctx.shadowColor = p.chemistry.glow;
                ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            });

            this.ions.forEach((ion, i) => {
                ion.x += ion.vx; ion.y += ion.vy; ion.life -= 0.01;
                if (ion.life <= 0 || ion.y > h) this.ions.splice(i, 1);

                ctx.save();
                ctx.globalAlpha = ion.life;
                ctx.fillStyle = ion.ion.color;
                ctx.font = 'bold 12px sans-serif';
                ctx.fillText(ion.ion.charge, ion.x, ion.y);
                ctx.restore();
            });
        }
    };
})();
