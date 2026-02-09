/**
 * @file stress_macro.js
 * @description Macro-level (Brain) rendering logic for the Stress Dynamics Simulation.
 * Implements high-fidelity holographic schematics, orbital stressors, and genetic scaffolding.
 * Phase 3: Added Aura Metrics (Static), Dynamic Probes (Waveforms), and Contextual Zoom.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseStressMacro = {
        orbitalRotation: 0,
        particles: [],
        helixRotation: 0,
        waveOffsets: {},

        render(ctx, state, camera, projection, ui3d) {
            if (!ui3d.brainShell) return;

            const Math3D = window.GreenhouseModels3DMath;
            const intensity = state.factors.stressorIntensity || 0;
            const load = state.metrics.allostaticLoad || 0;

            this.orbitalRotation += 0.005;
            this.helixRotation += 0.01;

            // 1. AURA METRICS (Systemic Noise/Static)
            this.drawAuraMetrics(ctx, load, projection);

            // 2. GHOST BRAIN (Holographic Schematic)
            const regions = ui3d.brainShell.regions;
            for (const key in regions) {
                const k = key.toLowerCase();
                const isPFC = k === 'pfc';
                const isAmy = k === 'amygdala';
                const isHovered = ui3d.app.ui.hoveredElement && ui3d.app.ui.hoveredElement.id === key;

                if (isHovered) {
                    regions[key].color = `rgba(255, 255, 255, 0.15)`;
                } else if (isAmy && intensity > 0.5) {
                    regions[key].color = `rgba(255, 80, 0, ${0.1 + intensity * 0.15})`;
                } else if (isPFC) {
                    regions[key].color = `rgba(100, 200, 255, ${0.1 + (1 - intensity) * 0.1})`;
                } else {
                    regions[key].color = 'rgba(100, 150, 200, 0.05)';
                }
            }

            // 3. ELITE RENDERER (Holographic/Wireframe hybrid)
            this.drawEliteBrain(ctx, ui3d.brainShell, camera, projection, intensity, ui3d);

            // 4. GENETIC SCAFFOLDING (DNA Double Helix)
            this.drawGeneticScaffold(ctx, state, camera, projection);

            // 5. SYSTEMIC FLOW (Cortisol / HPA Pathway)
            this.drawSystemicFlow(ctx, state, camera, projection, ui3d);

            // 6. ORBITAL INFLUENCE FACTORS
            this.drawMentalHealthFactors(ctx, state, camera, projection, ui3d);

            // 7. HUD LABELS & DYNAMIC PROBES
            this.drawHUDLabels(ctx, ui3d, camera, projection, state);

            // 8. CONTEXTUAL ZOOM (Micro-mechanism Overlay)
            this.drawContextualZoom(ctx, ui3d, state);
        },

        drawAuraMetrics(ctx, load, projection) {
            if (load < 0.2) return;
            ctx.save();
            const count = Math.round(load * 40);
            ctx.fillStyle = `rgba(255, 100, 0, ${load * 0.2})`;
            for (let i = 0; i < count; i++) {
                const x = Math.random() * projection.width;
                const y = Math.random() * projection.height;
                const size = Math.random() * 2;
                if (Math.random() > 0.95) {
                    // "Static" glitch line
                    ctx.fillRect(x, y, 20 * load, 0.5);
                } else {
                    ctx.fillRect(x, y, size, size);
                }
            }
            ctx.restore();
        },

        drawGeneticScaffold(ctx, state, camera, projection) {
            const Math3D = window.GreenhouseModels3DMath;
            const hasVariant = state.factors.comtValMet || state.factors.serotoninTransporter || state.factors.fkbp5Variant;
            if (!hasVariant) return;

            ctx.save();
            const points = 30;
            const radius = 40;
            const height = 180;
            const yBase = -280;

            for (let i = 0; i < points; i++) {
                const t = i / points;
                const angle = t * Math.PI * 4 + this.helixRotation;

                const drawStrand = (offset) => {
                    const x = Math.cos(angle + offset) * radius;
                    const z = Math.sin(angle + offset) * radius;
                    const y = yBase + (t * height);

                    const p = Math3D.project3DTo2D(x, -y, z, camera, projection);
                    if (p.scale > 0) {
                        const alpha = Math3D.applyDepthFog(0.6, p.depth, 0.1, 0.9);
                        ctx.fillStyle = hasVariant ? `rgba(255, 180, 0, ${alpha})` : `rgba(0, 255, 200, ${alpha})`;

                        const glitch = (hasVariant && Math.random() > 0.98) ? (Math.random() - 0.5) * 10 : 0;
                        ctx.beginPath();
                        ctx.arc(p.x + glitch, p.y, 3 * p.scale, 0, Math.PI * 2);
                        ctx.fill();

                        if (i % 3 === 0) {
                            const p2 = Math3D.project3DTo2D(Math.cos(angle + offset + Math.PI) * radius, -y, Math.sin(angle + offset + Math.PI) * radius, camera, projection);
                            if (p2.scale > 0) {
                                ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.2})`;
                                ctx.lineWidth = 0.5;
                                ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                            }
                        }
                    }
                };
                drawStrand(0);
            }
            ctx.restore();
        },

        drawSystemicFlow(ctx, state, camera, projection, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            const hypothalamus = ui3d.brainShell.regions.hypothalamus.centroid || { x: 0, y: 0, z: 0 };
            const load = state.metrics.allostaticLoad || 0;

            if (this.particles.length < 50 + load * 100) {
                this.particles.push({
                    x: hypothalamus.x, y: -hypothalamus.y, z: hypothalamus.z,
                    vx: (Math.random() - 0.5) * 2, vy: -1 - Math.random() * 2, vz: (Math.random() - 0.5) * 2,
                    life: 1.0, type: Math.random() > 0.3 ? 'cortisol' : 'tryptophan'
                });
            }

            ctx.save();
            this.particles.forEach((p, idx) => {
                p.x += p.vx; p.y += p.vy; p.z += p.vz;
                p.life -= 0.005;

                const proj = Math3D.project3DTo2D(p.x, p.y, p.z, camera, projection);
                if (proj.scale > 0 && p.life > 0) {
                    const color = p.type === 'cortisol' ? `rgba(255, 255, 150, ${p.life * 0.6})` : `rgba(150, 255, 200, ${p.life * 0.4})`;
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(proj.x, proj.y, 1.5 * proj.scale, 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.life <= 0) {
                    this.particles.splice(idx, 1);
                }
            });
            ctx.restore();
        },

        drawMentalHealthFactors(ctx, state, camera, projection, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            const factors = state.factors;
            const activeFactors = Object.keys(factors).filter(k => factors[k] === 1 && k !== 'viewMode');

            ctx.save();
            activeFactors.forEach((fid, idx) => {
                const angle = (idx / activeFactors.length) * Math.PI * 2 + this.orbitalRotation;
                const radius = 350;

                const fx = Math.cos(angle) * radius;
                const fz = Math.sin(angle) * radius;
                const fy = Math.sin(angle * 0.5) * 100;

                const p = Math3D.project3DTo2D(fx, -fy, fz, camera, projection);
                if (p.scale > 0) {
                    const alpha = Math3D.applyDepthFog(0.8, p.depth, 0.2, 0.9);

                    let target = { x: 0, y: 0, z: 0 };
                    if (fid.includes('sleep') || fid.includes('work')) target = ui3d.brainShell.regions.pfc.centroid || target;
                    else if (fid.includes('noise') || fid.includes('serotonin')) target = ui3d.brainShell.regions.amygdala.centroid || target;

                    const tp = Math3D.project3DTo2D(target.x, -target.y, target.z, camera, projection);
                    const pulse = (Date.now() % 1000) / 1000;
                    const px = p.x + (tp.x - p.x) * pulse;
                    const py = p.y + (tp.y - p.y) * pulse;

                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(100, 200, 255, ${alpha * 0.3})`;
                    ctx.setLineDash([2, 4]);
                    ctx.moveTo(p.x, p.y); ctx.lineTo(tp.x, tp.y);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * (1 - pulse)})`;
                    ctx.beginPath(); ctx.arc(px, py, 4 * p.scale, 0, Math.PI * 2); ctx.fill();

                    ctx.fillStyle = fid.includes('Mod') ? '#00ffaa' : (fid.includes('comt') ? '#ffaa00' : '#4ca1af');
                    ctx.shadowBlur = 10; ctx.shadowColor = ctx.fillStyle;
                    ctx.beginPath(); ctx.arc(p.x, p.y, 5 * p.scale, 0, Math.PI * 2); ctx.fill();
                    ctx.shadowBlur = 0;

                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 10px Quicksand, sans-serif';
                    ctx.fillText(fid.toUpperCase().replace(/([A-Z])/g, ' $1'), p.x + 10, p.y);
                }
            });
            ctx.restore();
        },

        drawEliteBrain(ctx, shell, camera, projection, stressIntensity, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            const hovered = ui3d.app.ui.hoveredElement;
            const lightDir = { x: 0.7, y: -0.6, z: 1.0 };
            const len = Math.sqrt(lightDir.x ** 2 + lightDir.y ** 2 + lightDir.z ** 2);
            lightDir.x /= len; lightDir.y /= len; lightDir.z /= len;

            const projected = shell.vertices.map(v => Math3D.project3DTo2D(v.x, -v.y, v.z, camera, projection));
            const faces = [];
            shell.faces.forEach((face) => {
                const p1 = projected[face.indices[0]], p2 = projected[face.indices[1]], p3 = projected[face.indices[2]];
                if (p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
                    const cp = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
                    if (cp > 0) {
                        const depth = (p1.depth + p2.depth + p3.depth) / 3;
                        faces.push({ face, p1, p2, p3, depth });
                    }
                }
            });

            faces.sort((a, b) => b.depth - a.depth);

            faces.forEach(f => {
                const v1 = shell.vertices[f.face.indices[0]];
                const regionKey = v1.region;
                const isHovered = hovered && hovered.id === regionKey;

                const dot = v1.normal.x * lightDir.x + v1.normal.y * lightDir.y + v1.normal.z * lightDir.z;
                const fresnel = Math.pow(1 - Math.abs(v1.normal.z), 3);
                const fog = Math3D.applyDepthFog(1.0, f.depth, 0.1, 0.9);

                let baseAlpha = 0.06;
                let color = `rgba(100, 180, 255, ${baseAlpha})`;

                if (isHovered) {
                    color = `rgba(255, 255, 255, ${0.15 + Math.sin(Date.now() * 0.01) * 0.05})`;
                } else if (regionKey === 'amygdala' && stressIntensity > 0.5) {
                    color = `rgba(255, 80, 0, ${0.1 + stressIntensity * 0.1})`;
                }

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(f.p1.x, f.p1.y); ctx.lineTo(f.p2.x, f.p2.y); ctx.lineTo(f.p3.x, f.p3.y);
                ctx.fill();

                if (f.depth < 0.45) {
                    const sulciNoise = Math.sin(v1.x * 0.05) * Math.cos(v1.y * 0.05);
                    const isSulci = sulciNoise > 0.7;
                    ctx.strokeStyle = isSulci ? `rgba(255, 255, 255, ${0.15 * fog})` : `rgba(150, 230, 255, ${(0.04 + fresnel * 0.2) * fog})`;
                    ctx.lineWidth = isSulci ? 0.8 : 0.4;
                    ctx.stroke();
                }
            });
        },

        drawHUDLabels(ctx, ui3d, camera, projection, state) {
            const Math3D = window.GreenhouseModels3DMath;
            const camForward = {
                x: Math.sin(camera.rotationY) * Math.cos(camera.rotationX),
                y: Math.sin(camera.rotationX),
                z: Math.cos(camera.rotationY) * Math.cos(camera.rotationX)
            };

            ctx.save();
            ctx.textAlign = 'center';
            for (const key in ui3d.brainShell.regions) {
                const region = ui3d.brainShell.regions[key];
                if (region.centroid && key !== 'cortex') {
                    const p = Math3D.project3DTo2D(region.centroid.x, -region.centroid.y, region.centroid.z, camera, projection);
                    const dot = (region.centroid.x * camForward.x + (-region.centroid.y) * camForward.y + region.centroid.z * camForward.z);

                    if (p.scale > 0 && dot > 0.3) {
                        const alpha = Math3D.applyDepthFog(0.7, p.depth, 0.4, 0.9);
                        const intensity = (key === 'amygdala') ? state.factors.stressorIntensity : (1 - state.factors.stressorIntensity);

                        // Technical HUD Line
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(100, 200, 255, ${alpha * 0.3})`;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p.x + (p.x < projection.width / 2 ? -40 : 40), p.y - 40);
                        const endX = p.x + (p.x < projection.width / 2 ? -100 : 100);
                        ctx.lineTo(endX, p.y - 40);
                        ctx.stroke();

                        // DYNAMIC PROBE WAVEFORM
                        this.drawProbeWave(ctx, endX - (p.x < projection.width / 2 ? -10 : 90), p.y - 40, 80, intensity, alpha, key);

                        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                        ctx.font = 'bold 9px monospace';
                        ctx.fillText(t(region.name).toUpperCase(), endX, p.y - 45);
                    }
                }
            }
            ctx.restore();
        },

        drawProbeWave(ctx, x, y, width, intensity, alpha, key) {
            if (!this.waveOffsets[key]) this.waveOffsets[key] = Math.random() * 100;
            this.waveOffsets[key] += 0.1 + intensity * 0.2;

            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 255, 200, ${alpha * 0.6})`;
            ctx.lineWidth = 1;
            for (let i = 0; i < width; i++) {
                const val = Math.sin(i * 0.1 + this.waveOffsets[key]) * (5 + intensity * 15);
                ctx.lineTo(x + i, y + val);
            }
            ctx.stroke();
        },

        drawContextualZoom(ctx, ui3d, state) {
            const hovered = ui3d.app.ui.hoveredElement;
            if (!hovered || hovered.type !== 'checkbox') return;

            const w = 220, h = 140;
            const x = ui3d.app.canvas.width - w - 40;
            const y = 40;

            ctx.save();
            // Glass Panel
            ctx.fillStyle = 'rgba(10, 20, 30, 0.85)';
            ctx.strokeStyle = 'rgba(76, 161, 175, 0.5)';
            if (ui3d.app.roundRect) ui3d.app.roundRect(ctx, x, y, w, h, 12, true, true);

            ctx.fillStyle = '#4ca1af';
            ctx.font = 'bold 10px monospace';
            ctx.fillText("MICRO-MECHANISM ANALYSIS", x + 15, y + 25);

            // Micro Animation (Generic Enzyme logic as placeholder for wow effect)
            const cx = x + w / 2, cy = y + h / 2 + 10;
            const time = Date.now() * 0.002;

            // Substrate
            ctx.fillStyle = '#ffaa00';
            const sx = cx + Math.cos(time) * 30;
            const sy = cy + Math.sin(time) * 10;
            ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill();

            // Enzyme
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, 20, 0.2 * Math.PI, 1.8 * Math.PI);
            ctx.stroke();

            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(hovered.id.toUpperCase(), cx, y + h - 15);
            ctx.restore();
        }
    };

    window.GreenhouseStressMacro = GreenhouseStressMacro;
})();
