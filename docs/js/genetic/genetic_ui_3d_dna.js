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
                    ctx.strokeStyle = '#4FD1C5';
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

                    const type = (i / 2) % 4;
                    const isPurineWide = type < 2;
                    const rungThickness = thickness * (isPurineWide ? 1.15 : 0.9);
                    const rungTwist = ((i / 2) * (Math.PI / 5)) % (Math.PI * 2);
                    const tx = Math.cos(rungTwist);
                    const ty = Math.sin(rungTwist);
                    const edgeNx = (p2.y - p1.y);
                    const edgeNy = -(p2.x - p1.x);
                    const edgeLen = Math.sqrt(edgeNx * edgeNx + edgeNy * edgeNy) || 1;
                    const nx = edgeNx / edgeLen;
                    const ny = edgeNy / edgeLen;
                    const rx = tx * 0.6 + nx * 0.4;
                    const ry = ty * 0.6 + ny * 0.4;

                    // Enhanced structural rung drawing with lighting.
                    const drawStructuralRung = (x1, y1, x2, y2, depth) => {
                        const dx = x2 - x1;
                        const dy = y2 - y1;
                        const len = Math.sqrt(dx * dx + dy * dy);
                        const nxLine = -dy / len;
                        const nyLine = dx / len;

                        let litColor = '#d8def4';
                        if (lighting) {
                            const baseColor = lighting.parseColor('#b8c8ff');
                            const material = config.get('materials.dna');
                            const normal = { x: nxLine, y: nyLine, z: 0 };
                            const position = { x: (x1 + x2) / 2, y: (y1 + y2) / 2, z: depth };

                            const lit = lighting.calculateLighting(normal, position, camera, {
                                baseColor: baseColor,
                                metallic: material.metallic,
                                roughness: material.roughness,
                                emissive: material.emissive,
                                emissiveIntensity: material.emissiveIntensity,
                                alpha: material.alpha
                            });

                            litColor = lighting.toRGBA(lit);
                        }

                        // Draw as a flattened rectangular beam to encode base pair geometry.
                        const gradient = ctx.createLinearGradient(
                            x1 - rx * rungThickness / 2, y1 - ry * rungThickness / 2,
                            x1 + rx * rungThickness / 2, y1 + ry * rungThickness / 2
                        );
                        gradient.addColorStop(0, 'rgba(25, 30, 50, 0.55)');
                        gradient.addColorStop(0.3, litColor);
                        gradient.addColorStop(0.7, litColor);
                        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.6)');

                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = thickness;
                        ctx.lineCap = 'butt'; // Butt cap for clean join at middle

                        // Structural differentiation for base pair types (Geometric differentiation)
                        ctx.save();
                        if (type === 0 || type === 1) { // A-T (Dashed / Triangular cap)
                            ctx.setLineDash([thickness * 0.4, thickness * 0.2]);
                            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

                            // Triangular cap at mid
                            ctx.fillStyle = litColor;
                            ctx.beginPath();
                            ctx.moveTo(x2, y2 - thickness*0.4); ctx.lineTo(x2 + thickness*0.4, y2 + thickness*0.4); ctx.lineTo(x2 - thickness*0.4, y2 + thickness*0.4);
                            ctx.fill();
                        } else { // C-G (Solid / Hexagonal cap)
                            ctx.setLineDash([]);
                            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

                            // Hexagonal cap at mid
                            ctx.fillStyle = litColor;
                            ctx.beginPath();
                            for(let k=0; k<6; k++) {
                                const ang = k * Math.PI / 3;
                                ctx.lineTo(x2 + thickness*0.4 * Math.cos(ang), y2 + thickness*0.4 * Math.sin(ang));
                            }
                            ctx.closePath();
                            ctx.fill();
                        }
                        ctx.restore();

                        // Structural hatch marks for grayscale distinguishability.
                        const hatchCount = isPurineWide ? 3 : 2;
                        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
                        ctx.lineWidth = Math.max(1, rungThickness * 0.08);
                        for (let h = 1; h <= hatchCount; h++) {
                            const t = h / (hatchCount + 1);
                            const hx = x1 + dx * t;
                            const hy = y1 + dy * t;
                            ctx.beginPath();
                            ctx.moveTo(hx - nxLine * rungThickness * 0.32, hy - nyLine * rungThickness * 0.32);
                            ctx.lineTo(hx + nxLine * rungThickness * 0.32, hy + nyLine * rungThickness * 0.32);
                            ctx.stroke();
                        }

                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                        ctx.lineWidth = rungThickness * 0.16;
                        ctx.beginPath();
                        ctx.moveTo(x1 + nxLine * rungThickness * 0.15, y1 + nyLine * rungThickness * 0.15);
                        ctx.lineTo(x2 + nxLine * rungThickness * 0.15, y2 + nyLine * rungThickness * 0.15);
                        ctx.stroke();
                    };

                    // Draw two halves with depth (still linked to A/T/C/G data, but geometry first).
                    const avgDepth = (p1.depth + p2.depth) / 2;
                    drawStructuralRung(p1.x, p1.y, midX, midY, avgDepth);
                    drawStructuralRung(midX, midY, p2.x, p2.y, avgDepth);
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

                        // Calculate perpendicular for gradient
                        const dx = p2.x - p1.x;
                        const dy = p2.y - p1.y;
                        const len = Math.sqrt(dx * dx + dy * dy);
                        const nx = -dy / len;
                        const ny = dx / len;

                        // Create gradient for 3D tube effect
                        const gradient = ctx.createLinearGradient(
                            p1.x - nx * thickness / 2, p1.y - ny * thickness / 2,
                            p1.x + nx * thickness / 2, p1.y + ny * thickness / 2
                        );

                        const baseColor = lighting ? lighting.parseColor(strandColor) : { r: 255, g: 255, b: 255, a: 1 };
                        gradient.addColorStop(0, `rgba(${baseColor.r * 0.2}, ${baseColor.g * 0.2}, ${baseColor.b * 0.2}, 0.9)`);
                        gradient.addColorStop(0.4, strandColor);
                        gradient.addColorStop(0.6, strandColor);
                        gradient.addColorStop(1, `rgba(${Math.min(255, baseColor.r * 1.8)}, ${Math.min(255, baseColor.g * 1.8)}, ${Math.min(255, baseColor.b * 1.8)}, 0.95)`);

                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = thickness;
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();

                        // Add specular highlight
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                        ctx.lineWidth = thickness * 0.3;
                        ctx.beginPath();
                        ctx.moveTo(p1.x + nx * thickness * 0.2, p1.y + ny * thickness * 0.2);
                        ctx.lineTo(p2.x + nx * thickness * 0.2, p2.y + ny * thickness * 0.2);
                        ctx.stroke();
                    }
                }
            }
        }
    };

    window.GreenhouseGeneticDNA = GreenhouseGeneticDNA;
})();
