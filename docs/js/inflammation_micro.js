/**
 * @file inflammation_micro.js
 * @description Micro-level (Cellular) rendering logic for the Neuroinflammation Simulation.
 */

(function () {
    'use strict';

    const GreenhouseInflammationMicro = {
        render(ctx, state, camera, projection, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            const tone = state.metrics.inflammatoryTone;

            // 1. Vascular Layer
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 50, 50, 0.15)';
            ctx.lineWidth = 40 * projection.scale;
            ctx.beginPath();
            ctx.moveTo(-projection.width, projection.height * 0.4);
            ctx.lineTo(projection.width * 2, projection.height * 0.4);
            ctx.stroke();
            ctx.restore();

            // 2. Axons (Background Mesh)
            ctx.save();
            ctx.setLineDash([5, 15]);
            ctx.lineWidth = 1;
            ui3d.axons.forEach(a => {
                const n1 = ui3d.neurons[a.from];
                const n2 = ui3d.neurons[a.to];
                const p1 = Math3D.project3DTo2D(n1.cp.x, n1.cp.y, n1.cp.z, camera, projection);
                const p2 = Math3D.project3DTo2D(n2.cp.x, n2.cp.y, n2.cp.z, camera, projection);
                if (p1.scale > 0 && p2.scale > 0) {
                    ctx.strokeStyle = `rgba(100, 200, 255, ${0.2 * (1 - tone)})`;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            });
            ctx.restore();

            // 3. Neurons
            ui3d.neurons.forEach(n => {
                const alpha = tone > 0.6 ? 0.3 : 0.8;
                ctx.strokeStyle = `rgba(76, 161, 175, ${alpha})`;
                ctx.lineWidth = 2;
                n.mesh.faces.forEach(face => {
                    const v1 = n.mesh.vertices[face[0]], v2 = n.mesh.vertices[face[1]], v3 = n.mesh.vertices[face[2]];
                    const p1 = Math3D.project3DTo2D(v1.x, v1.y, v1.z, camera, projection);
                    const p2 = Math3D.project3DTo2D(v2.x, v2.y, v2.z, camera, projection);
                    const p3 = Math3D.project3DTo2D(v3.x, v3.y, v3.z, camera, projection);
                    if (p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
                        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.stroke();
                    }
                });
            });

            // 4. Glia
            const microgliaActivation = state.metrics.microgliaActivation;
            ui3d.glia.forEach(g => {
                const p = Math3D.project3DTo2D(g.x, g.y, g.z, camera, projection);
                if (p.scale <= 0) return;

                const pulse = Math.sin(Date.now() * 0.002 + g.pulseOffset) * 0.1 + 1;
                const size = g.size * p.scale * pulse;

                ctx.save();
                if (g.type === 'astrocyte') {
                    const color = `rgba(255, ${Math.round(180 * (1 - tone))}, 50, 0.8)`;
                    ctx.translate(p.x, p.y);
                    ctx.rotate(g.rotationY + Date.now() * 0.0005);
                    ctx.beginPath();
                    for (let i = 0; i < 16; i++) {
                        const r = i % 2 === 0 ? size : size * 0.4;
                        const angle = (i / 8) * Math.PI;
                        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
                    }
                    ctx.fillStyle = color; ctx.fill();
                } else {
                    const isReactive = microgliaActivation > 0.4;
                    const color = isReactive ? `rgba(255, 50, 50, 0.9)` : `rgba(100, 100, 255, 0.7)`;
                    if (isReactive) {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, size * (0.6 + microgliaActivation * 0.4), 0, Math.PI * 2);
                        ctx.fillStyle = color; ctx.fill();
                    } else {
                        ctx.translate(p.x, p.y); ctx.rotate(g.rotationY);
                        ctx.beginPath();
                        for (let i = 0; i < 10; i++) {
                            const r = i % 2 === 0 ? size : size * 0.1;
                            const angle = (i / 5) * Math.PI;
                            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
                        }
                        ctx.fillStyle = color; ctx.fill();
                    }
                }
                ctx.restore();

                // Receptors
                g.receptors.forEach(r => {
                    const ang = r.angle + Date.now() * 0.001;
                    const rp = Math3D.project3DTo2D(g.x + Math.cos(ang) * size * 0.1, g.y + Math.sin(ang) * size * 0.1, g.z, camera, projection);
                    if (rp.scale > 0) {
                        ctx.fillStyle = r.type === 'tnf' ? '#ff3333' : '#33ffaa';
                        ctx.beginPath(); ctx.arc(rp.x, rp.y, 2 * rp.scale, 0, Math.PI * 2); ctx.fill();
                    }
                });

                // Classification label
                if (p.scale > 0.8) {
                    ctx.fillStyle = 'rgba(255,255,255,0.4)';
                    ctx.font = 'italic 9px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(g.type.toUpperCase(), p.x, p.y + size + 10);
                }
            });

            // 5. Synapses
            ui3d.synapses.forEach(s => {
                const sp = Math3D.project3DTo2D(s.x, s.y, s.z, camera, projection);
                if (sp.scale > 0) {
                    const spark = Math.random() > 0.9 ? 2 : 1;
                    ctx.fillStyle = `rgba(255, 255, 200, ${0.4 * spark * (1 - tone)})`;
                    ctx.beginPath(); ctx.arc(sp.x, sp.y, 5 * sp.scale * spark, 0, Math.PI * 2); ctx.fill();
                }
            });

            // 6. Leukocytes
            const bbb = state.metrics.bbbIntegrity;
            if (bbb < 0.95) {
                ui3d.leukocytes.forEach(l => {
                    l.x += l.vx * (1 - bbb);
                    if (l.x > 500) l.x = -500;
                    const lp = Math3D.project3DTo2D(l.x, l.y, l.z, camera, projection);
                    if (lp.scale > 0) {
                        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * (1 - bbb)})`;
                        ctx.beginPath(); ctx.arc(lp.x, lp.y, 5 * lp.scale, 0, Math.PI * 2); ctx.fill();
                        const glow = ctx.createRadialGradient(lp.x, lp.y, 0, lp.x, lp.y, 10 * lp.scale);
                        glow.addColorStop(0, 'rgba(255,255,255,0.4)'); glow.addColorStop(1, 'transparent');
                        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(lp.x, lp.y, 10 * lp.scale, 0, Math.PI * 2); ctx.fill();
                    }
                });
            }
        }
    };

    window.GreenhouseInflammationMicro = GreenhouseInflammationMicro;
})();
