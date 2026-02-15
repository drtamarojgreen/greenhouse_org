/**
 * @file inflammation_molecular.js
 * @description Molecular-level rendering logic for the Neuroinflammation Simulation.
 * Features 3D molecular structures and a complex 3D lipid bilayer segment.
 */

(function () {
    'use strict';

    const GreenhouseInflammationMolecular = {
        render(ctx, state, camera, projection, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            const tone = state.metrics.inflammatoryTone || 0.05;

            ctx.save();

            // 1. Render 3D Membrane Segment
            if (ui3d.membrane) {
                this.drawMembrane(ctx, ui3d.membrane, camera, projection, tone);
            }

            // 2. Render 3D Molecules
            ui3d.molecules.forEach(m => {
                const speedMult = 1 + tone * 2;
                m.x += m.vx * speedMult; m.y += m.vy * speedMult; m.z += m.vz * speedMult;

                // Box Wrap
                if (m.x > 500) m.x = -500; else if (m.x < -500) m.x = 500;
                if (m.y > 400) m.y = -400; else if (m.y < -400) m.y = 400;
                if (m.z > 400) m.z = -400; else if (m.z < -400) m.z = 400;

                const p = Math3D.project3DTo2D(m.x, m.y, m.z, camera, projection);
                if (p.scale <= 0) return;

                const alpha = Math3D.applyDepthFog(0.7, p.depth, 0.1, 0.8);
                if (!isFinite(alpha)) return;

                this.drawMoleculeMesh(ctx, m.mesh, p, alpha);
            });

            // 3. Render 3D Cells
            if (ui3d.molecularCells) {
                ui3d.molecularCells.forEach(c => {
                    const p = Math3D.project3DTo2D(c.x, c.y, c.z, camera, projection);
                    if (p.scale <= 0) return;
                    const alpha = Math3D.applyDepthFog(0.6, p.depth, 0.1, 0.9);
                    this.drawCellMesh(ctx, c, p, alpha);
                });
            }

            // 4. Advanced Signaling Overlays (Enhancements 4-40)
            if (window.GreenhouseInflammationSignaling) {
                window.GreenhouseInflammationSignaling.render(ctx, ui3d.app, state, projection, ui3d);
            }

            ctx.restore();

            // Legend
            this.drawLegend(ctx, projection);
        },

        drawCellMesh(ctx, cell, proj, alpha) {
            const mesh = cell.mesh;
            const ry = cell.rotationY + Date.now() * 0.0005;
            const rx = cell.rotationX;

            const rot = (v, ax, ay) => {
                let x1 = v.x * Math.cos(ay) - v.z * Math.sin(ay);
                let z1 = v.x * Math.sin(ay) + v.z * Math.cos(ay);
                let y2 = v.y * Math.cos(ax) - z1 * Math.sin(ax);
                let z2 = v.y * Math.sin(ax) + z1 * Math.cos(ax);
                return { x: x1, y: y2, z: z2 };
            };

            mesh.faces.forEach(f => {
                const v1 = mesh.vertices[f[0]], v2 = mesh.vertices[f[1]], v3 = mesh.vertices[f[2]];
                const r1 = rot(v1, rx, ry), r2 = rot(v2, rx, ry), r3 = rot(v3, rx, ry);

                ctx.beginPath();
                ctx.fillStyle = v1.color || '#fff';
                ctx.globalAlpha = alpha;

                ctx.moveTo(proj.x + r1.x * proj.scale, proj.y + r1.y * proj.scale);
                ctx.lineTo(proj.x + r2.x * proj.scale, proj.y + r2.y * proj.scale);
                ctx.lineTo(proj.x + r3.x * proj.scale, proj.y + r3.y * proj.scale);
                ctx.fill();

                ctx.strokeStyle = 'rgba(255,255,255,0.08)';
                ctx.lineWidth = 0.3;
                ctx.stroke();
            });
            ctx.globalAlpha = 1.0;
        },

        drawMembrane(ctx, mesh, camera, projection, tone) {
            const Math3D = window.GreenhouseModels3DMath;
            ctx.save();
            ctx.lineWidth = 0.5;

            mesh.faces.forEach(f => {
                const v1 = mesh.vertices[f[0]], v2 = mesh.vertices[f[1]], v3 = mesh.vertices[f[2]];
                const p1 = Math3D.project3DTo2D(v1.x, v1.y + 400, v1.z, camera, projection);
                const p2 = Math3D.project3DTo2D(v2.x, v2.y + 400, v2.z, camera, projection);
                const p3 = Math3D.project3DTo2D(v3.x, v3.y + 400, v3.z, camera, projection);

                if (p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
                    const alpha = Math3D.applyDepthFog(v1.type === 'head' ? 0.2 : 0.05, p1.depth, 0.1, 0.9);
                    ctx.fillStyle = v1.color || `rgba(100, 200, 255, ${alpha})`;
                    ctx.globalAlpha = alpha;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y);
                    ctx.fill();

                    if (v1.type === 'head') {
                        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                        ctx.stroke();
                    }
                }
            });
            ctx.globalAlpha = 1.0;
            ctx.restore();
        },

        drawMoleculeMesh(ctx, mesh, proj, alpha) {
            mesh.faces.forEach(f => {
                const v1 = mesh.vertices[f[0]], v2 = mesh.vertices[f[1]], v3 = mesh.vertices[f[2]];
                const color = v1.color || '#fff';

                ctx.beginPath();
                ctx.fillStyle = color;
                ctx.globalAlpha = alpha;

                ctx.moveTo(proj.x + v1.x * proj.scale, proj.y + v1.y * proj.scale);
                ctx.lineTo(proj.x + v2.x * proj.scale, proj.y + v2.y * proj.scale);
                ctx.lineTo(proj.x + v3.x * proj.scale, proj.y + v3.y * proj.scale);
                ctx.fill();

                ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            });
            ctx.globalAlpha = 1.0;
        },

        drawLegend(ctx, projection) {
            const lx = 30, ly = projection.height - 180;
            ctx.save();
            ctx.fillStyle = 'rgba(5, 10, 20, 0.8)';
            ctx.strokeStyle = 'rgba(76, 161, 175, 0.5)';
            // roundRect helper from ui3d or local
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(lx, ly, 180, 100, 12) : ctx.rect(lx, ly, 180, 100);
            ctx.fill(); ctx.stroke();

            const items = [
                { c: '#ff4444', l: 'Pro-Cytokine (TNF-α)' },
                { c: '#44ffaa', l: 'Anti-Cytokine (IL-10)' },
                { c: '#ffb6c1', l: 'Mast Cell (Granular)' },
                { c: '#ffcc00', l: 'Astrocyte (Endfeet)' },
                { c: '#4ca1af', l: 'Microglia (Reactive)' },
                { c: '#00ffcc', l: 'Signaling Trace (Active)' }
            ];
            items.forEach((item, i) => {
                ctx.fillStyle = item.c; ctx.beginPath(); ctx.arc(lx + 15, ly + 20 + i * 20, 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(item.l, lx + 30, ly + 24 + i * 20);
            });
            ctx.restore();
        }
    };

    window.GreenhouseInflammationMolecular = GreenhouseInflammationMolecular;
})();
