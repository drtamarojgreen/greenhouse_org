// docs/js/synapse_molecular.js

(function () {
    'use strict';

    const G = window.GreenhouseSynapseApp || {};
    window.GreenhouseSynapseApp = G;

    G.Molecular = {
        ecmParticles: [],

        drawSNARE(ctx, x, y, progress) {
            ctx.save();
            ctx.strokeStyle = '#ff9900';
            ctx.lineWidth = 2;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(x - 10, y);
            ctx.quadraticCurveTo(x, y - 20 * progress, x + 10, y);
            ctx.stroke();
            ctx.restore();
        },

        drawLipidBilayer(ctx, x, y, width, isPost) {
            ctx.save();
            ctx.strokeStyle = isPost ? '#2c3e50' : '#707870';
            ctx.lineWidth = 4;
            // Fluid-mosaic motion simulation
            const offset = Math.sin(Date.now() / 1000) * 2;
            ctx.beginPath();
            ctx.moveTo(x, y + offset);
            ctx.lineTo(x + width, y - offset);
            ctx.stroke();
            ctx.restore();
        },

        drawECM(ctx, w, h) {
            if (this.ecmParticles.length === 0) {
                for (let i = 0; i < 50; i++) {
                    this.ecmParticles.push({
                        x: Math.random() * w,
                        y: Math.random() * h,
                        r: Math.random() * 2 + 0.5,
                        alpha: Math.random() * 0.2 + 0.05,
                        speed: Math.random() * 0.2 + 0.1
                    });
                }
            }

            ctx.save();
            this.ecmParticles.forEach(p => {
                p.y += p.speed;
                if (p.y > h) p.y = 0;
                ctx.fillStyle = `rgba(150, 150, 150, ${p.alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        },

        drawAstrocyte(ctx, w, h) {
            const ax = w * 0.8;
            const ay = h * 0.5;

            ctx.save();
            ctx.strokeStyle = 'rgba(100, 150, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();

            // Draw a star-like astrocyte
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const r = 30 + Math.sin(Date.now() / 500 + i) * 5;
                ctx.moveTo(ax, ay);
                ctx.lineTo(ax + Math.cos(angle) * r, ay + Math.sin(angle) * r);
            }
            ctx.stroke();

            ctx.fillStyle = 'rgba(100, 150, 255, 0.1)';
            ctx.beginPath();
            ctx.arc(ax, ay, 15, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    };
})();
