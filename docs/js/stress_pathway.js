/**
 * @file stress_pathway.js
 * @description Enhanced HPA-Axis Visualization with 3D Gland Structures and Dynamic Feedback.
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

            const projectedNodes = ui3d.hpaNodes.map(node => {
                const p = Math3D.project3DTo2D(node.x, node.y, node.z, camera, projection);
                let throb = 1.0;
                if (node.id === 'hypothalamus') throb = 1 + Math.sin(time * 0.005) * 0.1 * load;
                return { ...node, ...p, throb };
            });

            // 1. Draw Feed-Forward Connections
            ctx.save();
            for (let i = 0; i < projectedNodes.length - 1; i++) {
                const n1 = projectedNodes[i], n2 = projectedNodes[i + 1];
                if (n1.scale <= 0 || n2.scale <= 0) continue;

                const signalStrength = (f.stressorIntensity * 1.5) * (1 - (f.gabaMod || 0) * 0.5);
                ctx.lineWidth = 1 + signalStrength * 10;

                const grad = ctx.createLinearGradient(n1.x, n1.y, n2.x, n2.y);
                grad.addColorStop(0, n1.color); grad.addColorStop(1, n2.color);
                ctx.strokeStyle = grad; ctx.globalAlpha = 0.2 + load * 0.6;
                ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(n2.x, n2.y); ctx.stroke();
            }
            ctx.restore();

            // 2. Draw 3D Glands (Meshes)
            projectedNodes.forEach(node => {
                if (node.scale <= 0) return;
                this.drawGlandMesh(ctx, node, camera, projection, load, f);
            });

            // 3. Labels
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            projectedNodes.forEach(n => {
                if (n.scale > 0) ctx.fillText(t(n.label).toUpperCase(), n.x, n.y + 50 * n.scale);
            });
        },

        drawGlandMesh(ctx, node, camera, projection, load, f) {
            const Math3D = window.GreenhouseModels3DMath;
            const activity = node.id === 'adrenals' ? load : (f.stressorIntensity * (1 - (f.gabaMod || 0)));
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

                if (activity > 0.5) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                    ctx.stroke();
                }
            });
            ctx.restore();
        }
    };

    window.GreenhouseStressPathway = GreenhouseStressPathway;
})();
