(function () {
    'use strict';

    const GreenhousePathwayBrain = {
        regionColors: {
            'gut': 'rgba(160, 174, 192, 0.20)',
            'blood_stream': 'rgba(160, 174, 192, 0.20)',
            'liver': 'rgba(160, 174, 192, 0.20)',
            'heart': 'rgba(160, 174, 192, 0.20)',
            'adrenals': 'rgba(160, 174, 192, 0.20)',
            'pfc': 'rgba(160, 174, 192, 0.20)',
            'hypothalamus': 'rgba(160, 174, 192, 0.20)',
            'pituitary': 'rgba(160, 174, 192, 0.20)',
            'brain_stem': 'rgba(160, 174, 192, 0.20)',
            'spinal_cord': 'rgba(160, 174, 192, 0.20)'
        },

        drawBrain(ctx, brainShell, camera, projection, width, height, options = {}) {
            this.drawShell(ctx, brainShell, camera, projection, width, height, options.activeRegion);
        },

        drawTorso(ctx, torsoShell, camera, projection, width, height, options = {}) {
            this.drawShell(ctx, torsoShell, camera, projection, width, height, options.activeRegion);
        },

        drawShell(ctx, shell, camera, projection, width, height, activeRegion) {
            if (!shell || !shell.vertices || !shell.faces) return;

            const vertices = shell.vertices;
            const faces = shell.faces;
            const lightDir = { x: 0.5, y: -0.5, z: 1 };
            const len = Math.sqrt(lightDir.x * lightDir.x + lightDir.y * lightDir.y + lightDir.z * lightDir.z);
            lightDir.x /= len; lightDir.y /= len; lightDir.z /= len;

            const projectedVertices = vertices.map(v => GreenhouseModels3DMath.project3DTo2D(v.x, v.y, v.z, camera, projection));

            const facesToDraw = [];
            faces.forEach(face => {
                const indices = face.indices || face;
                const p1 = projectedVertices[indices[0]];
                const p2 = projectedVertices[indices[1]];
                const p3 = projectedVertices[indices[2]];

                if (p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
                    const dx1 = p2.x - p1.x; const dy1 = p2.y - p1.y;
                    const dx2 = p3.x - p1.x; const dy2 = p3.y - p1.y;
                    if (dx1 * dy2 - dy1 * dx2 < 0) {
                        const depth = (p1.depth + p2.depth + p3.depth) / 3;
                        const v1 = vertices[indices[0]];
                        const v2 = vertices[indices[1]];
                        const v3 = vertices[indices[2]];
                        const ux = v2.x - v1.x; const uy = v2.y - v1.y; const uz = v2.z - v1.z;
                        const vx = v3.x - v1.x; const vy = v3.y - v1.y; const vz = v3.z - v1.z;
                        let nx = uy * vz - uz * vy; let ny = uz * vx - ux * vz; let nz = ux * vy - uy * vx;
                        const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
                        if (nLen > 0) { nx /= nLen; ny /= nLen; nz /= nLen; }
                        facesToDraw.push({ p1, p2, p3, depth, nx, ny, nz, region: face.region });
                    }
                }
            });

            facesToDraw.sort((a, b) => b.depth - a.depth);

            facesToDraw.forEach(f => {
                const isHighlighted = activeRegion === f.region;
                // Use monochromatic premium palette for highlighting
                const baseColor = isHighlighted ? 'rgba(255, 255, 255, 0.6)' : (this.regionColors[f.region] || 'rgba(160, 174, 192, 0.15)');

                const match = baseColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
                const r = parseInt(match[1]); const g = parseInt(match[2]); const b = parseInt(match[3]); const a = parseFloat(match[4] || 1);

                const diffuse = Math.max(0, f.nx * lightDir.x + f.ny * lightDir.y + f.nz * lightDir.z);
                const intensity = (isHighlighted ? 0.6 : 0.3) + diffuse * 0.7;

                const litR = Math.min(255, r * intensity + (isHighlighted ? 50 : 0));
                const litG = Math.min(255, g * intensity + (isHighlighted ? 50 : 0));
                const litB = Math.min(255, b * intensity + (isHighlighted ? 50 : 0));

                const fog = GreenhouseModels3DMath.applyDepthFog(a, f.depth);

                // --- Pathway Specific Structural Shading ---
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(f.p1.x, f.p1.y);
                ctx.lineTo(f.p2.x, f.p2.y);
                ctx.lineTo(f.p3.x, f.p3.y);
                ctx.closePath();
                ctx.fillStyle = `rgba(${litR}, ${litG}, ${litB}, ${fog})`;
                ctx.fill();

                if (isHighlighted) {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${fog * 0.8})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }

                // Grid detail pass
                if (f.depth < 0.5) {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${fog * 0.1})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }

                // Unique texture patterns for systemic regions - Enhanced for grayscale
                if (f.region === 'gut') {
                    // Peristaltic wave pattern
                    ctx.strokeStyle = `rgba(255, 255, 255, ${fog * (isHighlighted ? 0.4 : 0.2)})`;
                    ctx.setLineDash([4, 4]);
                    ctx.stroke();
                } else if (f.region === 'blood_stream') {
                    // Flow lines
                    ctx.strokeStyle = `rgba(255, 255, 255, ${fog * (isHighlighted ? 0.3 : 0.15)})`;
                    ctx.beginPath(); ctx.moveTo(f.p1.x, f.p1.y); ctx.lineTo(f.p3.x, f.p3.y); ctx.stroke();
                } else if (f.region === 'pfc') {
                    // Executive Grid Pattern
                    ctx.strokeStyle = `rgba(255, 255, 255, ${fog * (isHighlighted ? 0.3 : 0.1)})`;
                    ctx.setLineDash([1, 2]);
                    ctx.stroke();
                }
                ctx.restore();
            });
        },

        drawInteractionPiP(ctx, w, h, moleculeName, sourceUrl) {
            // Simplified 3D stylized view of a receptor interaction - Monochromatic
            const mapName = (moleculeName || 'Dopamine').toLowerCase();
            let color = { r: 208, g: 208, b: 208 }; // Default Gray
            if (mapName.includes('serotonin') || mapName.includes('5-ht')) color = { r: 224, g: 224, b: 224 };
            if (mapName.includes('glutamate')) color = { r: 208, g: 208, b: 208 };
            if (mapName.includes('gaba')) color = { r: 160, g: 174, b: 192 };
            if (mapName.includes('cortisol')) color = { r: 240, g: 240, b: 240 };

            // Draw Background and Frame
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, w, h);
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, w, h);

            // Label
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText("Molecular Interaction: " + (moleculeName || 'None'), w / 2, 20);

            if (!moleculeName) return;

            // Draw Presynaptic Terminal (Top Bulb)
            const centerX = w / 2;
            const centerY = h / 2;
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(centerX, centerY - 60, 40, 0, Math.PI, true); // Bulb shape
            ctx.fill();
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`; // Highlight color
            ctx.lineWidth = 4;
            ctx.stroke();

            // Draw Postsynaptic Terminal (Bottom Cup)
            ctx.beginPath();
            ctx.arc(centerX, centerY + 60, 40, Math.PI, 0, true); // Cup shape
            ctx.fill();
            ctx.stroke();

            // Draw Particles (Neurotransmitters)
            const time = Date.now() * 0.002;
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
            for (let i = 0; i < 8; i++) {
                const offset = (i / 8) * Math.PI * 2;
                const px = centerX + Math.cos(time + offset) * 15;
                const py = centerY + Math.sin(time * 1.5 + offset) * 20; // Falling movement

                ctx.beginPath();
                ctx.arc(px, py, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw Receptors
            ctx.fillStyle = '#555';
            for (let i = -1; i <= 1; i++) {
                ctx.fillRect(centerX + i * 20 - 5, centerY + 30, 10, 10);
            }

            // Draw Source/Provenance if available
            if (sourceUrl) {
                ctx.fillStyle = 'rgba(76, 161, 175, 0.8)';
                ctx.font = 'italic 10px Arial';
                ctx.textAlign = 'center';
                const displayUrl = sourceUrl.length > 40 ? sourceUrl.substring(0, 37) + '...' : sourceUrl;
                ctx.fillText("Source: " + displayUrl, w / 2, h - 15);
            }
        }
    };

    window.GreenhousePathwayBrain = GreenhousePathwayBrain;
})();
