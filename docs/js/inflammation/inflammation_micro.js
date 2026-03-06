/**
 * @file inflammation_micro.js
 * @description Scientifically precise micro-level simulation.
 * Visualizes the Neurovascular Unit (NVU), BBB infiltration, and phenotypic glial states.
 */

(function () {
    'use strict';

    const GreenhouseInflammationMicro = {
        render(ctx, state, camera, projection, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            const tone = state.metrics.inflammatoryTone || 0;
            const bbb = state.metrics.bbbIntegrity || 1.0;
            const activation = state.metrics.microgliaActivation || 0;

            // 1. Z-Buffer Batching
            const batch = [];

            // Vessel & BBB
            if (ui3d.vesselEndothelium) {
                ui3d.vesselEndothelium.forEach(e => {
                    const p = Math3D.project3DTo2D(e.x, e.y, e.z, camera, projection);
                    batch.push({ type: 'endothelium', data: e, proj: p, depth: p.depth });
                });
            }

            // Neurons
            ui3d.neurons.forEach(n => {
                const p = Math3D.project3DTo2D(n.cp.x, n.cp.y, n.cp.z, camera, projection);
                batch.push({ type: 'neuron', data: n, depth: p.depth + 0.1 }); // Slightly behind glia
            });

            // Glia (Astrocytes/Microglia)
            ui3d.glia.forEach(g => {
                const p = Math3D.project3DTo2D(g.x, g.y, g.z, camera, projection);
                batch.push({ type: 'glia', data: g, proj: p, depth: p.depth });
            });

            // Leukocytes
            ui3d.leukocytes.forEach(l => {
                // Logic for rolling/infiltration
                l.x += l.vx * (1 - (1 - bbb) * 0.5); // Slow down if adhesion Molecules are high
                if (l.x > 600) l.x = -600;

                // If BBB is low, leukocytes can "escape" the vessel (Y moves up)
                if (bbb < 0.7 && Math.random() > 0.99 && l.state === 'circulating') {
                    l.state = 'infiltrating';
                }
                if (l.state === 'infiltrating') {
                    l.y -= 2; // Move into brain parenchyma
                    if (l.y < -300) { l.y = 300; l.state = 'circulating'; }
                }

                const p = Math3D.project3DTo2D(l.x, l.y, l.z, camera, projection);
                batch.push({ type: 'leukocyte', data: l, proj: p, depth: p.depth });
            });

            batch.sort((a, b) => b.depth - a.depth);

            // 2. Specialized Rendering
            batch.forEach(item => {
                if (item.type === 'endothelium') this.drawEndothelium(ctx, item.data, item.proj, bbb);
                else if (item.type === 'neuron') this.drawNeuron(ctx, item.data, camera, projection, tone);
                else if (item.type === 'glia') this.drawGlia(ctx, item.data, item.proj, activation, tone, ui3d);
                else if (item.type === 'leukocyte') this.drawLeukocyte(ctx, item.data, item.proj, bbb);
            });

            this.drawNVULabels(ctx, projection);
            this.drawMicroPhenotypeStats(ctx, state, projection);
            this.drawInfiltrationCounter(ctx, state, ui3d, projection);
            if (state.factors.showVolumeBounds) this.drawVolumeBoundingBox(ctx, camera, projection);
        },

        drawMicroPhenotypeStats(ctx, state, projection) {
            const activation = state.metrics.microgliaActivation || 0;
            const m1Prop = activation > 0.5 ? (activation * 0.8 + 0.2) : (activation * 0.4);
            const m2Prop = 1 - m1Prop;

            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(40, projection.height - 180, 150, 45);
            ctx.strokeStyle = '#4ca1af';
            ctx.strokeRect(40, projection.height - 180, 150, 45);

            ctx.fillStyle = '#ff4444'; ctx.font = 'bold 9px monospace';
            ctx.fillText(`M1-LIKE (REACTIVE): ${(m1Prop * 100).toFixed(0)}%`, 50, projection.height - 165);
            ctx.fillStyle = '#64d2ff';
            ctx.fillText(`M2-LIKE (RESOLVING): ${(m2Prop * 100).toFixed(0)}%`, 50, projection.height - 150);
            ctx.restore();
        },

        drawInfiltrationCounter(ctx, state, ui3d, projection) {
            const infiltratingCount = ui3d.leukocytes.filter(l => l.state === 'infiltrating').length;
            ctx.save();
            ctx.fillStyle = infiltratingCount > 3 ? '#ff3300' : '#fff';
            ctx.font = 'bold 11px Quicksand';
            ctx.fillText(`LEUKOCYTE INFILTRATION: ${infiltratingCount} CELLS`, 40, projection.height - 195);
            ctx.restore();
        },

        drawVolumeBoundingBox(ctx, camera, projection) {
            const Math3D = window.GreenhouseModels3DMath;
            const size = 600;
            const corners = [
                {x:-size, y:-size, z:-size}, {x:size, y:-size, z:-size}, {x:size, y:size, z:-size}, {x:-size, y:size, z:-size},
                {x:-size, y:-size, z:size}, {x:size, y:-size, z:size}, {x:size, y:size, z:size}, {x:-size, y:size, z:size}
            ];
            const p = corners.map(c => Math3D.project3DTo2D(c.x, c.y, c.z, camera, projection));

            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            [0,1,2,3].forEach(i => {
                ctx.moveTo(p[i].x, p[i].y); ctx.lineTo(p[(i+1)%4].x, p[(i+1)%4].y);
                ctx.moveTo(p[i+4].x, p[i+4].y); ctx.lineTo(p[(i+1)%4+4].x, p[(i+1)%4+4].y);
                ctx.moveTo(p[i].x, p[i].y); ctx.lineTo(p[i+4].x, p[i+4].y);
            });
            ctx.stroke();
            ctx.restore();
        },

        drawEndothelium(ctx, e, p, bbb) {
            if (p.scale <= 0) return;
            ctx.save();
            ctx.translate(p.x, p.y);

            // Item 45: Explicit vessel boundary line
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.moveTo(-100, -30 * p.scale);
            ctx.lineTo(100, -30 * p.scale);
            ctx.stroke();

            // Endothelial Cell (Flat elongated hex-like shape)
            ctx.beginPath();
            // Item 46: Endothelial stress overlay
            const stressColor = bbb < 0.7 ? `rgba(255, 50, 0, ${0.4 * (1 - bbb)})` : 'transparent';
            const color = bbb < 0.8 ? `rgba(255, 100, 100, ${0.3 + (1 - bbb) * 0.3})` : 'rgba(100, 200, 255, 0.3)';
            ctx.fillStyle = color;
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * p.scale})`;
            ctx.lineWidth = 1;

            // Draw a pseudo-3D cell tile
            ctx.rect(-30 * p.scale, -10 * p.scale, 60 * p.scale, 20 * p.scale);
            ctx.fill();
            if (stressColor !== 'transparent') {
                ctx.fillStyle = stressColor;
                ctx.fill();
            }
            ctx.stroke();

            // Cell Nucleus
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath(); ctx.arc(0, 0, 4 * p.scale, 0, Math.PI * 2); ctx.fill();

            ctx.restore();
        },

        drawNeuron(ctx, n, camera, projection, tone) {
            const Math3D = window.GreenhouseModels3DMath;
            ctx.beginPath();
            // Item 57: Improve neuron visual encoding (color + thickness)
            ctx.strokeStyle = tone > 0.5 ? `rgba(255, 100, 100, ${0.4 * (1 - tone)})` : `rgba(100, 200, 255, ${0.3 * (1 - tone)})`;
            ctx.lineWidth = 0.5 + (1 - tone) * 1.5;

            n.mesh.faces.forEach(f => {
                const v1 = n.mesh.vertices[f[0]], v2 = n.mesh.vertices[f[1]], v3 = n.mesh.vertices[f[2]];
                const p1 = Math3D.project3DTo2D(v1.x, v1.y, v1.z, camera, projection);
                const p2 = Math3D.project3DTo2D(v2.x, v2.y, v2.z, camera, projection);
                const p3 = Math3D.project3DTo2D(v3.x, v3.y, v3.z, camera, projection);
                if (p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
                    ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y);
                }
            });
            ctx.stroke();
        },

        drawGlia(ctx, g, p, activation, tone, ui3d) {
            if (p.scale <= 0) return;
            ctx.save();
            ctx.translate(p.x, p.y);

            const isAstro = g.type === 'astrocyte';
            const isM1 = !isAstro && activation > 0.5;

            // Item 61: Pulsing animation tied to activation
            const pulse = 1 + Math.sin(Date.now() * 0.005 + g.pulseOffset) * (activation * 0.2);

            // Color Themes (Item 58, 59)
            let color = isAstro ? `rgba(255, 220, 50, ${0.6 * p.scale})` : (isM1 ? `rgba(255, 80, 50, ${0.8 * p.scale})` : `rgba(100, 150, 255, ${0.6 * p.scale})`);
            if (ui3d && ui3d.theme === 'deuteranopia') {
                color = isAstro ? `rgba(255, 255, 100, ${0.6 * p.scale})` : (isM1 ? `rgba(100, 100, 255, ${0.8 * p.scale})` : `rgba(0, 150, 255, ${0.6 * p.scale})`);
            }

            // Phenotype Label (Item 41)
            if (p.scale > 0.6 && !isAstro) {
                ctx.fillStyle = isM1 ? '#ff5533' : '#64d2ff';
                ctx.font = 'bold 8px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(isM1 ? 'PHENOTYPE: M1' : 'PHENOTYPE: M2', 0, -20 * p.scale);
            }

            g.mesh.faces.forEach(f => {
                const v1 = g.mesh.vertices[f[0]], v2 = g.mesh.vertices[f[1]], v3 = g.mesh.vertices[f[2]];
                const rot = (v, ay) => ({ x: v.x * Math.cos(ay) - v.z * Math.sin(ay), y: v.y, z: v.x * Math.sin(ay) + v.z * Math.cos(ay) });
                const ry = g.rotationY + Date.now() * 0.001 * (isM1 ? 2 : 1);

                const r1 = rot(v1, ry), r2 = rot(v2, ry), r3 = rot(v3, ry);
                ctx.beginPath();
                ctx.fillStyle = color;
                // Reactive Microglia (M1) look more amoeboid/jagged
                if (isM1) ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;

                ctx.moveTo(r1.x * p.scale * pulse, r1.y * p.scale * pulse);
                ctx.lineTo(r2.x * p.scale * pulse, r2.y * p.scale * pulse);
                ctx.lineTo(r3.x * p.scale * pulse, r3.y * p.scale * pulse);
                ctx.fill();
                if (isM1) ctx.stroke();
            });

            // Receptors (Item 50)
            if (window.GreenhouseInflammationApp.engine.state.factors.showReceptors && g.receptors) {
                g.receptors.forEach(r => {
                    ctx.save();
                    ctx.rotate(r.angle + Date.now() * 0.001);
                    ctx.fillStyle = r.type === 'tnf' ? '#ff3300' : '#00ff99';
                    ctx.beginPath();
                    ctx.arc(15 * p.scale, 0, 2 * p.scale, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                });
            }

            // Astrocytic Endfeet wrapping simulation (if near vessel)
            if (isAstro && g.y > 100) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 220, 50, 0.3)`;
                ctx.lineWidth = 2;
                ctx.moveTo(0, 0);
                ctx.lineTo(0, (300 - g.y) * p.scale);
                ctx.stroke();
            }
            ctx.restore();
        },

        drawLeukocyte(ctx, l, p, bbb) {
            if (p.scale <= 0) return;

            // Path Trails (Item 63)
            if (l.state === 'infiltrating' && l.history) {
                ctx.save();
                ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                l.history.forEach((h, i) => {
                    if (i === 0) ctx.moveTo(h.proj.x, h.proj.y);
                    else ctx.lineTo(h.proj.x, h.proj.y);
                });
                ctx.stroke();
                ctx.restore();
            }

            ctx.save();
            ctx.translate(p.x, p.y);

            const isRolling = l.state === 'infiltrating' || bbb < 0.8;

            // Item 44: Pulse on transition
            const pulse = (l.state === 'infiltrating' && Date.now() % 500 < 250) ? 1.5 : 1.0;

            ctx.fillStyle = isRolling ? `rgba(255, 255, 255, 0.9)` : `rgba(200, 200, 255, 0.5)`;

            // Draw spherical leukocyte
            ctx.beginPath();
            ctx.arc(0, 0, 8 * p.scale * pulse, 0, Math.PI * 2);
            ctx.fill();

            if (isRolling) {
                ctx.strokeStyle = '#ff8888';
                ctx.lineWidth = 1;
                ctx.stroke();
                // "Adhesion" lines
                ctx.beginPath();
                ctx.moveTo(0, 8 * p.scale);
                ctx.lineTo(0, 15 * p.scale);
                ctx.stroke();
            }
            ctx.restore();

            // Update history for trails
            if (!l.history) l.history = [];
            l.history.push({ proj: p });
            if (l.history.length > 20) l.history.shift();
        },

        drawNVULabels(ctx, projection) {
            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = 'bold 10px monospace';
            ctx.fillText("NEUROVASCULAR UNIT (NVU)", 40, projection.height - 120);
            ctx.font = '8px monospace';
            ctx.fillText("ENDOTHELIUM | ASTROCYTIC ENDFEET | MICROGLIAL M1/M2", 40, projection.height - 105);
            ctx.restore();
        }
    };

    window.GreenhouseInflammationMicro = GreenhouseInflammationMicro;
})();
