(function () {
    'use strict';

    const GreenhousePathwayBrain = {
        regionColors: {
            'gut': 'rgba(100, 255, 100, 0.15)',
            'blood_stream': 'rgba(255, 50, 50, 0.15)',
            'liver': 'rgba(150, 75, 0, 0.15)',
            'heart': 'rgba(255, 100, 200, 0.15)',
            'adrenals': 'rgba(255, 200, 0, 0.15)',
            'pfc': 'rgba(100, 150, 255, 0.15)',
            'hypothalamus': 'rgba(255, 150, 0, 0.15)',
            'pituitary': 'rgba(200, 100, 255, 0.15)',
            'brain_stem': 'rgba(100, 100, 100, 0.15)',
            'spinal_cord': 'rgba(200, 200, 200, 0.15)'
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
                const p1 = projectedVertices[face.indices[0]];
                const p2 = projectedVertices[face.indices[1]];
                const p3 = projectedVertices[face.indices[2]];

                if (p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
                    const dx1 = p2.x - p1.x; const dy1 = p2.y - p1.y;
                    const dx2 = p3.x - p1.x; const dy2 = p3.y - p1.y;
                    if (dx1 * dy2 - dy1 * dx2 < 0) {
                        const depth = (p1.depth + p2.depth + p3.depth) / 3;
                        const v1 = vertices[face.indices[0]];
                        const v2 = vertices[face.indices[1]];
                        const v3 = vertices[face.indices[2]];
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
                const baseColor = isHighlighted ? 'rgba(57, 255, 20, 0.4)' : (this.regionColors[f.region] || 'rgba(200, 200, 200, 0.05)');

                const match = baseColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
                const r = parseInt(match[1]); const g = parseInt(match[2]); const b = parseInt(match[3]); const a = parseFloat(match[4] || 1);

                const diffuse = Math.max(0, f.nx * lightDir.x + f.ny * lightDir.y + f.nz * lightDir.z);
                const intensity = (isHighlighted ? 0.6 : 0.3) + diffuse * 0.7;

                const litR = Math.min(255, r * intensity + (isHighlighted ? 50 : 0));
                const litG = Math.min(255, g * intensity + (isHighlighted ? 50 : 0));
                const litB = Math.min(255, b * intensity + (isHighlighted ? 50 : 0));

                const fog = GreenhouseModels3DMath.applyDepthFog(a, f.depth);
                ctx.fillStyle = `rgba(${litR}, ${litG}, ${litB}, ${fog})`;

                ctx.beginPath();
                ctx.moveTo(f.p1.x, f.p1.y);
                ctx.lineTo(f.p2.x, f.p2.y);
                ctx.lineTo(f.p3.x, f.p3.y);
                ctx.fill();
            });
        },

        drawInteractionPiP(ctx, w, h, moleculeName) {
            // Simplified 3D stylized view of a receptor interaction
            const mapName = (moleculeName || 'Dopamine').toLowerCase();
            let color = { r: 0, g: 153, b: 255 }; // Default Blue (Dopamine)
            if (mapName.includes('serotonin') || mapName.includes('5-ht')) color = { r: 255, g: 50, b: 50 };
            if (mapName.includes('glutamate')) color = { r: 255, g: 153, b: 0 };
            if (mapName.includes('gaba')) color = { r: 150, g: 0, b: 255 };
            if (mapName.includes('cortisol')) color = { r: 255, g: 200, b: 0 };

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
        }
    };

    window.GreenhousePathwayBrain = GreenhousePathwayBrain;
})();
