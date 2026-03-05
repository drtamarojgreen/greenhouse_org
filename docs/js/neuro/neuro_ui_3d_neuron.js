(function () {
    'use strict';

    const GreenhouseNeuroNeuron = {
        neuronMeshes: {}, // Cache for neuron meshes

        drawNeuron(ctx, neuron, camera, projection, colorOverride, pulseFreq = 0.005) {
            // Project Center for LOD and Culling
            const p = GreenhouseModels3DMath.project3DTo2D(neuron.x, neuron.y, neuron.z, camera, projection);

            // Culling
            if (p.scale <= 0) return;

            // LOD: Low Detail (Simple Circle) for distant neurons
            if (p.scale < 0.6) {
                const alpha = GreenhouseModels3DMath.applyDepthFog(1, p.depth);
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = colorOverride || neuron.baseColor;
                ctx.beginPath();
                ctx.arc(p.x, p.y, neuron.radius * p.scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                return;
            }

            // High Detail: 3D Mesh
            // Determine cell type based on region
            const pyramidalRegions = ['pfc', 'temporalLobe', 'parietalLobe', 'occipitalLobe', 'hippocampus'];
            const type = pyramidalRegions.includes(neuron.region) ? 'pyramidal' : 'stellate';

            // Get or generate base mesh
            if (!this.neuronMeshes[type]) {
                this.neuronMeshes[type] = type === 'pyramidal' ?
                    this.generatePyramidalMesh() :
                    this.generateStellateMesh();
            }
            const mesh = this.neuronMeshes[type];

            // Transform vertices to world space (Rotation + Translation)
            const rotX = neuron.x * 0.01;
            const rotY = neuron.y * 0.01 + Date.now() * (pulseFreq * 0.1); // Scalable rotation
            const rotZ = neuron.z * 0.01;

            const transformedVertices = mesh.vertices.map(v => {
                // Rotate
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

                // Translate to Neuron Position (World Space)
                return {
                    x: x + neuron.x,
                    y: y + neuron.y,
                    z: z + neuron.z
                };
            });

            // Project to 2D
            const projected = transformedVertices.map(v =>
                GreenhouseModels3DMath.project3DTo2D(v.x, v.y, v.z, camera, projection)
            );

            // Sort faces
            const facesWithDepth = mesh.faces.map(face => {
                const v1 = projected[face[0]];
                const v2 = projected[face[1]];
                const v3 = projected[face[2]];

                if (v1.scale > 0 && v2.scale > 0 && v3.scale > 0) {
                    return {
                        face,
                        depth: (v1.depth + v2.depth + v3.depth) / 3,
                        vertices: [v1, v2, v3],
                        origVertices: [transformedVertices[face[0]], transformedVertices[face[1]], transformedVertices[face[2]]]
                    };
                }
                return null;
            }).filter(f => f !== null).sort((a, b) => b.depth - a.depth);

            // Light Direction
            const lightDir = { x: 0.5, y: -0.5, z: 1 };
            const len = Math.sqrt(lightDir.x * lightDir.x + lightDir.y * lightDir.y + lightDir.z * lightDir.z);
            lightDir.x /= len; lightDir.y /= len; lightDir.z /= len;

            // Draw Faces
            // Use depth from first face or neuron center?
            // Ideally average depth of face.

            facesWithDepth.forEach(({ vertices, origVertices, depth }) => {
                const [v1, v2, v3] = vertices;
                const [ov1, ov2, ov3] = origVertices;

                const alpha = GreenhouseModels3DMath.applyDepthFog(1, depth);

                // Backface Culling
                const dx1 = v2.x - v1.x;
                const dy1 = v2.y - v1.y;
                const dx2 = v3.x - v1.x;
                const dy2 = v3.y - v1.y;
                const cross = dx1 * dy2 - dy1 * dx2;

                if (cross > 0) {
                    // Calculate Normal
                    const ux = ov2.x - ov1.x;
                    const uy = ov2.y - ov1.y;
                    const uz = ov2.z - ov1.z;
                    const vx = ov3.x - ov1.x;
                    const vy = ov3.y - ov1.y;
                    const vz = ov3.z - ov1.z;

                    let nx = uy * vz - uz * vy;
                    let ny = uz * vx - ux * vz;
                    let nz = ux * vy - uy * vx;
                    const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);

                    let intensity = 0.4; // Ambient
                    if (nLen > 0) {
                        nx /= nLen; ny /= nLen; nz /= nLen;
                        const diffuse = Math.max(0, nx * lightDir.x + ny * lightDir.y + nz * lightDir.z);
                        intensity += diffuse * 0.6;
                    }

                    // Apply Lighting to Base Color
                    const colorStr = (typeof colorOverride === 'string') ? colorOverride :
                                   (typeof neuron.baseColor === 'string') ? neuron.baseColor : '#ffffff';
                    const colorMatch = colorStr.match(/#([0-9a-f]{6})/i);
                    let r = 255, g = 255, b = 255;
                    if (colorMatch) {
                        const hex = parseInt(colorMatch[1], 16);
                        r = (hex >> 16) & 255;
                        g = (hex >> 8) & 255;
                        b = hex & 255;
                    }

                    const litR = Math.min(255, r * intensity);
                    const litG = Math.min(255, g * intensity);
                    const litB = Math.min(255, b * intensity);

                    ctx.fillStyle = `rgba(${litR}, ${litG}, ${litB}, ${alpha})`;
                    ctx.beginPath();
                    ctx.moveTo(v1.x, v1.y);
                    ctx.lineTo(v2.x, v2.y);
                    ctx.lineTo(v3.x, v3.y);
                    ctx.fill();
                }
            });
        },

        generatePyramidalMesh() {
            // True 3D Pyramid: Base triangle + Apex + Elongated Apical Dendrite
            const r = 6;
            const h = 12;
            const vertices = [
                { x: 0, y: -h, z: 0 }, // 0: Apex (Top)
                { x: r, y: r, z: r },  // 1: Base 1
                { x: -r, y: r, z: r }, // 2: Base 2
                { x: 0, y: r, z: -r }  // 3: Base 3
            ];
            const faces = [
                [0, 1, 2], // Side 1
                [0, 2, 3], // Side 2
                [0, 3, 1], // Side 3
                [1, 3, 2]  // Base
            ];
            return { vertices, faces };
        },

        generateStellateMesh() {
            // True 3D Star (Icosahedron-like spike ball)
            // Simplified: Central cube with pyramids on each face
            const s = 4; // size
            const p = 8; // spike length
            const vertices = [
                // Cube Vertices (0-7)
                { x: -s, y: -s, z: -s }, { x: s, y: -s, z: -s }, { x: s, y: s, z: -s }, { x: -s, y: s, z: -s },
                { x: -s, y: -s, z: s }, { x: s, y: -s, z: s }, { x: s, y: s, z: s }, { x: -s, y: s, z: s },
                // Spikes (8-13)
                { x: 0, y: 0, z: -s - p }, // Back
                { x: 0, y: 0, z: s + p },  // Front
                { x: 0, y: -s - p, z: 0 }, // Top
                { x: 0, y: s + p, z: 0 },  // Bottom
                { x: -s - p, y: 0, z: 0 }, // Left
                { x: s + p, y: 0, z: 0 }   // Right
            ];

            const faces = [];
            // Add faces for spikes connecting to cube corners...
            // Simplified for performance: Just a few spikes
            // Top Spike
            faces.push([10, 0, 1], [10, 1, 5], [10, 5, 4], [10, 4, 0]);
            // Bottom Spike
            faces.push([11, 3, 2], [11, 2, 6], [11, 6, 7], [11, 7, 3]);
            // Front Spike
            faces.push([9, 4, 5], [9, 5, 6], [9, 6, 7], [9, 7, 4]);
            // Back Spike
            faces.push([8, 1, 0], [8, 0, 3], [8, 3, 2], [8, 2, 1]);
            // Left Spike
            faces.push([12, 0, 4], [12, 4, 7], [12, 7, 3], [12, 3, 0]);
            // Right Spike
            faces.push([13, 5, 1], [13, 1, 2], [13, 2, 6], [13, 6, 5]);

            return { vertices, faces };
        },
    };

    window.GreenhouseNeuroNeuron = GreenhouseNeuroNeuron;
})();
