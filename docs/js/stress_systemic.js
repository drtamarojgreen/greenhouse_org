/**
 * @file stress_systemic.js
 * @description Advanced Systemic Visualization: Renders the aggregate state of the 4 major systemic categories.
 * Visualizes the balance between Environmental Stressors and Resilient buffers (Psych/Philo/Research).
 */

(function () {
    'use strict';

    const GreenhouseStressSystemic = {
        crystalMesh: null,

        // Category Definitions for Visuals
        categories: {
            'env': { label: 'ENVIRONMENTAL LOAD', color: '#ff4d4d', orbit: 180, speed: 0.0005 },
            'psych': { label: 'PSYCHOLOGICAL BUFFER', color: '#ffcc00', orbit: 260, speed: -0.0003 },
            'philo': { label: 'PHILOSOPHICAL RESERVE', color: '#a18cd1', orbit: 340, speed: 0.0002 },
            'research': { label: 'BIOLOGICAL DEFENSE', color: '#64d2ff', orbit: 420, speed: -0.0004 }
        },

        render(ctx, state, camera, projection, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            const Geo = window.GreenhouseNeuroGeometry; // Fallback if needed, but we use primitives
            const config = window.GreenhouseStressConfig;

            if (!this.crystalMesh && Geo) this.crystalMesh = Geo.generateSphere(60, 8);

            const m = state.metrics;
            const f = state.factors;
            const time = state.time || 0;

            // 1. Calculate Aggregates
            const scores = { 'env': 0, 'psych': 0, 'philo': 0, 'research': 0 };
            let totalActive = 0;

            if (config && config.factors) {
                config.factors.forEach(fact => {
                    if (f[fact.id] === 1 && fact.category) {
                        if (scores[fact.category] !== undefined) {
                            scores[fact.category]++;
                            totalActive++;
                        }
                    }
                });
            }

            // 2. Render Central Resilience Crystal (The "Self")
            const cp = Math3D.project3DTo2D(0, 0, 0, camera, projection);
            if (cp.scale > 0) {
                // Pulse based on total active factors (system activation)
                const pulse = 1.0 + Math.sin(time * 0.005) * (0.05 + totalActive * 0.002);

                // Draw Crystal Glow
                const grad = ctx.createRadialGradient(cp.x, cp.y, 0, cp.x, cp.y, 80 * cp.scale * pulse);
                grad.addColorStop(0, `rgba(255, 255, 255, ${0.4 + (m.resilienceReserve * 0.4)})`);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(cp.x, cp.y, 80 * cp.scale * pulse, 0, Math.PI * 2); ctx.fill();

                // Draw Crystal Mesh (Wireframe)
                if (this.crystalMesh) {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + m.resilienceReserve * 0.5})`;
                    ctx.lineWidth = 1;
                    this.crystalMesh.faces.forEach(face => {
                        const v1 = this.crystalMesh.vertices[face[0]];
                        const v2 = this.crystalMesh.vertices[face[1]];
                        const v3 = this.crystalMesh.vertices[face[2]];
                        // Simple projection for wireframe lines relative to center
                        const p1 = Math3D.project3DTo2D(v1.x, v1.y, v1.z, camera, projection);
                        const p2 = Math3D.project3DTo2D(v2.x, v2.y, v2.z, camera, projection);
                        const p3 = Math3D.project3DTo2D(v3.x, v3.y, v3.z, camera, projection);

                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.closePath();
                        ctx.stroke();
                    });
                }
            }

            // 3. Render Category Nodes (Planetary Orbitals)
            Object.keys(this.categories).forEach((catKey, i) => {
                const cat = this.categories[catKey];
                const score = scores[catKey];
                const count = score; // Raw count for display

                // Orbit Logic
                const angle = time * cat.speed + (i * Math.PI / 2);
                const x = Math.cos(angle) * cat.orbit;
                const z = Math.sin(angle) * cat.orbit;
                const y = Math.sin(angle * 2) * 30; // Mild wave

                const p = Math3D.project3DTo2D(x, y, z, camera, projection);

                if (p.scale > 0) {
                    // Size depends on active score (min size 10, max size 60)
                    const radius = (10 + score * 3) * p.scale;

                    // Draw Connection to Center
                    ctx.beginPath();
                    ctx.strokeStyle = cat.color;
                    ctx.lineWidth = 1 * (score > 0 ? 2 : 0.5);
                    ctx.globalAlpha = 0.2 * Math.min(1, score * 0.1);
                    ctx.moveTo(cp.x, cp.y);
                    ctx.lineTo(p.x, p.y);
                    ctx.stroke();

                    // Draw Node
                    ctx.globalAlpha = 0.8;
                    ctx.fillStyle = cat.color;
                    ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fill();

                    // Glow
                    ctx.shadowBlur = 20; ctx.shadowColor = cat.color;
                    ctx.stroke(); ctx.shadowBlur = 0;

                    // Label & Count
                    ctx.fillStyle = '#fff';
                    ctx.font = `bold ${10 * p.scale}px Quicksand, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.fillText(cat.label, p.x, p.y - radius - 5);
                    ctx.font = `${12 * p.scale}px monospace`;
                    ctx.fillText(`${count} ACTIVE`, p.x, p.y + radius + 15);
                }
            });
            ctx.globalAlpha = 1.0;
        },

        // Simple hit check for the 4 main nodes
        checkHit(mx, my, camera, projection) {
            // Re-calculate simply to check distance (stateless)
            const Math3D = window.GreenhouseModels3DMath;
            const time = window.GreenhouseStressApp ? window.GreenhouseStressApp.engine.state.time : 0;

            let hit = null;
            Object.keys(this.categories).forEach((catKey, i) => {
                const cat = this.categories[catKey];
                const angle = time * cat.speed + (i * Math.PI / 2);
                const x = Math.cos(angle) * cat.orbit;
                const z = Math.sin(angle) * cat.orbit;
                const y = Math.sin(angle * 2) * 30;

                const p = Math3D.project3DTo2D(x, y, z, camera, projection);
                const dist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);

                if (dist < 40 * p.scale) { // generous hit area
                    hit = { id: `cat_${catKey}`, label: cat.label, type: 'category_node' };
                }
            });
            return hit;
        }
    };

    window.GreenhouseStressSystemic = GreenhouseStressSystemic;
})();
