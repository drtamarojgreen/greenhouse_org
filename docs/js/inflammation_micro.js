/**
 * @file inflammation_micro.js
 * @description Micro-level rendering logic for the Neuroinflammation Simulation.
 * Features 3D neurons, complex branching glia, and detailed 3D synapses.
 */

(function () {
    'use strict';

    const GreenhouseInflammationMicro = {
        render(ctx, state, camera, projection, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            const tone = state.metrics.inflammatoryTone || 0.05;

            // 1. Z-Buffer Sort
            const renderBatch = [];

            // Add Neurons
            ui3d.neurons.forEach(n => {
                const centerDepth = Math3D.project3DTo2D(n.cp.x, n.cp.y, n.cp.z, camera, projection).depth;
                renderBatch.push({ type: 'neuron', data: n, depth: centerDepth });
            });

            // Add Glia
            ui3d.glia.forEach(g => {
                const d = Math3D.project3DTo2D(g.x, g.y, g.z, camera, projection).depth;
                renderBatch.push({ type: 'glia', data: g, depth: d });
            });

            // Add Synapses
            ui3d.synapses.forEach(s => {
                const d = Math3D.project3DTo2D(s.x, s.y, s.z, camera, projection).depth;
                renderBatch.push({ type: 'synapse', data: s, depth: d });
            });

            // Add Leukocytes
            const bbb = state.metrics.bbbIntegrity || 1.0;
            if (bbb < 0.98) {
                ui3d.leukocytes.forEach(l => {
                    const d = Math3D.project3DTo2D(l.x, l.y, l.z, camera, projection).depth;
                    renderBatch.push({ type: 'leukocyte', data: l, depth: d });
                });
            }

            renderBatch.sort((a, b) => b.depth - a.depth);

            // 2. Render
            renderBatch.forEach(item => {
                if (item.type === 'neuron') this.drawNeuron(ctx, item.data, camera, projection, tone);
                else if (item.type === 'glia') this.drawGlia(ctx, item.data, camera, projection, state);
                else if (item.type === 'synapse') this.drawSynapse(ctx, item.data, camera, projection, tone);
                else if (item.type === 'leukocyte') this.drawLeukocyte(ctx, item.data, camera, projection, bbb);
            });
        },

        drawNeuron(ctx, n, camera, projection, tone) {
            const Math3D = window.GreenhouseModels3DMath;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(100, 200, 255, ${0.4 * (1 - tone)})`;
            ctx.lineWidth = 1;

            n.mesh.faces.forEach(f => {
                const v1 = n.mesh.vertices[f[0]], v2 = n.mesh.vertices[f[1]], v3 = n.mesh.vertices[f[2]];
                const p1 = Math3D.project3DTo2D(v1.x, v1.y, v1.z, camera, projection);
                const p2 = Math3D.project3DTo2D(v2.x, v2.y, v2.z, camera, projection);
                const p3 = Math3D.project3DTo2D(v3.x, v3.y, v3.z, camera, projection);

                if (p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y);
                    ctx.stroke();
                }
            });
        },

        drawGlia(ctx, g, camera, projection, state) {
            const Math3D = window.GreenhouseModels3DMath;
            const p = Math3D.project3DTo2D(g.x, g.y, g.z, camera, projection);
            if (p.scale <= 0) return;

            const activation = state.metrics.microgliaActivation || 0;
            const isReactive = g.type === 'microglia' && activation > 0.4;
            const color = isReactive ? `rgba(255, 60, 40, ${0.8 * p.scale})` : (g.type === 'astrocyte' ? `rgba(255, 200, 50, ${0.7 * p.scale})` : `rgba(100, 150, 255, ${0.7 * p.scale})`);

            ctx.save();
            ctx.translate(p.x, p.y);
            // Draw 3D projected mesh
            g.mesh.faces.forEach(f => {
                const v1 = g.mesh.vertices[f[0]], v2 = g.mesh.vertices[f[1]], v3 = g.mesh.vertices[f[2]];
                // Simple 2D rotation for the mesh vertices relative to the cluster center
                const rot = (v, angleY) => ({
                    x: v.x * Math.cos(angleY) - v.z * Math.sin(angleY),
                    y: v.y,
                    z: v.x * Math.sin(angleY) + v.z * Math.cos(angleY)
                });

                const r1 = rot(v1, g.rotationY + Date.now() * 0.001);
                const r2 = rot(v2, g.rotationY + Date.now() * 0.001);
                const r3 = rot(v3, g.rotationY + Date.now() * 0.001);

                ctx.beginPath();
                ctx.fillStyle = color;
                ctx.strokeStyle = `rgba(255,255,255,0.1)`;
                ctx.moveTo(r1.x * p.scale, r1.y * p.scale);
                ctx.lineTo(r2.x * p.scale, r2.y * p.scale);
                ctx.lineTo(r3.x * p.scale, r3.y * p.scale);
                ctx.fill();
                ctx.stroke();
            });
            ctx.restore();
        },

        drawSynapse(ctx, s, camera, projection, tone) {
            const Math3D = window.GreenhouseModels3DMath;
            const p = Math3D.project3DTo2D(s.x, s.y, s.z, camera, projection);
            if (p.scale <= 0) return;

            ctx.save();
            ctx.translate(p.x, p.y);

            const drawPart = (mesh, offsetZ, color) => {
                mesh.faces.forEach(f => {
                    const v1 = mesh.vertices[f[0]], v2 = mesh.vertices[f[1]], v3 = mesh.vertices[f[2]];
                    ctx.beginPath();
                    ctx.fillStyle = color;
                    ctx.moveTo(v1.x * p.scale, (v1.y + offsetZ) * p.scale);
                    ctx.lineTo(v2.x * p.scale, (v2.y + offsetZ) * p.scale);
                    ctx.lineTo(v3.x * p.scale, (v3.y + offsetZ) * p.scale);
                    ctx.fill();
                });
            };

            // Pre-synaptic
            drawPart(s.preMesh, -20, `rgba(150, 200, 255, ${0.6 * p.scale})`);
            // Post-synaptic
            drawPart(s.postMesh, 20, `rgba(200, 200, 220, ${0.6 * p.scale})`);

            // Synaptic Cleft Glow
            const spark = Math.random() > 0.9 ? 2 : 1;
            const cleftGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 15 * p.scale);
            cleftGrad.addColorStop(0, `rgba(255, 255, 180, ${0.4 * (1 - tone) * spark})`);
            cleftGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = cleftGrad;
            ctx.beginPath(); ctx.arc(0, 0, 15 * p.scale, 0, Math.PI * 2); ctx.fill();

            ctx.restore();
        },

        drawLeukocyte(ctx, l, camera, projection, bbb) {
            const Math3D = window.GreenhouseModels3DMath;
            l.x += l.vx * (1 - bbb);
            if (l.x > 500) l.x = -500;
            const lp = Math3D.project3DTo2D(l.x, l.y, l.z, camera, projection);
            if (lp.scale > 0 && isFinite(lp.x) && isFinite(lp.y)) {
                ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * (1 - bbb)})`;
                ctx.beginPath(); ctx.arc(lp.x, lp.y, 8 * lp.scale, 0, Math.PI * 2); ctx.fill();

                const r1 = 15 * lp.scale;
                if (isFinite(r1) && r1 > 0) {
                    const glow = ctx.createRadialGradient(lp.x, lp.y, 0, lp.x, lp.y, r1);
                    glow.addColorStop(0, 'rgba(255,255,255,0.4)'); glow.addColorStop(1, 'transparent');
                    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(lp.x, lp.y, r1, 0, Math.PI * 2); ctx.fill();
                }
            }
        }
    };

    window.GreenhouseInflammationMicro = GreenhouseInflammationMicro;
})();
