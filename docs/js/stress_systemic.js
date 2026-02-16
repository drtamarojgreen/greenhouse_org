/**
 * @file stress_systemic.js
 * @description Advanced Systemic Visualization: Renders the aggregate state of the 4 major systemic categories.
 * Visualizes the balance between Environmental Stressors and Resilient buffers (Psych/Philo/Research).
 */

(function () {
    'use strict';

    const GreenhouseStressSystemic = {
        crystalMesh: null,
        nodeMeshes: {},
        particles: [],
        pulseOffsets: {},
        genomes: [],
        initialized: false,
        shockWave: 0,
        timelineT: 0.5, // Default center for scrubber
        scoreHistory: {}, // For mini-sparklines (Enhancement 20)

        // Category Definitions for Visuals (Enhancement 1: Neural regions added)
        // Note: All nodes are spheres per explicit user request.
        categories: {
            'hpa': { label: 'stress_cat_hpa', color: '#ff9500', orbit: 110, speed: 0.0001, total: 5, shape: 'sphere' },
            'env': { label: 'stress_cat_env', color: '#ff4d4d', orbit: 140, speed: 0.0002, total: 26, shape: 'sphere' },
            'limbic': { label: 'stress_cat_limbic', color: '#ff2d55', orbit: 170, speed: -0.00015, total: 6, shape: 'sphere' },
            'psych': { label: 'stress_cat_psych', color: '#ffcc00', orbit: 200, speed: -0.0001, total: 25, shape: 'sphere' },
            'cortical': { label: 'stress_cat_cortical', color: '#5856d6', orbit: 230, speed: 0.00008, total: 3, shape: 'sphere' },
            'philo': { label: 'stress_cat_philo', color: '#a18cd1', orbit: 260, speed: 0.00005, total: 25, shape: 'sphere' },
            'brainstem': { label: 'stress_cat_autonomic', color: '#4cd964', orbit: 290, speed: -0.00012, total: 10, shape: 'sphere' },
            'research': { label: 'stress_cat_biological_defense', color: '#64d2ff', orbit: 320, speed: -0.0002, total: 30, shape: 'sphere' },
            'interv': { label: 'stress_cat_interv', color: '#30b0c7', orbit: 350, speed: 0.00015, total: 4, shape: 'sphere' },
            'therapy': { label: 'stress_cat_therapy', color: '#00c7be', orbit: 380, speed: -0.00018, total: 8, shape: 'sphere' },
            'lifestyle': { label: 'stress_cat_lifestyle', color: '#a2845e', orbit: 410, speed: 0.00012, total: 7, shape: 'sphere' },
            'system': { label: 'stress_cat_system', color: '#8e8e93', orbit: 440, speed: -0.0001, total: 6, shape: 'sphere' }
        },

        initVisuals() {
            if (this.initialized) return;
            const Geo = window.GreenhouseNeuroGeometry;
            if (Geo) {
                Object.keys(this.categories).forEach(catKey => {
                    // All nodes are spheres per explicit request
                    this.nodeMeshes[catKey] = Geo.generateSphere(1.0, 6);
                });
            }

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
                this.scoreHistory[cat] = new Array(50).fill(0);
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
            const scores = {};
            Object.keys(this.categories).forEach(k => scores[k] = 0);
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

            // Update Shockwave (Enhancement 15)
            if (scores.env > 0 && Math.random() > 0.99) this.shockWave = 1.0;
            if (this.shockWave > 0) this.shockWave -= 0.01;

            // Update Histories (Enhancement 20)
            // Use integer floor of time or frame counter to ensure reliable updates
            const updateInterval = 200; // ~12 frames
            if (!this.lastUpdateTime || time - this.lastUpdateTime > updateInterval) {
                this.lastUpdateTime = time;
                Object.keys(this.categories).forEach(cat => {
                    this.scoreHistory[cat].push(scores[cat]);
                    if (this.scoreHistory[cat].length > 50) this.scoreHistory[cat].shift();
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
            const nodePositions = {};
            const renderedLabels = []; // Store label bounds to prevent overlap (Item 74 enhancement)

            Object.keys(this.categories).forEach((catKey, i) => {
                const cat = this.categories[catKey];
                const score = scores[catKey];
                const count = score; // Raw count for display

                // Orbit Logic (12 nodes spaced by PI/6)
                const angle = time * cat.speed + (i * Math.PI / 6);
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

                    // Draw Node as 3D Sphere (Enhancement: Nodes as Spheres)
                    const isHovered = ui3d && ui3d.app && ui3d.app.ui.hoveredElement && ui3d.app.ui.hoveredElement.id === `cat_${catKey}`;
                    ctx.globalAlpha = isHovered ? 1.0 : 0.8;

                    if (this.nodeMeshes[catKey]) {
                        ctx.strokeStyle = cat.color;
                        ctx.lineWidth = isHovered ? 2 : 1;
                        const sphereRad = 10 + score * 3;
                        this.nodeMeshes[catKey].faces.forEach(face => {
                            const v1 = this.nodeMeshes[catKey].vertices[face[0]];
                            const v2 = this.nodeMeshes[catKey].vertices[face[1]];
                            const v3 = this.nodeMeshes[catKey].vertices[face[2]];

                            const p1 = Math3D.project3DTo2D(x + v1.x * sphereRad, y + v1.y * sphereRad, z + v1.z * sphereRad, camera, projection);
                            const p2 = Math3D.project3DTo2D(x + v2.x * sphereRad, y + v2.y * sphereRad, z + v2.z * sphereRad, camera, projection);
                            const p3 = Math3D.project3DTo2D(x + v3.x * sphereRad, y + v3.y * sphereRad, z + v3.z * sphereRad, camera, projection);

                            ctx.beginPath();
                            ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.closePath();
                            ctx.stroke();
                        });
                    } else {
                        ctx.fillStyle = cat.color;
                        ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fill();
                    }

                    // Glow & Shockwave Pulse
                    const shockFactor = 1.0 + this.shockWave * (catKey === 'env' ? 0.5 : 0.2);
                    ctx.shadowBlur = (isHovered ? 40 : 20) * shockFactor;
                    ctx.shadowColor = cat.color;
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = isHovered ? 2 : 1;
                    ctx.stroke(); ctx.shadowBlur = 0;

                    // Label & Count (Enhanced with Percentage & Overlap Prevention)
                    const total = cat.total || 25;
                    const percent = Math.round((score / total) * 100);

                    ctx.fillStyle = '#fff';
                    ctx.font = `bold ${10 * p.scale}px Quicksand, sans-serif`;
                    ctx.textAlign = 'center';

                    let labelY = p.y - radius - 8;
                    let countY = p.y + radius + 15;

                    // Simple Collision Check
                    renderedLabels.forEach(other => {
                        const dx = Math.abs(p.x - other.x);
                        const dy = Math.abs(labelY - other.y);
                        if (dx < 80 * p.scale && dy < 25 * p.scale) {
                            labelY -= 20 * p.scale; // Shift up if overlapping
                        }
                    });
                    renderedLabels.push({ x: p.x, y: labelY });

                    ctx.fillText(window.GreenhouseModelsUtil.t(cat.label), p.x, labelY);
                    ctx.font = `${11 * p.scale}px monospace`;
                    ctx.fillText(`${score}/${total} (${percent}%)`, p.x, countY);

                    nodePositions[catKey] = { x: p.x, y: p.y, scale: p.scale, color: cat.color, score: score };
                }
            });

            // 3.5 Animated Signaling Flow (Enhancement 6 & 14)
            const flow = [
                ['env', 'brainstem'], ['brainstem', 'limbic'], ['limbic', 'hpa'], ['hpa', 'cortical'],
                ['psych', 'cortical'], ['philo', 'cortical'], ['research', 'cortical'],
                ['interv', 'cortical'], ['therapy', 'cortical'], ['lifestyle', 'cortical'], ['system', 'interv']
            ];
            flow.forEach(([from, to]) => {
                const p1 = nodePositions[from];
                const p2 = nodePositions[to];
                if (p1 && p2) {
                    ctx.beginPath();
                    ctx.strokeStyle = p1.color;
                    ctx.globalAlpha = 0.2;
                    ctx.lineWidth = (1 + p1.score * 0.5) * p1.scale;
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();

                    // Animated Arrow
                    const arrowT = (time * 0.001) % 1.0;
                    const ax = p1.x + (p2.x - p1.x) * arrowT;
                    const ay = p1.y + (p2.y - p1.y) * arrowT;
                    ctx.fillStyle = '#fff';
                    ctx.globalAlpha = 0.6;
                    ctx.beginPath();
                    ctx.arc(ax, ay, 2 * p1.scale, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // 4. Threshold Markers (Enhancement 7)
            if (load > 0.8) {
                ctx.strokeStyle = '#ff4d4d';
                ctx.lineWidth = 3;
                ctx.setLineDash([10, 5]);
                ctx.beginPath();
                ctx.arc(cp.x, cp.y, 100 * cp.scale, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#ff4d4d';
                ctx.font = 'bold 12px Arial';
                ctx.fillText(window.GreenhouseModelsUtil.t('stress_ui_critical_overload'), cp.x, cp.y - 110 * cp.scale);
            }

            // 5. Timeline Scrubber (Enhancement 2)
            const sw = ctx.canvas.width;
            const sh = ctx.canvas.height;
            const scrubberW = 400;
            const scrubberX = (sw - scrubberW) / 2;
            const scrubberY = sh - 40;

            // Check if hovering scrubber for cursor change or interaction
            const app = window.GreenhouseStressApp;
            const mx = app ? app.interaction.mouseX : 0;
            const my = app ? app.interaction.mouseY : 0;
            const isHoveringScrubber = mx >= scrubberX && mx <= scrubberX + scrubberW && my >= scrubberY - 10 && my <= scrubberY + 20;
            if (isHoveringScrubber && app && app.canvas) app.canvas.style.cursor = 'pointer';

            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(scrubberX, scrubberY, scrubberW, 10);

            ctx.fillStyle = '#64d2ff';
            ctx.fillRect(scrubberX, scrubberY, scrubberW * this.timelineT, 10);

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = isHoveringScrubber ? 2 : 1;
            ctx.strokeRect(scrubberX + scrubberW * this.timelineT - 5, scrubberY - 5, 10, 20);

            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(window.GreenhouseModelsUtil.t('stress_ui_acute'), scrubberX, scrubberY + 25);
            ctx.textAlign = 'center';
            ctx.fillText(window.GreenhouseModelsUtil.t('stress_ui_subacute'), scrubberX + scrubberW / 2, scrubberY + 25);
            ctx.textAlign = 'right';
            ctx.fillText(window.GreenhouseModelsUtil.t('stress_ui_chronic'), scrubberX + scrubberW, scrubberY + 25);

            // 6. Real-time Metrics Dashboard (Enhancement 21)
            this.renderMetricsDashboard(ctx, state, sw, sh);

            ctx.globalAlpha = 1.0;
        },

        renderMetricsDashboard(ctx, state, sw, sh) {
            const m = state.metrics;
            const dw = 200;
            const dh = 120;
            const dx = sw - dw - 20;
            const dy = 80;

            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.strokeStyle = 'rgba(100, 210, 255, 0.3)';
            ctx.lineWidth = 1;
            if (window.GreenhouseStressApp && window.GreenhouseStressApp.roundRect) {
                window.GreenhouseStressApp.roundRect(ctx, dx, dy, dw, dh, 8, true, true);
            } else {
                ctx.fillRect(dx, dy, dw, dh);
                ctx.strokeRect(dx, dy, dw, dh);
            }

            ctx.fillStyle = '#64d2ff';
            ctx.font = 'bold 10px Quicksand, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(window.GreenhouseModelsUtil.t('stress_ui_live_telemetry').toUpperCase(), dx + 10, dy + 20);

            const telemetry = [
                { label: 'HRV', value: (m.hrv || 0).toFixed(0) + 'ms', color: '#00ff99' },
                { label: 'CORT', value: (m.cortisolLevels || 0).toFixed(1), color: '#ffcc00' },
                { label: 'SERO', value: (m.serotoninLevels || 0).toFixed(0), color: '#5856d6' }
            ];

            telemetry.forEach((t, i) => {
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.font = '9px monospace';
                ctx.fillText(t.label, dx + 10, dy + 40 + i * 25);
                ctx.fillStyle = t.color;
                ctx.font = 'bold 11px monospace';
                ctx.fillText(t.value, dx + 50, dy + 40 + i * 25);

                // Small scrolling graph for each
                const history = this.scoreHistory['hpa']; // Proxy for history
                ctx.beginPath();
                ctx.strokeStyle = t.color;
                ctx.globalAlpha = 0.3;
                for (let j = 0; j < 20; j++) {
                    const val = history[history.length - 20 + j] || 0;
                    const gx = dx + 100 + j * 4;
                    const gy = dy + 40 + i * 25 - (val * 2);
                    if (j === 0) ctx.moveTo(gx, gy);
                    else ctx.lineTo(gx, gy);
                }
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            });

            ctx.restore();
        },

        // Hit check for the 8 main nodes
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

                const angle = time * cat.speed + (i * Math.PI / 6);
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
