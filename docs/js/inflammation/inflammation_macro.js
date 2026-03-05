/**
 * @file inflammation_macro.js
 * @description Macro-level (Brain) rendering logic for the Neuroinflammation Simulation.
 * Implements holographic schematics, orbital triggers, and the Kynurenine pathway (Tryptophan/3HAA).
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseInflammationMacro = {
        orbitalRotation: 0,
        particles: [],

        render(ctx, state, camera, projection, ui3d) {
            if (!ui3d.brainShell) return;

            const Math3D = window.GreenhouseModels3DMath;
            const tone = state.metrics.inflammatoryTone || 0.02;
            this.orbitalRotation -= 0.005;

            // 1. GHOST BRAIN (Blueprint Aesthetic)
            const regions = ui3d.brainShell.regions;
            const deepKeys = ['thalamus', 'hypothalamus', 'hippocampus', 'amygdala', 'basal_ganglia', 'insula'];
            for (const key in regions) {
                const k = key.toLowerCase();
                const isDeep = deepKeys.includes(k);
                if (isDeep && !ui3d.app.ui.showDeepStructures) {
                    regions[key].color = 'rgba(0,0,0,0)';
                    continue;
                }
                const isHyper = tone > 0.4 && (k.includes('thalamus') || k.includes('insula'));
                if (isHyper) {
                    regions[key].color = `rgba(255, 120, 0, ${0.1 + tone * 0.15})`;
                } else {
                    regions[key].color = 'rgba(100, 180, 220, 0.05)';
                }
            }

            // 2. ELITE RENDERER (Holographic / Wireframe Detail)
            this.drawEliteBrain(ctx, ui3d.brainShell, camera, projection, tone, ui3d);

            // 2.5 LOBE BOUNDARIES & OVERLAYS
            this.drawLobeBoundaries(ctx, ui3d, camera, projection);
            this.drawInflammationOverlays(ctx, state, camera, projection, ui3d);

            // 3. COMPARTMENT FLOW NETWORK (Data-Driven Anatomical Routes)
            this.drawCompartmentFlowNetwork(ctx, state, camera, projection, ui3d);

            // 4. ORBITAL TRIGGERS (Infiltration Factors)
            this.drawInflammatoryFactors(ctx, state, camera, projection, ui3d);

            // 5. HUD LABELS
            this.drawHUDLabels(ctx, ui3d, camera, projection);
        },

        drawCompartmentFlowNetwork(ctx, state, camera, projection, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            const graph = ui3d.pathwayCache['tryptophan'];
            if (!graph || !graph.compartments || !graph.reactions) return;

            const tone = state.metrics.tnfAlpha || 0;
            const showLabels = state.factors.showMoleculeLabels === 1;
            const showMechs = state.factors.showMechanismLabels === 1;
            const showComps = state.factors.showCompartmentLabels === 1;

            // Emission logic
            if (this.particles.length < 150) {
                // TRP entry from Gut
                if (Math.random() < 0.05) {
                    const reaction = graph.reactions.find(r => r.id === 'gut_to_blood');
                    const mol = graph.molecules.find(m => m.id === reaction.substrate);
                    this.particles.push({
                        reactionId: reaction.id,
                        molId: mol.id,
                        progress: 0,
                        speed: 0.005 + Math.random() * 0.005,
                        color: mol.color,
                        radius: mol.defaultRadius,
                        label: mol.label
                    });
                }

                // Inflammatory signaling
                if (tone > 0.4 && Math.random() < tone * 0.03) {
                    const reaction = graph.reactions.find(r => r.id === 'tnf_to_brain');
                    const mol = graph.molecules.find(m => m.id === reaction.substrate);
                    this.particles.push({
                        reactionId: reaction.id,
                        molId: mol.id,
                        progress: 0,
                        speed: 0.008 + Math.random() * 0.004,
                        color: mol.color,
                        radius: mol.defaultRadius,
                        label: mol.label
                    });
                }
            }

            ctx.save();
            this.particles.forEach((p, idx) => {
                const reaction = graph.reactions.find(r => r.id === p.reactionId);
                const fromComp = graph.compartments.find(c => c.id === reaction.fromCompartment);
                const toComp = graph.compartments.find(c => c.id === reaction.toCompartment);

                p.progress += p.speed;

                // Interpolate 3D position
                const x = fromComp.renderBounds.x + (toComp.renderBounds.x - fromComp.renderBounds.x) * p.progress;
                const y = fromComp.renderBounds.y + (toComp.renderBounds.y - fromComp.renderBounds.y) * p.progress;
                const z = fromComp.renderBounds.z + (toComp.renderBounds.z - fromComp.renderBounds.z) * p.progress;

                const proj = Math3D.project3DTo2D(x, -y, z, camera, projection);
                if (proj.scale > 0 && p.progress <= 1.0) {
                    ctx.fillStyle = p.color;
                    ctx.shadowBlur = p.molId === 'QUIN' ? 8 : 0;
                    ctx.shadowColor = 'red';
                    ctx.beginPath();
                    ctx.arc(proj.x, proj.y, p.radius * proj.scale, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;

                    if (showLabels && p.progress > 0.4 && p.progress < 0.6) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                        ctx.font = '8px monospace';
                        ctx.fillText(p.label, proj.x + 8, proj.y);
                    }

                    if (p.molId === 'QUIN' && p.progress > 0.9) {
                        // Excitotoxic visualization
                        ctx.strokeStyle = `rgba(255, 50, 0, ${(1.0 - p.progress) * 10})`;
                        ctx.beginPath(); ctx.arc(proj.x, proj.y, 12 * proj.scale, 0, Math.PI * 2); ctx.stroke();
                    }
                }

                if (p.progress >= 1.0) {
                    // Decide next step in the chain
                    const nextReactions = graph.reactions.filter(r => r.fromCompartment === reaction.toCompartment && r.substrate === p.molId);

                    // Biological Logic: IDO induction by tone
                    const idoRoll = Math.random() < (0.2 + tone * 0.6);
                    let selected = null;

                    if (p.molId === 'TRP' && reaction.toCompartment === 'brain_isf') {
                        selected = graph.reactions.find(r => r.id === (idoRoll ? 'trp_to_kyn' : 'trp_to_5ht'));
                    } else if (nextReactions.length > 0) {
                        selected = nextReactions[Math.floor(Math.random() * nextReactions.length)];
                    }

                    if (selected) {
                        const nextMol = graph.molecules.find(m => m.id === selected.product);
                        p.reactionId = selected.id;
                        p.molId = nextMol.id;
                        p.progress = 0;
                        p.color = nextMol.color;
                        p.radius = nextMol.defaultRadius;
                        p.label = nextMol.label;
                    } else {
                        this.particles.splice(idx, 1);
                    }
                }
            });

            // Compartment Labels
            if (showComps) {
                graph.compartments.forEach(c => {
                    const p = Math3D.project3DTo2D(c.renderBounds.x, -c.renderBounds.y, c.renderBounds.z, camera, projection);
                    if (p.scale > 0) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                        ctx.font = 'bold 9px Quicksand';
                        ctx.textAlign = 'center';
                        ctx.fillText(c.label.toUpperCase(), p.x, p.y + 25 * p.scale);
                    }
                });
            }

            // Mechanism Labels
            if (showMechs) {
                graph.labels.forEach(lbl => {
                    if (lbl.targetType === 'reaction') {
                        const r = graph.reactions.find(react => react.id === lbl.targetId);
                        const f = graph.compartments.find(c => c.id === r.fromCompartment);
                        const t = graph.compartments.find(c => c.id === r.toCompartment);
                        const mx = (f.renderBounds.x + t.renderBounds.x) / 2;
                        const my = (f.renderBounds.y + t.renderBounds.y) / 2;
                        const mz = (f.renderBounds.z + t.renderBounds.z) / 2;
                        const p = Math3D.project3DTo2D(mx, -my, mz, camera, projection);
                        if (p.scale > 0) {
                            ctx.fillStyle = '#4ca1af';
                            ctx.font = 'italic 8px monospace';
                            ctx.fillText(lbl.text, p.x + 10, p.y);
                        }
                    }
                });
            }
            ctx.restore();
        },

        drawInflammatoryFactors(ctx, state, camera, projection, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            const factors = state.factors;
            const activeFactors = Object.keys(factors).filter(k => factors[k] === 1 && k !== 'viewMode');

            ctx.save();
            activeFactors.forEach((fid, idx) => {
                const angle = (idx / activeFactors.length) * Math.PI * 2 + this.orbitalRotation;
                const radius = 380;

                const fx = Math.cos(angle) * radius;
                const fz = Math.sin(angle) * radius;
                const fy = Math.sin(angle * 1.5) * 150;

                const p = Math3D.project3DTo2D(fx, -fy, fz, camera, projection);
                if (p.scale > 0) {
                    const alpha = Math3D.applyDepthFog(0.8, p.depth, 0.2, 0.9);

                    const target = ui3d.brainShell.regions.hypothalamus.centroid || { x: 0, y: 0, z: 0 };
                    const tp = Math3D.project3DTo2D(target.x, -target.y, target.z, camera, projection);

                    // Infiltration Line
                    ctx.beginPath();
                    const grad = ctx.createLinearGradient(p.x, p.y, tp.x, tp.y);
                    grad.addColorStop(0, fid.includes('patho') || fid.includes('stress') ? `rgba(255, 50, 0, ${alpha})` : `rgba(180, 240, 255, ${alpha})`);
                    grad.addColorStop(1, `rgba(255, 50, 0, 0)`);
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = 1.2;
                    ctx.setLineDash([10, 5]);
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(tp.x, tp.y);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Node
                    const isTrigger = fid.includes('patho') || fid.includes('stress') || fid.includes('Sleep') || fid.includes('Gut');
                    ctx.fillStyle = isTrigger ? '#ff4d4d' : '#00ffcc';
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = ctx.fillStyle;
                    ctx.beginPath();
                    ctx.rect(p.x - 5, p.y - 5, 10 * p.scale, 10 * p.scale);
                    ctx.fill();
                    ctx.shadowBlur = 0;

                    // Label
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 9px monospace';
                    ctx.fillText(fid.toUpperCase().replace(/([A-Z])/g, ' $1'), p.x + 15, p.y + 5);
                }
            });
            ctx.restore();
        },

        drawEliteBrain(ctx, shell, camera, projection, tone, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            const hovered = ui3d.app.ui.hoveredElement;
            const lightDir = { x: -0.5, y: -0.7, z: 1.0 };
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

            const deepKeys = ['thalamus', 'hypothalamus', 'hippocampus', 'amygdala', 'basal_ganglia', 'insula'];
            faces.forEach(f => {
                const v1 = shell.vertices[f.face.indices[0]];
                const regionKey = v1.region;
                const hemi = v1.hemisphere;

                if (hemi === 'left' && !ui3d.app.ui.showLeftHemisphere) return;
                if (hemi === 'right' && !ui3d.app.ui.showRightHemisphere) return;
                if (deepKeys.includes(regionKey) && !ui3d.app.ui.showDeepStructures) return;

                const isHovered = hovered && (hovered.id === regionKey || (hovered.type === '3d' && hovered.label === ui3d.brainShell.regions[regionKey].name));

                const dot = v1.normal.x * lightDir.x + v1.normal.y * lightDir.y + v1.normal.z * lightDir.z;
                const fresnel = Math.pow(1 - Math.abs(v1.normal.z), 4);
                const fog = Math3D.applyDepthFog(1.0, f.depth, 0.1, 0.95);

                let color = `rgba(80, 160, 255, ${0.06 + fresnel * 0.1})`;
                if (isHovered) {
                    color = `rgba(255, 255, 255, ${0.15 + Math.sin(Date.now() * 0.01) * 0.05})`;
                } else if (tone > 0.4 && (regionKey.includes('thalamus') || regionKey.includes('insula'))) {
                    color = `rgba(255, 80, 0, ${0.08 + tone * 0.12})`;
                }

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(f.p1.x, f.p1.y); ctx.lineTo(f.p2.x, f.p2.y); ctx.lineTo(f.p3.x, f.p3.y);
                ctx.fill();

                if (f.depth < 0.4) {
                    // Fine line sulci detail
                    const sulci = Math.cos(v1.x * 0.04) * Math.sin(v1.z * 0.04) > 0.7;
                    ctx.strokeStyle = sulci ? `rgba(255, 255, 255, ${0.12 * fog})` : `rgba(180, 230, 255, ${0.03 * fog})`;
                    ctx.lineWidth = sulci ? 0.8 : 0.4;
                    ctx.stroke();
                }

                // BBB Breakdown Flicker
                if (tone > 0.7 && Math.random() > 0.99) {
                    ctx.fillStyle = 'rgba(255,0,0,0.5)'; ctx.fill();
                }
            });
        },

        drawHUDLabels(ctx, ui3d, camera, projection) {
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

                    if (p.scale > 0 && dot > 0.4) {
                        const alpha = Math3D.applyDepthFog(0.7, p.depth, 0.4, 0.9);
                        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                        ctx.font = 'bold 9px monospace';

                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(100, 200, 255, ${alpha * 0.2})`;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p.x + (p.x < projection.width / 2 ? -40 : 40), p.y - 40);
                        ctx.lineTo(p.x + (p.x < projection.width / 2 ? -80 : 80), p.y - 40);
                        ctx.stroke();

                        ctx.fillText(t(region.name).toUpperCase(), p.x + (p.x < projection.width / 2 ? -80 : 80), p.y - 45);
                    }
                }
            }
            ctx.restore();
        },

        drawLobeBoundaries(ctx, ui3d, camera, projection) {
            const Math3D = window.GreenhouseModels3DMath;
            const config = window.GreenhouseInflammationConfig;
            if (!config || !config.lobes) return;

            ctx.save();
            config.lobes.forEach(lobe => {
                // Find centroid of vertices belonging to this lobe
                let lx=0, ly=0, lz=0, count=0;
                ui3d.brainShell.vertices.forEach(v => {
                    if (v.lobe === lobe.id) {
                        lx += v.x; ly += v.y; lz += v.z; count++;
                    }
                });
                if (count > 0) {
                    const cp = Math3D.project3DTo2D(lx/count, -(ly/count), lz/count, camera, projection);
                    if (cp.scale > 0) {
                        ctx.strokeStyle = lobe.color.replace('0.2', '0.5');
                        ctx.setLineDash([5, 5]);
                        ctx.beginPath();
                        ctx.arc(cp.x, cp.y, 60 * cp.scale, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.setLineDash([]);

                        ctx.fillStyle = 'rgba(255,255,255,0.3)';
                        ctx.font = '8px Quicksand';
                        // Adjust Y to avoid overlap
                        ctx.fillText(lobe.label.toUpperCase(), cp.x - 20, cp.y - 60 * cp.scale);
                    }
                }
            });
            ctx.restore();
        },

        drawInflammationOverlays(ctx, state, camera, projection, ui3d) {
            const Math3D = window.GreenhouseModels3DMath;
            const tone = state.metrics.tnfAlpha || 0;

            if (tone > 0.5) {
                // BBB Leakage (Enhancement #28)
                ctx.save();
                ctx.strokeStyle = `rgba(255, 0, 0, ${tone * 0.3})`;
                ctx.lineWidth = 2;
                const regions = ['thalamus', 'insula', 'hippocampus'];
                regions.forEach(r => {
                    const reg = ui3d.brainShell.regions[r];
                    if (reg && reg.centroid) {
                        const p = Math3D.project3DTo2D(reg.centroid.x, -reg.centroid.y, reg.centroid.z, camera, projection);
                        if (p.scale > 0) {
                            ctx.beginPath();
                            ctx.arc(p.x, p.y, 30 * p.scale, 0, Math.PI * 2);
                            ctx.stroke();
                            ctx.fillStyle = `rgba(255, 0, 0, ${tone * 0.1})`;
                            ctx.fill();
                        }
                    }
                });
                ctx.restore();
            }
        }
    };

    window.GreenhouseInflammationMacro = GreenhouseInflammationMacro;
})();
