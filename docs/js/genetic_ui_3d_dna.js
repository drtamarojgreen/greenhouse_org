(function () {
    'use strict';

    const GreenhouseGeneticDNA = {
        drawMacroView(ctx, w, h, camera, projection, neurons3D, activeGeneIndex, brainShell, drawNeuronCallback, drawBrainShellCallback) {
            // Auto Rotate handled in main loop or here? Main loop updates camera, this just draws.

            // Draw Grid
            // (Grid logic can be shared or duplicated, let's assume it's handled by main or we move it here if specific to DNA view)
            // For now, let's focus on the DNA specific parts.

            // Draw Helix Connections (Backbone)
            this.drawConnections(ctx, neurons3D, camera, projection);

            // Project and Sort Genes
            const projectedGenes = [];
            neurons3D.forEach((n, i) => {
                const p = GreenhouseModels3DMath.project3DTo2D(n.x, n.y, n.z, camera, projection);
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

            // Draw Brain Shell (Wireframe) - Offset to the right
            if (brainShell && drawBrainShellCallback) {
                drawBrainShellCallback(ctx, 200); // 200 offset for brain side
            }
        },

        drawConnections(ctx, neurons3D, camera, projection) {
            // Draw Helix Backbone and Rungs
            // We assume the first half of neurons3D are the helix genes
            const helixNodes = neurons3D.filter(n => n.type === 'gene');

            if (helixNodes.length < 2) return;

            // 1. Draw Rungs (Base Pairs) - Connect i to i+1 (Strand 0 to Strand 1)
            ctx.lineWidth = 2;
            for (let i = 0; i < helixNodes.length; i += 2) {
                if (i + 1 >= helixNodes.length) break;

                const n1 = helixNodes[i];
                const n2 = helixNodes[i + 1];

                const p1 = GreenhouseModels3DMath.project3DTo2D(n1.x, n1.y, n1.z, camera, projection);
                const p2 = GreenhouseModels3DMath.project3DTo2D(n2.x, n2.y, n2.z, camera, projection);

                if (p1.scale > 0 && p2.scale > 0) {
                    const alpha = Math.min(1, (p1.scale + p2.scale)); // Fade distant
                    const thickness = 8 * ((p1.scale + p2.scale) / 2); // Thicker cylinders

                    // Midpoint
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;

                    // Assign Bases (Deterministic based on index)
                    // 0: A-T, 1: T-A, 2: C-G, 3: G-C
                    // Colors: Adenine (Red), Thymine (Blue), Cytosine (Yellow), Guanine (Green)
                    const type = (i / 2) % 4;
                    let color1, color2;

                    switch (type) {
                        case 0: color1 = '#ff4d4d'; color2 = '#4da6ff'; break; // A (Red) - T (Blue)
                        case 1: color1 = '#4da6ff'; color2 = '#ff4d4d'; break; // T - A
                        case 2: color1 = '#ffd93d'; color2 = '#6bff6b'; break; // C (Yellow) - G (Green)
                        case 3: color1 = '#6bff6b'; color2 = '#ffd93d'; break; // G - C
                    }

                    // Helper to draw cylinder segment
                    const drawCylinder = (x1, y1, x2, y2, color) => {
                        // Base Cylinder
                        ctx.strokeStyle = color;
                        ctx.lineWidth = thickness;
                        ctx.lineCap = 'butt';
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();

                        // Highlight (Specular reflection in middle)
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                        ctx.lineWidth = thickness * 0.3;
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();

                        // Shadow (Edges) - Simulate roundness
                        // Hard to do with single stroke. 
                        // We can draw thin dark lines at edges? No, too expensive.
                        // The highlight is enough for 60fps.
                    };

                    // Draw two halves
                    drawCylinder(p1.x, p1.y, midX, midY, color1);
                    drawCylinder(midX, midY, p2.x, p2.y, color2);
                }
            }

            // 2. Draw Backbone (Strand 0 and Strand 1 separately)
            ctx.lineWidth = 4;
            for (let s = 0; s < 2; s++) {
                const strandNodes = helixNodes.filter(n => n.strand === s);
                if (strandNodes.length < 2) continue;

                ctx.strokeStyle = s === 0 ? '#457b9d' : '#e63946'; // Different colors for strands
                ctx.beginPath();

                // Draw as continuous curve
                let first = true;
                for (let i = 0; i < strandNodes.length; i++) {
                    const n = strandNodes[i];
                    const p = GreenhouseModels3DMath.project3DTo2D(n.x, n.y, n.z, camera, projection);

                    if (p.scale > 0) {
                        if (first) {
                            ctx.moveTo(p.x, p.y);
                            first = false;
                        } else {
                            ctx.lineTo(p.x, p.y);
                        }
                    }
                }
                ctx.stroke();
            }
        }
    };

    window.GreenhouseGeneticDNA = GreenhouseGeneticDNA;
})();
