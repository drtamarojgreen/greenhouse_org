(function () {
    'use strict';

    const GreenhouseGeneticBrain = {
        drawTargetView(ctx, x, y, w, h, activeGene, activeGeneIndex, brainShell, drawPiPFrameCallback) {
            if (drawPiPFrameCallback) {
                drawPiPFrameCallback(ctx, x, y, w, h, "Target: Brain Region");
            }

            if (!activeGene || !brainShell) return;

            // Render the Brain Shell, highlighting the region corresponding to the gene
            const regions = Object.keys(brainShell.regions);
            const regionName = regions[activeGeneIndex % regions.length];

            // Camera for Target View
            const targetCamera = {
                x: 0, y: 0, z: -300,
                rotationX: 0.2,
                rotationY: Date.now() * 0.0005,
                rotationZ: 0,
                fov: 600
            };

            // Get points for this region
            const regionData = brainShell.regions[regionName];
            if (!regionData) return;

            // Let's draw the whole brain faint
            const project = (v) => GreenhouseModels3DMath.project3DTo2D(v.x, v.y, v.z, targetCamera, { width: w, height: h, near: 10, far: 5000 });

            // Draw all vertices as faint dots
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            brainShell.vertices.forEach(v => {
                // Rotate
                let vx = v.x, vy = v.y, vz = v.z;
                let tx = vx * Math.cos(targetCamera.rotationY) - vz * Math.sin(targetCamera.rotationY);
                let tz = vx * Math.sin(targetCamera.rotationY) + vz * Math.cos(targetCamera.rotationY);
                vx = tx; vz = tz;

                const p = project({ x: vx, y: vy, z: vz });
                if (p.scale > 0) {
                    ctx.fillRect(p.x + x, p.y + y, 1, 1);
                }
            });

            // Highlight Target Region
            if (regionData.vertices) {
                ctx.fillStyle = activeGene.baseColor;
                regionData.vertices.forEach(idx => {
                    const v = brainShell.vertices[idx];
                    if (!v) return;

                    // Rotate
                    let vx = v.x, vy = v.y, vz = v.z;
                    let tx = vx * Math.cos(targetCamera.rotationY) - vz * Math.sin(targetCamera.rotationY);
                    let tz = vx * Math.sin(targetCamera.rotationY) + vz * Math.cos(targetCamera.rotationY);
                    vx = tx; vz = tz;

                    const p = project({ x: vx, y: vy, z: vz });
                    if (p.scale > 0) {
                        const size = 2 * p.scale;
                        ctx.beginPath();
                        ctx.arc(p.x + x, p.y + y, size, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
            }

            // Label
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(regionName, x + w / 2, y + h - 10);

            ctx.restore(); // Restore context from drawPiPFrame
        },

        drawNeuron(ctx, p, neuronMeshes, camera, projection) {
            const pyramidalRegions = ['pfc', 'temporalLobe', 'parietalLobe', 'occipitalLobe', 'hippocampus'];
            const type = pyramidalRegions.includes(p.region) ? 'pyramidal' : 'stellate';

            if (neuronMeshes && !neuronMeshes[type]) {
                neuronMeshes[type] = type === 'pyramidal' ?
                    this.generatePyramidalMesh() :
                    this.generateStellateMesh();
            }
            const mesh = neuronMeshes ? neuronMeshes[type] : (type === 'pyramidal' ? this.generatePyramidalMesh() : this.generateStellateMesh());

            const rotX = p.x * 0.01;
            const rotY = p.y * 0.01 + Date.now() * 0.0005;
            const rotZ = p.z * 0.01;

            const transformedVertices = mesh.vertices.map(v => {
                let x = v.x, y = v.y, z = v.z;
                // Rotate Y
                let tx = x * Math.cos(rotY) - z * Math.sin(rotY);
                let tz = x * Math.sin(rotY) + z * Math.cos(rotY);
                x = tx; z = tz;
                // Rotate X
                let ty = y * Math.cos(rotX) - z * Math.sin(rotX);
                tz = y * Math.sin(rotX) + z * Math.cos(rotX);
                y = ty; z = tz;
                // Scale
                const scale = type === 'pyramidal' ? 1.5 : 1.0;
                x *= scale; y *= scale; z *= scale;
                // Translate
                return { x: x + p.x, y: y + p.y, z: z + p.z };
            });

            const projected = transformedVertices.map(v =>
                GreenhouseModels3DMath.project3DTo2D(v.x, v.y, v.z, camera, projection)
            );

            // ... (rest of drawing logic)
            // I need to copy the face sorting and drawing loop.

            // And helpers.

            // Sort faces by average Z-depth for correct rendering order (painter's algorithm)
            const facesWithDepth = mesh.faces.map(faceIndices => {
                const avgDepth = faceIndices.reduce((sum, idx) => sum + projected[idx].depth, 0) / faceIndices.length;
                return { faceIndices, avgDepth };
            }).sort((a, b) => b.avgDepth - a.avgDepth); // Sort from back to front

            facesWithDepth.forEach(({ faceIndices }) => {
                const p0 = projected[faceIndices[0]];
                const p1 = projected[faceIndices[1]];
                const p2 = projected[faceIndices[2]];

                if (p0.scale <= 0 || p1.scale <= 0 || p2.scale <= 0) return; // Don't draw if behind camera

                // Backface culling (simple 2D cross product check)
                const crossProduct = (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
                if (crossProduct >= 0) return; // Only draw front-facing triangles

                ctx.beginPath();
                ctx.moveTo(p0.x, p0.y);
                ctx.lineTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.closePath();

                // Determine color based on neuron's state (e.g., active, inactive)
                let baseColor = p.baseColor || '#00FFFF'; // Default to cyan
                if (p.isFocused) {
                    baseColor = this.adjustColor(baseColor, 50); // Brighten if focused
                }

                ctx.fillStyle = baseColor;
                ctx.strokeStyle = this.adjustColor(baseColor, -50); // Darker border
                ctx.lineWidth = 1;

                ctx.fill();
                ctx.stroke();
            });
        },

        generatePyramidalMesh() {
            const r = 6;
            const h = 12;
            const vertices = [
                { x: 0, y: -h, z: 0 },
                { x: r, y: r, z: r },
                { x: -r, y: r, z: r },
                { x: 0, y: r, z: -r }
            ];
            const faces = [
                [0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2]
            ];
            return { vertices, faces };
        },

        generateStellateMesh() {
            const s = 4;
            const p = 8;
            const vertices = [
                { x: -s, y: -s, z: -s }, { x: s, y: -s, z: -s }, { x: s, y: s, z: -s }, { x: -s, y: s, z: -s },
                { x: -s, y: -s, z: s }, { x: s, y: -s, z: s }, { x: s, y: s, z: s }, { x: -s, y: s, z: s },
                { x: 0, y: 0, z: -s - p }, { x: 0, y: 0, z: s + p },
                { x: 0, y: -s - p, z: 0 }, { x: s + p, y: 0, z: 0 },
                { x: -s - p, y: 0, z: 0 }, { x: s + p, y: 0, z: 0 }
            ];
            const faces = [];
            faces.push([10, 0, 1], [10, 1, 5], [10, 5, 4], [10, 4, 0]);
            faces.push([11, 3, 2], [11, 2, 6], [11, 6, 7], [11, 7, 3]);
            faces.push([9, 4, 5], [9, 5, 6], [9, 6, 7], [9, 7, 4]);
            faces.push([8, 1, 0], [8, 0, 3], [8, 3, 2], [8, 2, 1]);
            faces.push([12, 0, 4], [12, 4, 7], [12, 7, 3], [12, 3, 0]);
            faces.push([13, 5, 1], [13, 1, 2], [13, 2, 6], [13, 6, 5]);
            return { vertices, faces };
        },

        adjustColor(hex, amount) {
            let c = parseInt(hex.substring(1), 16);
            let r = (c >> 16) + amount;
            let g = (c >> 8 & 0x00FF) + amount;
            let b = (c & 0x0000FF) + amount;
            r = Math.min(255, Math.max(0, r));
            g = Math.min(255, Math.max(0, g));
            b = Math.min(255, Math.max(0, b));
            return '#' + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
        },
    };

    window.GreenhouseGeneticBrain = GreenhouseGeneticBrain;
})();
