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

                    // Enhanced cylinder drawing with lighting
                    const drawEnhancedCylinder = (x1, y1, x2, y2, color, depth) => {
                        // Calculate normal for lighting (perpendicular to line)
                        const dx = x2 - x1;
                        const dy = y2 - y1;
                        const len = Math.sqrt(dx * dx + dy * dy);
                        const nx = -dy / len;
                        const ny = dx / len;

                        // Apply lighting if available
                        let litColor = color;
                        if (lighting) {
                            const baseColor = lighting.parseColor(color);
                            const material = config.get('materials.dna');
                            const normal = { x: nx, y: ny, z: 0 };
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

                        // Draw main cylinder with gradient for 3D effect
                        const gradient = ctx.createLinearGradient(
                            x1 - nx * thickness / 2, y1 - ny * thickness / 2,
                            x1 + nx * thickness / 2, y1 + ny * thickness / 2
                        );
                        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)'); // Darker Shadow edge
                        gradient.addColorStop(0.3, litColor); // Main color
                        gradient.addColorStop(0.7, litColor); // Main color
                        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.6)'); // Brighter Highlight edge

                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = thickness;
                        ctx.lineCap = 'butt'; // Butt cap for clean join at middle
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();

                        // Add specular highlight
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                        ctx.lineWidth = thickness * 0.2;
                        ctx.beginPath();
                        ctx.moveTo(x1 + nx * thickness * 0.15, y1 + ny * thickness * 0.15);
                        ctx.lineTo(x2 + nx * thickness * 0.15, y2 + ny * thickness * 0.15);
                        ctx.stroke();
                    };

                    // Draw two halves with depth
                    const avgDepth = (p1.depth + p2.depth) / 2;
                    drawEnhancedCylinder(p1.x, p1.y, midX, midY, color1, avgDepth);
                    drawEnhancedCylinder(midX, midY, p2.x, p2.y, color2, avgDepth);
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
