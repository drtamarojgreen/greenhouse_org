// docs/js/synapse_3d.js

(function () {
    'use strict';

    const G = window.GreenhouseSynapseApp || {};
    window.GreenhouseSynapseApp = G;

    G.Visuals3D = {
        applyDepth(ctx, w, h) {
            ctx.save();
            // Implement 3D depth using a slight perspective tilt
            ctx.setTransform(1, 0.02, 0, 1, 0, 0);
        },

        drawShadows(ctx, particles) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowOffsetX = 5;
            ctx.shadowOffsetY = 5;
        },

        drawDynamicLighting(ctx, receptors, w, h) {
            ctx.save();
            receptors.forEach(r => {
                if (r.state === 'open' || r.state === 'active') {
                    const rx = w * r.x;
                    const ry = h * 0.68;
                    const gradient = ctx.createRadialGradient(rx, ry, 0, rx, ry, 40);
                    gradient.addColorStop(0, 'rgba(0, 242, 255, 0.4)');
                    gradient.addColorStop(1, 'rgba(0, 242, 255, 0)');
                    ctx.fillStyle = gradient;
                    ctx.globalCompositeOperation = 'screen';
                    ctx.beginPath();
                    ctx.arc(rx, ry, 40, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            ctx.restore();
        },

        drawIonHeatMap(ctx, ions, w, h) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ions.forEach(ion => {
                if (ion.y > h * 0.68) { // Only show heat map inside post-synaptic
                    const gradient = ctx.createRadialGradient(ion.x, ion.y, 0, ion.x, ion.y, 15);
                    const color = ion.color === '#ffd700' ? 'rgba(255, 215, 0, 0.1)' : 'rgba(173, 255, 47, 0.1)';
                    gradient.addColorStop(0, color);
                    gradient.addColorStop(1, 'transparent');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(ion.x, ion.y, 15, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            ctx.restore();
        },

        drawElectrostaticPotential(ctx, w, h, frame) {
            // Enhancement #34: Electrostatic Potential Surface
            ctx.save();
            ctx.globalAlpha = 0.05;
            ctx.fillStyle = '#00F2FF';

            // Draw a shimmering field near the membranes
            const offset = Math.sin(frame * 0.02) * 10;

            // Pre-synaptic field
            ctx.beginPath();
            ctx.rect(w * 0.35, h * 0.38 + offset, w * 0.3, 10);
            ctx.fill();

            // Post-synaptic field
            ctx.fillStyle = '#FF1493'; // Negative potential
            ctx.beginPath();
            ctx.rect(0, h * 0.68 - offset, w, 15);
            ctx.fill();

            ctx.restore();
        },

        restoreDepth(ctx) {
            ctx.restore();
        }
    };
})();
