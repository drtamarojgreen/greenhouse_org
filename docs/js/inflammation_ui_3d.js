/**
 * @file inflammation_ui_3d.js
 * @description 3D Visualization components for the Neuroinflammation Simulation.
 */

(function () {
    'use strict';

    const GreenhouseInflammationUI3D = {
        renderField(ctx, nodes, camera, projection, tone) {
            if (!window.GreenhouseModels3DMath) return;

            const Math3D = window.GreenhouseModels3DMath;

            // Project nodes to 2D
            const projectedNodes = nodes.map(n => {
                // Update positions in 3D (drift)
                n.x += n.vx * (1 + tone);
                n.y += n.vy * (1 + tone);
                n.z += n.vz * (1 + tone);

                // Bounds check (-300 to 300 range roughly)
                if (Math.abs(n.x) > 300) n.vx *= -1;
                if (Math.abs(n.y) > 200) n.vy *= -1;
                if (Math.abs(n.z) > 200) n.vz *= -1;

                return {
                    ...Math3D.project3DTo2D(n.x, n.y, n.z, camera, projection),
                    original: n
                };
            });

            // Depth sorting
            projectedNodes.sort((a, b) => b.depth - a.depth);

            // Draw connections first (back-to-front)
            projectedNodes.forEach(p => {
                if (p.scale <= 0) return;

                projectedNodes.forEach(p2 => {
                    if (p === p2 || p2.depth < p.depth) return; // Only draw to "closer" nodes to avoid double lines

                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const distSq = dx * dx + dy * dy;

                    // Connection distance scales with perspective
                    if (distSq < 5000 * p.scale) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);

                        const alpha = Math3D.applyDepthFog(0.3, p.depth);
                        const connAlpha = alpha * (1 - tone * 0.5);

                        ctx.strokeStyle = tone > 0.6
                            ? `rgba(255, 100, 0, ${connAlpha * 0.5})`
                            : `rgba(100, 200, 255, ${connAlpha})`;

                        ctx.lineWidth = 1 * p.scale;
                        ctx.stroke();
                    }
                });
            });

            // Draw nodes
            projectedNodes.forEach(p => {
                if (p.scale <= 0) return;

                const size = (4 + tone * 6) * p.scale;
                const alpha = Math3D.applyDepthFog(0.8, p.depth);

                ctx.beginPath();
                ctx.arc(p.x, p.y, size, 0, Math.PI * 2);

                // Color shifts from blue (healthy) to orange/red (inflamed)
                ctx.fillStyle = tone > 0.5
                    ? `rgba(255, ${200 * (1 - tone)}, 50, ${alpha})`
                    : `rgba(100, 200, 255, ${alpha})`;

                ctx.fill();

                // Inner glow for active nodes
                if (tone > 0.3) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, size * 0.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
                    ctx.fill();
                }
            });
        }
    };

    window.GreenhouseInflammationUI3D = GreenhouseInflammationUI3D;
})();
