/**
 * @file stress_macro.js
 * @description Macro-level (Brain) rendering logic for the Stress Dynamics Simulation.
 * Implements high-fidelity holographic schematics, orbital stressors, and genetic scaffolding.
 * Phase 3: Added Aura Metrics (Static), Dynamic Probes (Waveforms), and Contextual Zoom.
 */

(function () {
    'use strict';

    const t = (k) => (window.GreenhouseModelsUtil && window.GreenhouseModelsUtil.t) ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseStressMacro = {
        orbitalRotation: 0,
        particles: [],
        helixRotation: 0,
        waveOffsets: {},
        neuralSparks: [], // [{x, y, z, region, life}]

        render(ctx, state, camera, projection, ui3d) {
            if (!ui3d.brainShell) return;

            const Math3D = window.GreenhouseModels3DMath;
            const intensity = state.factors.stressorIntensity || 0;
            const load = state.metrics.allostaticLoad || 0;

            this.orbitalRotation += 0.001;
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

            // 4a. VASCULAR OVERLAY (Subtle fine-lines)
            this.drawVascularPulse(ctx, state, camera, projection, ui3d);

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

                                // REPAIR PULSE: Dynamic Wow Effect
                                if (hasVariant && Math.sin(this.helixRotation + i * 0.5) > 0.8) {
                                    ctx.fillStyle = '#fff';
                                    ctx.shadowBlur = 15; ctx.shadowColor = '#00ffcc';
                                    ctx.beginPath();
                                    ctx.arc(p.x, p.y, 1.5 * p.scale, 0, Math.PI * 2);
                                    ctx.fill();
                                    ctx.shadowBlur = 0;
                                }
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
            const renderedLabels = [];

            ctx.save();
            activeFactors.forEach((fid, idx) => {
                const angle = (idx / activeFactors.length) * Math.PI * 2 + this.orbitalRotation;
                const radius = 250;

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

                    const isHovered = ui3d.app.ui.hoveredElement && ui3d.app.ui.hoveredElement.id === fid;
                    ctx.fillStyle = fid.includes('Mod') ? '#00ffaa' : (fid.includes('comt') ? '#ffaa00' : '#4ca1af');
                    ctx.shadowBlur = isHovered ? 20 : 10;
                    ctx.shadowColor = ctx.fillStyle;
                    ctx.beginPath(); ctx.arc(p.x, p.y, (isHovered ? 8 : 5) * p.scale, 0, Math.PI * 2); ctx.fill();
                    ctx.shadowBlur = 0;

                    const t = (k) => (window.GreenhouseModelsUtil && window.GreenhouseModelsUtil.t) ? window.GreenhouseModelsUtil.t(k) : k;
                    const config = window.GreenhouseStressConfig;
                    const factorMeta = config ? config.factors.find(f => f.id === fid) : null;
                    const label = factorMeta ? t(factorMeta.label) : fid.toUpperCase().replace(/([A-Z])/g, ' $1');

                    // Label Overlap Prevention (Item 74/Vision Enhancement)
                    const labelText = label.toUpperCase();
                    const textWidth = ctx.measureText(labelText).width;

                    // UI Occupancy Check (Item 74/Vision Enhancement)
                    const sw = projection.width;
                    const sh = projection.height;
                    const col2X = Math.max(400, sw - 630);
                    const isInUI = (p.x < 425 && p.y > 100) || (p.x > col2X - 20 && p.y > 150) || (p.y < 130) || (p.y > sh - 100);

                    const canRenderLabel = !isInUI && !renderedLabels.some(other => {
                        const dx = Math.abs(p.x - other.x);
                        const dy = Math.abs(p.y - other.y);
                        return dx < (textWidth / 2 + other.w / 2 + 15) && dy < 18;
                    });

                    if (canRenderLabel || isHovered) {
                        ctx.fillStyle = isHovered ? '#fff' : `rgba(255, 255, 255, ${alpha})`;
                        ctx.font = `${isHovered ? 'bold 11px' : 'bold 9px'} Quicksand, sans-serif`;
                        ctx.textAlign = 'left';
                        ctx.fillText(labelText, p.x + 12, p.y + 4);
                        renderedLabels.push({ x: p.x + 12 + textWidth / 2, y: p.y, w: textWidth });
                    }
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
                } else if (regionKey === 'vagus_nerve') {
                    const vagalTone = ui3d.app.engine.state.metrics.vagalTone || 0.5;
                    color = `rgba(0, 255, 150, ${0.2 + vagalTone * 0.3})`;
                    if (Math.random() < vagalTone * 0.1) color = 'rgba(255, 255, 255, 0.8)'; // Nerve firing spark
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

            // HOLOGRAPHIC SCANLINES
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.03)';
            ctx.lineWidth = 1;
            const scanPos = (Date.now() * 0.05) % projection.height;
            ctx.beginPath();
            ctx.moveTo(0, scanPos); ctx.lineTo(projection.width, scanPos);
            ctx.stroke();

            // Vertical scan (aberration)
            if (stressIntensity > 0.7 && Math.random() > 0.9) {
                ctx.fillStyle = 'rgba(255, 50, 0, 0.1)';
                ctx.fillRect(0, scanPos, projection.width, 2);
            }
            ctx.restore();

            // POINT CLOUD GLOW: Neural Sparks
            this.drawNeuralSparks(ctx, shell, camera, projection, stressIntensity);
        },

        drawNeuralSparks(ctx, shell, camera, projection, intensity) {
            const Math3D = window.GreenhouseModels3DMath;

            // Seed new sparks in active regions
            for (const key in shell.regions) {
                const region = shell.regions[key];
                const activity = (key === 'amygdala') ? intensity : (1 - intensity);
                if (Math.random() < activity * 0.3 && region.vertices.length > 0) {
                    const vIdx = region.vertices[Math.floor(Math.random() * region.vertices.length)];
                    const v = shell.vertices[vIdx];
                    this.neuralSparks.push({
                        x: v.x, y: -v.y, z: v.z,
                        color: region.color || '#fff',
                        life: 1.0,
                        size: 1 + Math.random() * 2
                    });
                }
            }

            ctx.save();
            this.neuralSparks.forEach((s, idx) => {
                s.life -= 0.02;
                if (s.life <= 0) {
                    this.neuralSparks.splice(idx, 1);
                    return;
                }
                const p = Math3D.project3DTo2D(s.x, s.y, s.z, camera, projection);
                if (p.scale > 0) {
                    const alpha = Math3D.applyDepthFog(s.life * 0.8, p.depth, 0.1, 0.9);
                    ctx.fillStyle = s.color;
                    ctx.globalAlpha = alpha;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, s.size * p.scale, 0, Math.PI * 2);
                    ctx.fill();
                    // Optional bloom
                    if (s.life > 0.8) {
                        ctx.shadowBlur = 10; ctx.shadowColor = s.color;
                        ctx.fillRect(p.x, p.y, 1, 1);
                        ctx.shadowBlur = 0;
                    }
                }
            });
            ctx.restore();
        },

        drawVascularPulse(ctx, state, camera, projection, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            const autonomic = state.metrics.autonomicBalance || 0;
            const intensity = state.factors.stressorIntensity || 0;

            ctx.save();
            ctx.strokeStyle = `rgba(255, 50, 50, ${0.05 + autonomic * 0.1})`;
            ctx.lineWidth = 0.5;

            // Simulate major arteries (Circle of Willis simplified)
            const brainstem = ui3d.brainShell.regions.brainstem.centroid || { x: 0, y: 0, z: 0 };
            const arteries = [
                { start: { x: 0, y: -20, z: 0 }, end: { x: brainstem.x, y: -brainstem.y, z: brainstem.z } }, // Carotid Path to Stem
                { start: { x: -60, y: -20, z: 40 }, end: { x: 60, y: -20, z: 40 } }, // Connective
                { start: { x: 0, y: -20, z: 50 }, end: { x: 0, y: 150, z: 120 } } // Anterior Path
            ];

            arteries.forEach(a => {
                const p1 = Math3D.project3DTo2D(a.start.x, a.start.y, a.start.z, camera, projection);
                const p2 = Math3D.project3DTo2D(a.end.x, a.end.y, a.end.z, camera, projection);
                if (p1.scale > 0 && p2.scale > 0) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();

                    // Blood flow pulse
                    const pulse = (Date.now() * 0.002) % 1;
                    const px = p1.x + (p2.x - p1.x) * pulse;
                    const py = p1.y + (p2.y - p1.y) * pulse;
                    ctx.fillStyle = `rgba(255, 100, 100, ${0.3 * (1 - pulse)})`;
                    ctx.beginPath(); ctx.arc(px, py, 2 * p1.scale, 0, Math.PI * 2); ctx.fill();
                }
            });
            ctx.restore();
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
                if (region.centroid && key !== 'cortex' && key !== 'brainstem') {
                    const p = Math3D.project3DTo2D(region.centroid.x, -region.centroid.y, region.centroid.z, camera, projection);
                    const dot = (region.centroid.x * camForward.x + (-region.centroid.y) * camForward.y + region.centroid.z * camForward.z);

                    if (p.scale > 0 && dot > 0.3) {
                        const alpha = Math3D.applyDepthFog(0.7, p.depth, 0.4, 0.9);
                        const isVagus = key === 'vagus_nerve';
                        let intensity = (key === 'amygdala') ? state.factors.stressorIntensity : (1 - state.factors.stressorIntensity);
                        if (isVagus) intensity = state.metrics.vagalTone || 0.5;

                        // Technical HUD Line
                        ctx.beginPath();
                        ctx.strokeStyle = isVagus ? `rgba(0, 255, 150, ${alpha * 0.5})` : `rgba(100, 200, 255, ${alpha * 0.3})`;
                        ctx.moveTo(p.x, p.y);
                        const offsetSide = p.x < projection.width / 2 ? -40 : 40;
                        ctx.lineTo(p.x + offsetSide, p.y - 40);
                        const endX = p.x + (p.x < projection.width / 2 ? -100 : 100);
                        ctx.lineTo(endX, p.y - 40);
                        ctx.stroke();

                        // DYNAMIC PROBE WAVEFORM
                        this.drawProbeWave(ctx, endX - (p.x < projection.width / 2 ? -10 : 90), p.y - 40, 80, intensity, alpha, key);

                        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                        ctx.font = 'bold 9px monospace';
                        ctx.fillText(t(region.name).toUpperCase(), endX, p.y - 45);

                        if (isVagus) {
                            ctx.fillStyle = '#00ff99';
                            ctx.fillText("VAGAL TONE ACTIVE", endX, p.y - 30);
                        }
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

            const w = 280, h = 160;
            const x = ui3d.app.canvas.width - w - 40;
            const y = 40;

            ctx.save();
            // Premium Glass Panel
            const boxGrad = ctx.createLinearGradient(x, y, x + w, y + h);
            boxGrad.addColorStop(0, 'rgba(10, 30, 50, 0.9)');
            boxGrad.addColorStop(1, 'rgba(5, 10, 20, 0.95)');
            ctx.fillStyle = boxGrad;
            ctx.strokeStyle = 'rgba(76, 161, 175, 0.6)';
            ctx.lineWidth = 1;
            if (ui3d.app.roundRect) ui3d.app.roundRect(ctx, x, y, w, h, 15, true, true);

            // Header
            ctx.fillStyle = '#4ca1af';
            ctx.font = 'bold 9px monospace';
            ctx.fillText("MICRO-MECHANISM ANALYSIS: " + hovered.id.toUpperCase(), x + 20, y + 25);
            ctx.strokeStyle = 'rgba(76, 161, 175, 0.3)';
            ctx.beginPath(); ctx.moveTo(x + 20, y + 35); ctx.lineTo(x + w - 20, y + 35); ctx.stroke();

            // High-Fidelity Receptor Binding Animation
            const cx = x + w / 2, cy = y + h / 2 + 10;
            const time = Date.now() * 0.003;
            const intensity = state.factors.stressorIntensity || 0.5;

            // Draw "Receptor" (G-Protein Coupled style)
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(0, 255, 204, 0.3)';
            for (let i = 0; i < 7; i++) {
                const hx = cx - 70 + i * 20;
                const hHeight = 50 + Math.sin(time + i) * 8;
                ctx.beginPath();
                ctx.moveTo(hx, cy - hHeight / 2);
                ctx.lineTo(hx, cy + hHeight / 2);
                ctx.stroke();
            }

            // Animated Ligands
            const ligandCount = 4;
            for (let i = 0; i < ligandCount; i++) {
                const lOffset = (time + i * 1.5) % 8;
                const lx = cx + 100 - lOffset * 25;
                const ly = cy + Math.sin(time * 0.5 + i) * 15;

                if (lx > cx - 70 && lx < cx + 70) {
                    ctx.fillStyle = '#fff';
                    ctx.shadowBlur = 10; ctx.shadowColor = '#fff';
                    ctx.beginPath(); ctx.arc(lx, ly, 3, 0, Math.PI * 2); ctx.fill();
                    ctx.shadowBlur = 0;
                } else {
                    ctx.fillStyle = '#ffaa00';
                    ctx.beginPath(); ctx.arc(lx, ly, 2, 0, Math.PI * 2); ctx.fill();
                }
            }

            ctx.fillStyle = '#aaa';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText("AFFINITY RATIO: " + (0.8 + intensity * 0.1).toFixed(2), cx, y + h - 15);

            ctx.restore();
        }
    };

    window.GreenhouseStressMacro = GreenhouseStressMacro;
})();
