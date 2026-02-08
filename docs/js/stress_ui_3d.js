/**
 * @file stress_ui_3d.js
 * @description 3D Visualization components for the Stress Dynamics Simulation.
 */

(function () {
    'use strict';

    const GreenhouseStressUI3D = {
        renderReserve(ctx, state, camera, projection) {
            if (!window.GreenhouseModels3DMath) return;

            const Math3D = window.GreenhouseModels3DMath;
            const metrics = state.metrics;
            const reserve = metrics.resilienceReserve;
            const load = metrics.allostaticLoad;

            // Rotate camera
            camera.rotationY += 0.005;

            // Generate points for a "Resilience Crystal" (Octahedron-ish)
            const size = 100 * (0.5 + reserve);
            const vertices = [
                { x: 0, y: size, z: 0 },
                { x: 0, y: -size, z: 0 },
                { x: size, y: 0, z: 0 },
                { x: -size, y: 0, z: 0 },
                { x: 0, y: 0, z: size },
                { x: 0, y: 0, z: -size }
            ];

            const projected = vertices.map(v => Math3D.project3DTo2D(v.x, v.y, v.z, camera, projection));

            // Draw edges
            const edges = [
                [0, 2], [0, 3], [0, 4], [0, 5],
                [1, 2], [1, 3], [1, 4], [1, 5],
                [2, 4], [4, 3], [3, 5], [5, 2]
            ];

            ctx.lineWidth = 2;
            edges.forEach(edge => {
                const p1 = projected[edge[0]];
                const p2 = projected[edge[1]];
                if (p1.scale <= 0 || p2.scale <= 0) return;

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);

                const alpha = Math3D.applyDepthFog(0.6, (p1.depth + p2.depth) / 2);
                ctx.strokeStyle = `rgba(76, 161, 175, ${alpha * reserve})`; // Teal
                ctx.stroke();
            });

            // Draw "Allostatic Spikes" if load is high
            if (load > 0.4) {
                const spikeCount = Math.floor(load * 20);
                for (let i = 0; i < spikeCount; i++) {
                    const angle = (i / spikeCount) * Math.PI * 2 + state.time * 0.001;
                    const r = size * (1 + Math.random() * 0.5 * load);
                    const v = {
                        x: Math.cos(angle) * r,
                        y: (Math.random() - 0.5) * r,
                        z: Math.sin(angle) * r
                    };
                    const p = Math3D.project3DTo2D(v.x, v.y, v.z, camera, projection);
                    if (p.scale > 0) {
                        ctx.beginPath();
                        ctx.moveTo(projection.width / 2, projection.height / 2);
                        ctx.lineTo(p.x, p.y);
                        ctx.strokeStyle = `rgba(255, 77, 77, ${0.2 * load * p.scale})`;
                        ctx.stroke();
                    }
                }
            }
        }
    };

    window.GreenhouseStressUI3D = GreenhouseStressUI3D;
})();
