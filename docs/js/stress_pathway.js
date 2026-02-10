/**
 * @file stress_pathway.js
 * @description Scientifically comprehensive HPA-Axis Visualization.
 * Includes CRH/ACTH signaling, feedback regulators (PFC, Amygdala, Hippocampus), and negative feedback loops.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseStressPathway = {
        render(ctx, state, camera, projection, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            const load = state.metrics.allostaticLoad || 0;
            const f = state.factors;
            const time = state.time || 0;

            camera.rotationY += 0.002;

            const nodes = ui3d.hpaNodes.map(node => {
                const p = Math3D.project3DTo2D(node.x, node.y, node.z, camera, projection);
                let throb = 1.0;
                if (node.id === 'hypothalamus') throb = 1 + Math.sin(time * 0.005) * 0.1 * load;
                if (node.id === 'amygdala') throb = 1 + Math.sin(time * 0.008) * 0.05 * f.stressorIntensity;
                return { ...node, ...p, throb };
            });

            // 1. Draw Feed-Forward Cascade (CRH & ACTH)
            this.drawCascade(ctx, nodes, time, f, load);

            // 2. Draw Regulatory Inputs (Amygdala +, PFC -, Hippo -)
            this.drawRegulation(ctx, nodes, f);

            // 3. Draw Negative Feedback Loop (Cortisol inhibition)
            this.drawNegativeFeedback(ctx, nodes, load);

            // 4. Draw 3D Gland Meshes
            nodes.forEach(node => {
                if (node.scale <= 0) return;
                this.drawGlandMesh(ctx, node, camera, projection, load, f);

                // Labels with scientific sub-text
                ctx.save();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 11px monospace';
                ctx.textAlign = 'center';
                const label = t(node.label).toUpperCase();
                ctx.fillText(label, n.x, n.y + 55 * n.scale);

                let subtext = "";
                if (node.id === 'hypothalamus') subtext = "CRH RELEASE";
                else if (node.id === 'pituitary') subtext = "ACTH SECRETION";
                else if (node.id === 'adrenals') subtext = "CORTISOL SYNTHESIS";
                else if (node.type === 'regulator') subtext = node.function === 'inhibitor' ? "GABAergic Inhibition" : "Glutamatergic Excitation";

                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.font = '8px monospace';
                ctx.fillText(subtext, n.x, n.y + 65 * n.scale);
                ctx.restore();
            });
        },

        drawCascade(ctx, nodes, time, f, load) {
            const h = nodes.find(n => n.id === 'hypothalamus');
            const p = nodes.find(n => n.id === 'pituitary');
            const a = nodes.find(n => n.id === 'adrenals');

            if (!h || !p || !a) return;

            const drawSignal = (n1, n2, label, color, speed) => {
                if (n1.scale <= 0 || n2.scale <= 0) return;

                // Connection Line
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.globalAlpha = 0.2 + load * 0.4;
                ctx.lineWidth = 2 + load * 4;
                ctx.moveTo(n1.x, n1.y);
                ctx.lineTo(n2.x, n2.y);
                ctx.stroke();

                // Hormonal Particles
                const count = 5 + Math.floor(load * 10);
                for (let i = 0; i < count; i++) {
                    const progress = (time * speed + i / count) % 1;
                    const sx = n1.x + (n2.x - n1.x) * progress;
                    const sy = n1.y + (n2.y - n1.y) * progress;
                    ctx.fillStyle = '#fff';
                    ctx.beginPath(); ctx.arc(sx, sy, 2 * n1.scale, 0, Math.PI * 2); ctx.fill();
                }

                // Small hormone label
                ctx.fillStyle = color;
                ctx.font = 'bold 9px sans-serif';
                ctx.fillText(label, (n1.x + n2.x) / 2 + 20, (n1.y + n2.y) / 2);
            };

            drawSignal(h, p, "CRH", "#ffcc00", 0.002);
            drawSignal(p, a, "ACTH", "#ff9900", 0.0015);
        },

        drawRegulation(ctx, nodes, f) {
            const h = nodes.find(n => n.id === 'hypothalamus');
            const regulators = nodes.filter(n => n.type === 'regulator');

            regulators.forEach(r => {
                if (r.scale <= 0 || h.scale <= 0) return;

                const isExcitor = r.function === 'excitor';
                ctx.beginPath();
                ctx.setLineDash([2, 2]);
                ctx.strokeStyle = isExcitor ? 'rgba(255, 100, 100, 0.5)' : 'rgba(100, 150, 255, 0.5)';
                ctx.moveTo(r.x, r.y);
                ctx.lineTo(h.x, h.y);
                ctx.stroke();
                ctx.setLineDash([]);

                // Directional Arrow
                const angle = Math.atan2(h.y - r.y, h.x - r.x);
                const tx = h.x - Math.cos(angle) * 30 * h.scale;
                const ty = h.y - Math.sin(angle) * 30 * h.scale;

                ctx.fillStyle = ctx.strokeStyle;
                ctx.beginPath();
                ctx.arc(tx, ty, isExcitor ? 4 : 2, 0, Math.PI * 2);
                ctx.fill();
                if (!isExcitor) {
                    // Inhibition "bar"
                    ctx.save();
                    ctx.translate(tx, ty);
                    ctx.rotate(angle);
                    ctx.fillRect(-1, -6, 2, 12);
                    ctx.restore();
                }
            });
        },

        drawNegativeFeedback(ctx, nodes, load) {
            const a = nodes.find(n => n.id === 'adrenals');
            const targets = nodes.filter(n => n.id === 'hypothalamus' || n.id === 'pituitary' || n.id === 'hippocampus');

            targets.forEach(t => {
                if (a.scale <= 0 || t.scale <= 0) return;

                // Curve Path
                const cp = { x: (a.x + t.x) / 2 + 150, y: (a.y + t.y) / 2 };
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 100, 100, ${0.6 * (1 - load * 0.8)})`;
                ctx.setLineDash([4, 4]);
                ctx.moveTo(a.x, a.y);
                ctx.quadraticCurveTo(cp.x, cp.y, t.x, t.y);
                ctx.stroke();
                ctx.setLineDash([]);

                // Feedback pulse (Cortisol)
                const progress = (Date.now() * 0.001) % 1;
                const fx = Math.pow(1 - progress, 2) * a.x + 2 * (1 - progress) * progress * cp.x + Math.pow(progress, 2) * t.x;
                const fy = Math.pow(1 - progress, 2) * a.y + 2 * (1 - progress) * progress * cp.y + Math.pow(progress, 2) * t.y;
                ctx.fillStyle = '#ff8888';
                ctx.beginPath(); ctx.arc(fx, fy, 3 * a.scale, 0, Math.PI * 2); ctx.fill();
            });
        },

        drawGlandMesh(ctx, node, camera, projection, load, f) {
            const Math3D = window.GreenhouseModels3DMath;
            const activity = node.id === 'adrenals' ? load : (f.stressorIntensity * (node.function === 'excitor' ? 1 : 0.2));
            const color = node.color;

            ctx.save();
            ctx.translate(node.x, node.y);

            node.mesh.faces.forEach(face => {
                const v1 = node.mesh.vertices[face[0]], v2 = node.mesh.vertices[face[1]], v3 = node.mesh.vertices[face[2]];
                const scale = node.scale * node.throb;
                const alpha = Math3D.applyDepthFog(0.4 + activity * 0.4, node.depth, 0.1, 0.9);

                ctx.beginPath();
                ctx.fillStyle = color;
                ctx.globalAlpha = alpha;
                ctx.moveTo(v1.x * scale, v1.y * scale);
                ctx.lineTo(v2.x * scale, v2.y * scale);
                ctx.lineTo(v3.x * scale, v3.y * scale);
                ctx.fill();

                if (activity > 0.5 || node.type === 'regulator') {
                    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            });
            ctx.restore();
        }
    };

    window.GreenhouseStressPathway = GreenhouseStressPathway;
})();
