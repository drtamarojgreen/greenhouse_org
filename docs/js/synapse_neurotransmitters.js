// docs/js/synapse_neurotransmitters.js

(function () {
    'use strict';

    const GreenhouseSynapseParticles = {
        particles: [],

        create(w, h, count = 1, forceBurst = false) {
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: w * (0.48 + Math.random() * 0.04),
                    y: h * 0.42,
                    r: Math.random() * (forceBurst ? 3 : 2) + 1.5,
                    vx: (Math.random() - 0.5) * (forceBurst ? 4 : 0.8),
                    vy: Math.random() * (forceBurst ? 5 : 2) + (forceBurst ? 2 : 1.2),
                    life: 1.0,
                    hue: 180 + Math.random() * 20
                });
            }
        },

        updateAndDraw(ctx, w, h, accentCyan) {
            ctx.save();
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.005;

                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                } else {
                    const alpha = p.life * (p.y > h * 0.65 ? 0.2 : 1.0);
                    ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${alpha})`;
                    ctx.shadowBlur = 15 * p.life;
                    ctx.shadowColor = accentCyan;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();
        },

        clear() {
            this.particles = [];
        }
    };

    window.GreenhouseSynapseParticles = GreenhouseSynapseParticles;
})();
