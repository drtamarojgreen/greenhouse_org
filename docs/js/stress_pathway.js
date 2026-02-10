/**
 * @file stress_pathway.js
 * @description Scientifically comprehensive HPA-Axis and Dynamic Pathway Visualization.
 * Renders KEGG-sourced pathways integrated from the shared data bridge.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseStressPathway = {
        render(ctx, state, camera, projection, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            const f = state.factors;
            const time = state.time || 0;
            const activePathId = f.activePathway || 'hpa';

            // Use dynamic nodes if available, fallback to fixed HPA
            const sourceNodes = (ui3d.currentPathwayNodes && ui3d.currentPathwayNodes.length > 0) ? ui3d.currentPathwayNodes : ui3d.hpaNodes;
            const sourceEdges = ui3d.currentPathwayEdges || [];

            camera.rotationY += 0.001;

            const nodes = sourceNodes.map(node => {
                const p = Math3D.project3DTo2D(node.x, node.y, node.z, camera, projection);
                let throb = 1.0;
                // Add activity-based throb for core glands
                if (node.id === 'hypothalamus' || node.name === 'CRH') throb = 1 + Math.sin(time * 0.005) * 0.1;
                return { ...node, ...p, throb };
            });

            // 1. Draw Edges (Neural/Hormonal Pathways)
            ctx.save();
            sourceEdges.forEach(edge => {
                const n1 = nodes.find(n => n.id === edge.source);
                const n2 = nodes.find(n => n.id === edge.target);
                if (n1 && n2 && n1.scale > 0 && n2.scale > 0) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(100, 200, 255, ${0.2 * n1.scale})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(n1.x, n1.y);
                    ctx.lineTo(n2.x, n2.y);
                    ctx.stroke();

                    // Flow Animation
                    const progress = (time * 0.001) % 1;
                    const fx = n1.x + (n2.x - n1.x) * progress;
                    const fy = n1.y + (n2.y - n1.y) * progress;
                    ctx.fillStyle = '#4ca1af';
                    ctx.beginPath(); ctx.arc(fx, fy, 2, 0, Math.PI * 2); ctx.fill();
                }
            });
            ctx.restore();

            // 2. Draw Nodes
            nodes.forEach(node => {
                if (node.scale <= 0) return;

                // If node has a mesh (HPA glands), draw it
                if (node.mesh && (activePathId === 'hpa' || node.id === 'hypothalamus')) {
                    this.drawGlandMesh(ctx, node, camera, projection);
                } else {
                    // Draw dynamic KEGG node
                    this.drawKeggNode(ctx, node);
                }
            });

            // 3. Labels
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            nodes.forEach(n => {
                if (n.scale > 0.3) {
                    const label = (n.label || n.name || '').toUpperCase();
                    ctx.fillText(label, n.x, n.y + 15 * n.scale);
                }
            });
        },

        drawKeggNode(ctx, node) {
            const color = node.type === 'gene' ? '#ffcc00' : (node.type === 'compound' ? '#64d2ff' : '#00ff99');
            ctx.fillStyle = color;
            ctx.shadowBlur = 5;
            ctx.shadowColor = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 4 * node.scale * node.throb, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        },

        drawGlandMesh(ctx, node, camera, projection) {
            const Math3D = window.GreenhouseModels3DMath;
            const color = node.color || '#ffcc00';

            ctx.save();
            ctx.translate(node.x, node.y);

            node.mesh.faces.forEach(face => {
                const v1 = node.mesh.vertices[face[0]], v2 = node.mesh.vertices[face[1]], v3 = node.mesh.vertices[face[2]];
                const scale = node.scale * node.throb;
                const alpha = Math3D.applyDepthFog(0.5, node.depth, 0.1, 0.9);

                ctx.beginPath();
                ctx.fillStyle = color;
                ctx.globalAlpha = alpha;
                ctx.moveTo(v1.x * scale, v1.y * scale);
                ctx.lineTo(v2.x * scale, v2.y * scale);
                ctx.lineTo(v3.x * scale, v3.y * scale);
                ctx.fill();
            });
            ctx.restore();
        }
    };

    window.GreenhouseStressPathway = GreenhouseStressPathway;
})();
