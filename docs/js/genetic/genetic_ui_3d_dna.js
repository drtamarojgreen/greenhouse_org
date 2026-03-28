(function () {
    'use strict';

    const GreenhouseGeneticDNA = {
        drawMacroView(ctx, w, h, camera, projection, neurons3D, activeGeneIndex, brainShell, drawNeuronCallback, drawBrainShellCallback, drawPiPFrameCallback, cameraState) {
            if (drawPiPFrameCallback) {
                drawPiPFrameCallback(ctx, 0, 0, w, h, "Gene View: DNA Helix");
            }

            // Use camera state if provided (for PiP)
            let viewCamera = camera;
            if (cameraState && cameraState.camera) {
                viewCamera = cameraState.camera;
            } else if (cameraState) {
                // Fallback construction
                viewCamera = {
                    x: cameraState.panX || 0,
                    y: cameraState.panY || 0,
                    z: -300 / (cameraState.zoom || 1.0),
                    rotationX: cameraState.rotationX || 0,
                    rotationY: cameraState.rotationY || 0,
                    rotationZ: 0,
                    fov: 500
                };
            }

            // Draw Helix Connections (Backbone)
            this.drawConnections(ctx, neurons3D, viewCamera, projection);

            // Project and Sort Genes (Filter out Brain Neurons for Main View)
            const projectedGenes = [];
            neurons3D.forEach((n, i) => {
                // Only project genes (Genotype)
                if (n.type !== 'gene') return;

                const p = GreenhouseModels3DMath.project3DTo2D(n.x, n.y, n.z, viewCamera, projection);
                if (p.scale > 0) {
                    const isFocused = (i === activeGeneIndex);
                    projectedGenes.push({ ...n, ...p, isFocused });
                }
            });

            projectedGenes.sort((a, b) => b.depth - a.depth);

            // Draw Genes
            projectedGenes.forEach(p => {
                if (drawNeuronCallback) {
                    drawNeuronCallback(ctx, p);
                } else {
                    // Fallback simple draw
                    ctx.fillStyle = p.baseColor;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 5 * p.scale, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Highlight focused gene
                if (p.isFocused) {
                    ctx.strokeStyle = '#00ffcc';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 15 * p.scale, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });

            // Draw Brain Shell (Wireframe) - Restored
            // Only draw if NOT in PiP mode (or if desired)
            // If in PiP, maybe hide brain shell to focus on DNA?
            // The user wants "crayolas" (DNA) in PiP. Brain is main view.
            // So we probably don't want to draw the brain shell inside the DNA PiP.
            if (!drawPiPFrameCallback && brainShell && drawBrainShellCallback) {
                drawBrainShellCallback(ctx, 200); // 200 offset for brain side
            }

            return projectedGenes;
        },

        drawConnections(ctx, neurons3D, camera, projection) {
            // Draw Helix Backbone and Rungs with enhanced realism
            const helixNodes = neurons3D.filter(n => n.type === 'gene');
            if (helixNodes.length < 2) return;

            const config = window.GreenhouseGeneticConfig;
            const lighting = window.GreenhouseGeneticLighting;

            // 1. Draw Rungs (Base Pairs) with 3D tube effect
            for (let i = 0; i < helixNodes.length; i += 2) {
                if (i + 1 >= helixNodes.length) break;

                const n1 = helixNodes[i];
                const n2 = helixNodes[i + 1];

                const p1 = GreenhouseModels3DMath.project3DTo2D(n1.x, n1.y, n1.z, camera, projection);
                const p2 = GreenhouseModels3DMath.project3DTo2D(n2.x, n2.y, n2.z, camera, projection);

                if (p1.scale > 0 && p2.scale > 0) {
                    const avgScale = (p1.scale + p2.scale) / 2;
                    const thickness = 14 * avgScale; // Significantly thicker for visibility
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;

                    // Get base pair colors from config
                    const baseColors = config.get('materials.dna.baseColors');
                    const type = (i / 2) % 4;
                    let color1, color2;

                    switch (type) {
                        case 0: color1 = baseColors.A; color2 = baseColors.T; break;
                        case 1: color1 = baseColors.T; color2 = baseColors.A; break;
                        case 2: color1 = baseColors.C; color2 = baseColors.G; break;
                        case 3: color1 = baseColors.G; color2 = baseColors.C; break;
                    }

                    // Enhanced rectangular rung drawing with geometric base coding
                    const drawRung = (x1, y1, x2, y2, color, depth, typeChar) => {
                        const dx = x2 - x1;
                        const dy = y2 - y1;
                        const len = Math.sqrt(dx * dx + dy * dy);
                        const nx = -dy / len;
                        const ny = dx / len;

                        ctx.save();
                        ctx.translate(x1, y1);
                        const angle = Math.atan2(dy, dx);
                        ctx.rotate(angle);

                        // Rectangular rung geometry
                        const h = thickness;
                        const w = len;

                        const grad = ctx.createLinearGradient(0, -h/2, 0, h/2);
                        grad.addColorStop(0, 'rgba(255,255,255,0.2)');
                        grad.addColorStop(0.5, color);
                        grad.addColorStop(1, 'rgba(0,0,0,0.3)');

                        ctx.fillStyle = grad;
                        ctx.fillRect(0, -h/2, w, h);

                        // Top face highlight
                        ctx.fillStyle = 'rgba(255,255,255,0.1)';
                        ctx.fillRect(0, -h/2, w, h/4);
                        ctx.restore();

                        // Geometric coding at the connection point
                        ctx.save();
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        const r = 8 * avgScale;
                        switch (typeChar) {
                            case 'A': ctx.rect(x1 - r, y1 - r, r * 2, r * 2); break;
                            case 'T':
                                ctx.moveTo(x1, y1 - r); ctx.lineTo(x1 + r, y1 + r); ctx.lineTo(x1 - r, y1 + r);
                                break;
                            case 'C':
                                ctx.moveTo(x1, y1 - r); ctx.lineTo(x1 + r, y1); ctx.lineTo(x1, y1 + r); ctx.lineTo(x1 - r, y1);
                                break;
                            case 'G':
                                for (let j = 0; j < 6; j++) {
                                    const angle = j * Math.PI / 3;
                                    ctx.lineTo(x1 + Math.cos(angle) * r, y1 + Math.sin(angle) * r);
                                }
                                break;
                        }
                        ctx.closePath();
                        ctx.fill();
                        ctx.restore();
                    };

                    // Draw two halves with depth
                    const avgDepth = (p1.depth + p2.depth) / 2;
                    let t1, t2;
                    switch (type) {
                        case 0: t1 = 'A'; t2 = 'T'; break;
                        case 1: t1 = 'T'; t2 = 'A'; break;
                        case 2: t1 = 'C'; t2 = 'G'; break;
                        case 3: t1 = 'G'; t2 = 'C'; break;
                    }
                    drawRung(p1.x, p1.y, midX, midY, color1, avgDepth, t1);
                    drawRung(p2.x, p2.y, midX, midY, color2, avgDepth, t2); // Note: flipped second half for correct base orientation
                }
            }

            // 2. Draw Backbone with enhanced 3D tube effect
            for (let s = 0; s < 2; s++) {
                const strandNodes = helixNodes.filter(n => n.strand === s);
                if (strandNodes.length < 2) continue;

                const strandColor = s === 0 ?
                    config.get('materials.dna.strand1Color') :
                    config.get('materials.dna.strand2Color');

                // Draw backbone segments with 3D effect
                for (let i = 0; i < strandNodes.length - 1; i++) {
                    const n1 = strandNodes[i];
                    const n2 = strandNodes[i + 1];

                    const p1 = GreenhouseModels3DMath.project3DTo2D(n1.x, n1.y, n1.z, camera, projection);
                    const p2 = GreenhouseModels3DMath.project3DTo2D(n2.x, n2.y, n2.z, camera, projection);

                    if (p1.scale > 0 && p2.scale > 0) {
                        const avgScale = (p1.scale + p2.scale) / 2;
                        const thickness = 10 * avgScale; // Thicker backbone

                        // Use actual tube mesh from geometry if possible
                        if (window.GreenhouseGeneticGeometry) {
                            const cp = { x: (n1.x + n2.x)/2, y: (n1.y + n2.y)/2, z: (n1.z + n2.z)/2 };
                            const tube = window.GreenhouseGeneticGeometry.generateTubeMesh(n1, n2, cp, 4, 6);
                            const projectedTube = tube.vertices.map(v => GreenhouseModels3DMath.project3DTo2D(v.x, v.y, v.z, camera, projection));

                            ctx.fillStyle = strandColor;
                            tube.faces.forEach(f => {
                                const v1 = projectedTube[f[0]], v2 = projectedTube[f[1]], v3 = projectedTube[f[2]];
                                if (v1.scale > 0 && v2.scale > 0 && v3.scale > 0) {
                                    ctx.beginPath(); ctx.moveTo(v1.x, v1.y); ctx.lineTo(v2.x, v2.y); ctx.lineTo(v3.x, v3.y); ctx.fill();
                                }
                            });
                        } else {
                            // Fallback gradient tube
                            const dx = p2.x - p1.x; const dy = p2.y - p1.y;
                            const len = Math.sqrt(dx * dx + dy * dy);
                            const nx = -dy / len; const ny = dx / len;
                            const gradient = ctx.createLinearGradient(p1.x - nx * thickness / 2, p1.y - ny * thickness / 2, p1.x + nx * thickness / 2, p1.y + ny * thickness / 2);
                            gradient.addColorStop(0, 'rgba(0,0,0,0.5)'); gradient.addColorStop(0.5, strandColor); gradient.addColorStop(1, 'rgba(255,255,255,0.4)');
                            ctx.strokeStyle = gradient; ctx.lineWidth = thickness; ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                        }
                    }
                }
            }
        }
    };

    window.GreenhouseGeneticDNA = GreenhouseGeneticDNA;
})();
