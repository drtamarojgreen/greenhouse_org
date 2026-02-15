/**
 * @file stress_systemic.js
 * @description Advanced Systemic Visualization: Renders the aggregate state of the 4 major systemic categories.
 * Visualizes the balance between Environmental Stressors and Resilient buffers (Psych/Philo/Research).
 */

(function () {
    'use strict';

    const GreenhouseStressSystemic = {
        crystalMesh: null,
        particles: [],
        pulseOffsets: {},
        genomes: [],
        initialized: false,

        // Category Definitions for Visuals
        categories: {
            'env': { label: 'ENVIRONMENTAL LOAD', color: '#ff4d4d', orbit: 160, speed: 0.0005, total: 26 },
            'psych': { label: 'PSYCHOLOGICAL BUFFER', color: '#ffcc00', orbit: 220, speed: -0.0003, total: 25 },
            'philo': { label: 'PHILOSOPHICAL RESERVE', color: '#a18cd1', orbit: 280, speed: 0.0002, total: 25 },
            'research': { label: 'BIOLOGICAL DEFENSE', color: '#64d2ff', orbit: 340, speed: -0.0004, total: 25 }
        },

        initVisuals() {
            if (this.initialized) return;
            for (let i = 0; i < 40; i++) {
                this.particles.push({
                    angle: Math.random() * Math.PI * 2,
                    orbit: 100 + Math.random() * 300,
                    speed: 0.001 + Math.random() * 0.003,
                    y: (Math.random() - 0.5) * 150,
                    size: 1 + Math.random() * 2
                });
            }
            for (let i = 0; i < 6; i++) {
                this.genomes.push({
                    x: (Math.random() - 0.5) * 800,
                    y: (Math.random() - 0.5) * 600,
                    z: (Math.random() - 0.5) * 400,
                    rot: Math.random() * Math.PI * 2,
                    speed: 0.005 + Math.random() * 0.01
                });
            }
            Object.keys(this.categories).forEach(cat => {
                this.pulseOffsets[cat] = 0;
            });
            this.initialized = true;
        },

        render(ctx, state, camera, projection, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            const Geo = window.GreenhouseNeuroGeometry;
            const config = window.GreenhouseStressConfig;

            if (!this.initialized) this.initVisuals();
            if (!this.crystalMesh && Geo) this.crystalMesh = Geo.generateSphere(60, 8);

            const m = state.metrics;
            const f = state.factors;
            const time = state.time || 0;
            const load = m.allostaticLoad || 0;

            // 0. Background Aura (Global Stress Indicator)
            const cp = Math3D.project3DTo2D(0, 0, 0, camera, projection);
            if (cp.scale > 0) {
                const auraSize = Math.max(ctx.canvas.width, ctx.canvas.height) * 0.8;
                const auraGrad = ctx.createRadialGradient(cp.x, cp.y, 0, cp.x, cp.y, auraSize);
                // Transitions from Blue (Low Stress) to Red (High Stress)
                const r = Math.floor(50 + load * 205);
                const g = Math.floor(150 * (1 - load));
                const b = Math.floor(255 * (1 - load));
                auraGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.15)`);
                auraGrad.addColorStop(1, 'transparent');
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                ctx.fillStyle = auraGrad;
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.restore();
            }

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

            // 1.5 Render Floating Genomes
            this.genomes.forEach(g => {
                g.rot += g.speed;
                const p = Math3D.project3DTo2D(g.x, g.y, g.z, camera, projection);
                if (p.scale > 0) {
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(g.rot);
                    ctx.strokeStyle = `rgba(100, 210, 255, ${0.1 * p.scale})`;
                    ctx.lineWidth = 2 * p.scale;
                    ctx.beginPath();
                    for (let j = -15; j <= 15; j += 2) {
                        const sy = Math.sin(j * 0.3) * 10;
                        ctx.lineTo(j * p.scale, sy * p.scale);
                    }
                    ctx.stroke();
                    ctx.restore();
                }
            });

            // 1.6 Render Systemic Flux Particles
            this.particles.forEach(p => {
                p.angle += p.speed * (0.5 + load * 2.0);
                const px = Math.cos(p.angle) * p.orbit;
                const pz = Math.sin(p.angle) * p.orbit;
                const pt = Math3D.project3DTo2D(px, p.y, pz, camera, projection);
                if (pt.scale > 0) {
                    ctx.fillStyle = `rgba(${100 + load * 155}, ${200 - load * 150}, 255, ${0.4 * pt.scale})`;
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, p.size * pt.scale, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // 2. Render Central Resilience Crystal (The "Self")
            // Re-use cp from Step 0
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

                    // Draw Connection to Center with Pulsing Data
                    const pulseCount = Math.min(5, Math.max(1, score));
                    this.pulseOffsets[catKey] = (this.pulseOffsets[catKey] || 0) + 0.01 + score * 0.005;

                    ctx.beginPath();
                    ctx.strokeStyle = cat.color;
                    ctx.lineWidth = 1 * (score > 0 ? 2 : 0.5);
                    ctx.globalAlpha = 0.2 * Math.min(1, score * 0.1 + 0.1);
                    ctx.moveTo(cp.x, cp.y);
                    ctx.lineTo(p.x, p.y);
                    ctx.stroke();

                    // Draw Data Pulses
                    if (score > 0) {
                        for (let j = 0; j < pulseCount; j++) {
                            const pulseT = (this.pulseOffsets[catKey] + j / pulseCount) % 1.0;
                            const pulseX = p.x + (cp.x - p.x) * pulseT;
                            const pulseY = p.y + (cp.y - p.y) * pulseT;
                            ctx.fillStyle = cat.color;
                            ctx.globalAlpha = 0.8 * (1 - pulseT);
                            ctx.beginPath();
                            ctx.arc(pulseX, pulseY, 3 * p.scale, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }

                    // Draw Node
                    const isHovered = ui3d && ui3d.app && ui3d.app.ui.hoveredElement && ui3d.app.ui.hoveredElement.id === `cat_${catKey}`;
                    ctx.globalAlpha = isHovered ? 1.0 : 0.8;
                    ctx.fillStyle = cat.color;
                    ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fill();

                    // Glow
                    ctx.shadowBlur = isHovered ? 40 : 20;
                    ctx.shadowColor = cat.color;
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = isHovered ? 2 : 1;
                    ctx.stroke(); ctx.shadowBlur = 0;

                    // Label & Count (Enhanced with Percentage)
                    const total = cat.total || 25;
                    const percent = Math.round((score / total) * 100);
                    ctx.fillStyle = '#fff';
                    ctx.font = `bold ${10 * p.scale}px Quicksand, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.fillText(cat.label, p.x, p.y - radius - 8);
                    ctx.font = `${11 * p.scale}px monospace`;
                    ctx.fillText(`${score}/${total} (${percent}%)`, p.x, p.y + radius + 15);
                }
            });
            ctx.globalAlpha = 1.0;
        },

        // Simple hit check for the 4 main nodes
        checkHit(mx, my, camera, projection) {
            const Math3D = window.GreenhouseModels3DMath;
            const app = window.GreenhouseStressApp;
            const time = app ? app.engine.state.time : 0;
            const state = app ? app.engine.state : null;
            const config = window.GreenhouseStressConfig;

            if (!state || !config) return null;

            let hit = null;
            Object.keys(this.categories).forEach((catKey, i) => {
                const cat = this.categories[catKey];

                // Calculate score to match dynamic radius in render()
                let score = 0;
                config.factors.forEach(fact => {
                    if (state.factors[fact.id] === 1 && fact.category === catKey) score++;
                });

                const angle = time * cat.speed + (i * Math.PI / 2);
                const x = Math.cos(angle) * cat.orbit;
                const z = Math.sin(angle) * cat.orbit;
                const y = Math.sin(angle * 2) * 30;

                const p = Math3D.project3DTo2D(x, y, z, camera, projection);
                const dist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);

                const radius = (10 + score * 3) * p.scale;
                if (dist < radius + 5 * p.scale) {
                    hit = { id: `cat_${catKey}`, label: cat.label, type: 'category_node' };
                }
            });
            return hit;
        }
    };

    window.GreenhouseStressSystemic = GreenhouseStressSystemic;
})();
