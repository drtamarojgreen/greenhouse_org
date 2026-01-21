// docs/js/synapse_neurotransmitters.js

(function () {
    'use strict';

    const G = window.GreenhouseSynapseApp || {};
    window.GreenhouseSynapseApp = G;

    G.Particles = {
        particles: [],
        ions: [],
        plasticityFactor: 1.0,

        create(w, h, count = 1, config = {}, forceBurst = false) {
            const chem = G.Chemistry.neurotransmitters[config.activeNT || 'serotonin'];

            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: w * (0.48 + Math.random() * 0.04),
                    y: h * 0.42,
                    r: Math.random() * (forceBurst ? 3 : 2) + 1.5,
                    vx: (Math.random() - 0.5) * (forceBurst ? 4 : 0.8),
                    vy: Math.random() * (forceBurst ? 5 : 2) + (forceBurst ? 2 : 1.2),
                    life: 1.0,
                    color: chem.color,
                    glow: chem.glow,
                    chemistry: chem,
                    stochastic: [] // Store previous positions for Monte Carlo visualization
                });
            }
        },

        createIon(x, y, ionType) {
            const ionChem = G.Chemistry.ions[ionType || 'sodium'];
            this.ions.push({
                x: x,
                y: y,
                r: 2,
                vx: (Math.random() - 0.5) * 2,
                vy: 3 + Math.random() * 2,
                life: 1.0,
                color: ionChem.color,
                charge: ionChem.charge
            });
        },

        updateAndDraw(ctx, w, h) {
            ctx.save();

            const isGlutamate = G.config.activeNT === 'glutamate';
            const astrocyteX = w * 0.8;
            const astrocyteY = h * 0.5;

            const reuptakeBlocked = G.config.pharmacology?.ssriActive && G.config.activeNT === 'serotonin';
            const enzymaticRate = G.config.kinetics?.enzymaticRate || 0.002;

            // LTP/LTD Simulation
            if (this.particles.length > 50) {
                this.plasticityFactor = Math.min(2.5, this.plasticityFactor + 0.001);
            } else if (this.particles.length < 5) {
                this.plasticityFactor = Math.max(0.5, this.plasticityFactor - 0.0005);
            }

            // Draw Neurotransmitters - Safe backward loop
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];

                // Monte Carlo Simulation: Stochastic Diffusion (Enhancement #97)
                const driftX = (Math.random() - 0.5) * 0.5;
                const driftY = (Math.random() - 0.5) * 0.5;
                p.x += p.vx + driftX;
                p.y += p.vy + driftY;

                // Track stochastic path
                if (G.frame % 10 === 0) {
                    p.stochastic.push({ x: p.x, y: p.y });
                    if (p.stochastic.length > 5) p.stochastic.shift();
                }

                // Draw path
                if (p.stochastic.length > 1) {
                    ctx.beginPath();
                    ctx.strokeStyle = p.color;
                    ctx.globalAlpha = 0.2;
                    ctx.moveTo(p.stochastic[0].x, p.stochastic[0].y);
                    for (let j = 1; j < p.stochastic.length; j++) {
                        ctx.lineTo(p.stochastic[j].x, p.stochastic[j].y);
                    }
                    ctx.stroke();
                }

                const preTerminalTop = h * 0.4;
                if (p.y < preTerminalTop && !reuptakeBlocked) {
                    p.life -= 0.05;
                }

                p.life -= enzymaticRate;

                if (isGlutamate) {
                    const dx = p.x - astrocyteX;
                    const dy = p.y - astrocyteY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 60) {
                        p.life -= 0.05;
                    }
                }

                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                } else {
                    const alpha = p.life * (p.y > h * 0.65 ? 0.2 : 1.0);
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = alpha;
                    ctx.shadowBlur = 15 * p.life;
                    ctx.shadowColor = p.glow;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.globalAlpha = 1.0;

            // Draw Ions
            for (let i = this.ions.length - 1; i >= 0; i--) {
                const ion = this.ions[i];
                ion.x += ion.vx;
                ion.y += ion.vy;
                ion.life -= 0.01;

                if (ion.life <= 0) {
                    this.ions.splice(i, 1);
                } else {
                    ctx.fillStyle = ion.color;
                    ctx.beginPath();
                    ctx.arc(ion.x, ion.y, ion.r, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#000';
                    ctx.font = 'bold 8px Arial';
                    ctx.fillText(ion.charge, ion.x - 3, ion.y + 3);
                }
            }

            ctx.restore();
        },

        clear() {
            this.particles = [];
            this.ions = [];
        }
    };
})();
