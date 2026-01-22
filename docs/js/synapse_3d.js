// docs/js/synapse_3d.js

(function () {
    'use strict';

    const G = window.GreenhouseSynapseApp || {};
    window.GreenhouseSynapseApp = G;

    G.Visuals3D = {
        applyDepth(ctx, w, h) {
            ctx.save();
            ctx.setTransform(1, 0.02, 0, 1, 0, 0);
        },

        drawShadows(ctx, particles) {
            // Pairing fix: Do not call save() here, relying on applyDepth save
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowOffsetX = 5;
            ctx.shadowOffsetY = 5;
        },

        drawVesicleShadows(ctx, vesicles, w, h, frame) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            vesicles.forEach(v => {
                const vx = w * v.x;
                const vy = h * v.y + Math.sin(frame * 0.04 + v.offset) * 8;
                ctx.beginPath();
                ctx.ellipse(vx + 4, vy + 4, v.r, v.r * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        },

        drawDynamicLighting(ctx, receptors, w, h) {
            ctx.save();
            receptors.forEach(r => {
                if (r.state === 'open' || r.state === 'active') {
                    const rx = w * r.x;
                    const ry = G.getSurfaceY ? G.getSurfaceY(h) : h * 0.68;
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
            const surfaceY = G.getSurfaceY ? G.getSurfaceY(h) : h * 0.68;
            ions.forEach(ion => {
                if (ion.y > surfaceY) {
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
            ctx.save();
            ctx.globalAlpha = 0.05;
            ctx.fillStyle = '#00F2FF';
            const offset = Math.sin(frame * 0.02) * 10;
            const surfaceY = G.getSurfaceY ? G.getSurfaceY(h) : h * 0.68;

            ctx.beginPath();
            ctx.rect(w * 0.35, h * 0.38 + offset, w * 0.3, 10);
            ctx.fill();

            ctx.fillStyle = '#FF1493';
            ctx.beginPath();
            ctx.rect(0, surfaceY - offset, w, 15);
            ctx.fill();
            ctx.restore();
        },

        drawBBB(ctx, w, h) {
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 242, 255, 0.5)';
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.moveTo(0, h * 0.05);
            ctx.lineTo(w, h * 0.05);
            ctx.stroke();

            ctx.fillStyle = 'rgba(0, 242, 255, 0.05)';
            ctx.fillRect(0, 0, w, h * 0.05);

            ctx.fillStyle = '#00F2FF';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('BLOOD-BRAIN BARRIER (BBB)', w * 0.5 - 70, h * 0.04);
            ctx.restore();
        },

        drawMeasurement(ctx, start, end) {
            if (!start || !end) return;
            ctx.save();
            ctx.strokeStyle = '#FFD700';
            ctx.setLineDash([2, 2]);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            const dist = Math.sqrt((end.x - start.x)**2 + (end.y - start.y)**2);
            const virtualNM = (dist * 0.2).toFixed(1);

            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 10px Arial';
            ctx.fillText(`${virtualNM} nm`, (start.x + end.x) / 2, (start.y + end.y) / 2 - 10);
            ctx.restore();
        },

        restoreDepth(ctx) {
            ctx.restore();
        }
    };
})();
