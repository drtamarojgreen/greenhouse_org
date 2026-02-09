/**
 * @file inflammation_molecular.js
 * @description Molecular-level rendering logic for the Neuroinflammation Simulation.
 */

(function () {
    'use strict';

    const GreenhouseInflammationMolecular = {
        render(ctx, state, camera, projection, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            const tone = state.metrics.inflammatoryTone;

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';

            ui3d.molecules.forEach(m => {
                const speedMult = 1 + tone * 2;
                m.x += m.vx * speedMult; m.y += m.vy * speedMult; m.z += m.vz * speedMult;

                let wrapped = false;
                if (m.x > 400) { m.x = -400; wrapped = true; } else if (m.x < -400) { m.x = 400; wrapped = true; }
                if (m.y > 300) { m.y = -300; wrapped = true; } else if (m.y < -300) { m.y = 300; wrapped = true; }
                if (m.z > 300) { m.z = -300; wrapped = true; } else if (m.z < -300) { m.z = 300; wrapped = true; }
                if (wrapped) m.history = [];

                const p = Math3D.project3DTo2D(m.x, m.y, m.z, camera, projection);
                if (p.scale <= 0) return;

                const alpha = Math3D.applyDepthFog(0.2, p.depth, 0.1, 0.7);
                const safeAlpha = isNaN(alpha) ? 0.2 : alpha;
                const safeTone = isNaN(tone) ? 0.02 : tone;

                m.history.push({ x: p.x, y: p.y });
                if (m.history.length > 5) m.history.shift();

                if (m.history.length > 1) {
                    ctx.beginPath(); ctx.moveTo(m.history[0].x, m.history[0].y);
                    for (let i = 1; i < m.history.length; i++) ctx.lineTo(m.history[i].x, m.history[i].y);
                    ctx.strokeStyle = m.type === 'pro-cytokine' ? `rgba(255, 100, 0, ${safeAlpha * 0.3})` : `rgba(100, 200, 255, ${safeAlpha * 0.3})`;
                    ctx.lineWidth = m.size * p.scale;
                    ctx.stroke();
                }

                if (m.type === 'pro-cytokine') {
                    ctx.fillStyle = `rgba(255, ${Math.round(100 * (1 - safeTone))}, 50, ${safeAlpha})`;
                    const s = m.size * p.scale * (1 + safeTone * 0.5);
                    ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, Math.PI * 2); ctx.fill();
                    if (state.metrics.microgliaActivation > 0.6 && Math.random() > 0.96) {
                        ctx.strokeStyle = 'rgba(255, 50, 50, 0.4)'; ctx.lineWidth = 2; ctx.beginPath();
                        ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + (Math.random() - 0.5) * 50, p.y + (Math.random() - 0.5) * 50); ctx.stroke();
                    }
                } else if (m.type === 'neurotransmitter') {
                    ctx.fillStyle = `rgba(255, 255, 150, ${safeAlpha})`;
                    ctx.beginPath(); ctx.arc(p.x, p.y, 1.5 * p.scale, 0, Math.PI * 2); ctx.fill();
                } else if (m.type === 'anti-cytokine') {
                    ctx.fillStyle = `rgba(0, 255, 180, ${safeAlpha})`;
                    const s = m.size * p.scale;
                    ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, Math.PI * 2); ctx.fill();

                    const r1 = s * 3;
                    if (isFinite(p.x) && isFinite(p.y) && isFinite(r1) && r1 > 0) {
                        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r1);
                        grad.addColorStop(0, `rgba(0, 255, 150, ${safeAlpha * 0.3})`); grad.addColorStop(1, 'transparent');
                        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(p.x, p.y, r1, 0, Math.PI * 2); ctx.fill();
                    }
                } else {
                    const s = m.size * p.scale;
                    const r1 = s * 2;
                    if (isFinite(p.x) && isFinite(p.y) && isFinite(r1) && r1 > 0) {
                        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r1);
                        g.addColorStop(0, `rgba(150, 230, 255, ${safeAlpha})`); g.addColorStop(1, 'transparent');
                        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r1, 0, Math.PI * 2); ctx.fill();
                    }
                }
            });
            ctx.restore();

            // Legend
            ctx.save();
            const lx = 30, ly = projection.height - 160;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            if (ui3d.roundRect) ui3d.roundRect(ctx, lx, ly, 150, 70, 10, true);
            const legend = [{ c: '#ff5533', l: 'Pro-Cytokine (TNF)' }, { c: '#33ffaa', l: 'Anti-Cytokine (IL10)' }, { c: '#ffff66', l: 'Neurotransmitter' }];
            legend.forEach((item, i) => {
                ctx.fillStyle = item.c; ctx.beginPath(); ctx.arc(lx + 15, ly + 15 + i * 20, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.fillText(item.l, lx + 30, ly + 19 + i * 20);
            });
            ctx.restore();

            // Membrane
            ctx.save();
            ctx.strokeStyle = 'rgba(76, 161, 175, 0.2)';
            for (let i = 0; i < 3; i++) {
                const offY = projection.height * 0.35 + i * 25;
                ctx.beginPath(); ctx.moveTo(0, offY);
                for (let x = 0; x < projection.width; x += 15) {
                    const y = offY + Math.sin(x * 0.01 + Date.now() * 0.0008 + i) * 20;
                    ctx.lineTo(x, y);
                    if (x % 30 === 0) {
                        ctx.save();
                        ctx.fillStyle = i === 1 ? 'rgba(100, 255, 255, 0.15)' : 'rgba(76, 161, 175, 0.1)';
                        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
                        ctx.restore();
                    }
                }
                ctx.stroke();
            }
            ctx.restore();
        }
    };

    window.GreenhouseInflammationMolecular = GreenhouseInflammationMolecular;
})();
