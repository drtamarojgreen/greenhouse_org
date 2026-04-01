(function () {
    'use strict';

    const GreenhouseNeuroNeuron = {
        neuronMeshes: {},

        drawNeuron(ctx, neuron, camera, projection, colorOverride, pulseFreq = 0.002, isHovered = false) {
            // Project Center for LOD and Culling
            const p = GreenhouseModels3DMath.project3DTo2D(neuron.x, neuron.y, neuron.z, camera, projection);
            if (p.scale <= 0) return;

            const pyramidalRegions = ['pfc', 'temporalLobe', 'parietalLobe', 'occipitalLobe', 'hippocampus'];
            const type = pyramidalRegions.includes(neuron.region) ? 'pyramidal' : 'stellate';
            const lod = p.scale < 0.3 ? 0 : p.scale < 0.6 ? 1 : 2;

            if (lod === 0) {
                this.drawLODIcon(ctx, p, neuron, type, colorOverride);
                return;
            }

            const meshKey = `${type}_lod${lod}`;
            if (!this.neuronMeshes[meshKey]) {
                this.neuronMeshes[meshKey] = type === 'pyramidal'
                    ? this.generatePyramidalMesh()
                    : this.generateStellateMesh();
            }

            if (!this.synapticPegMesh) {
                this.synapticPegMesh = this.generateOctahedronMesh(3);
            }
            const mesh = this.neuronMeshes[meshKey];

            const now = Date.now();
            const activation = Math.max(0, Math.min(1, neuron.activationLevel ?? neuron.activation ?? 0));
            const neuronSeed = String(neuron.id ?? `${neuron.x}_${neuron.y}_${neuron.z}`)
                .split('')
                .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
            const firingOsc = Math.max(0, Math.sin(now * 0.005 + neuronSeed * 0.01));
            const firingPulse = (neuron.isFiring || activation > 0.85) ? firingOsc * 0.12 : 0;
            const membraneDisplacement = activation * 0.8;

            const rotX = neuron.x * 0.01;
            const rotY = neuron.y * 0.01 + now * (pulseFreq * 0.1);
            const rotZ = neuron.z * 0.01;

            const transformedVertices = mesh.vertices.map((v) => {
                let x = v.x;
                let y = v.y;
                let z = v.z;

            // --- Vertex Displacement for Hover/Pulsing ---
                if (isHovered) {
                    const disp = Math.sin(Date.now() * 0.01 + (x + y + z)) * 2.0;
                    x += (x / 5) * disp;
                    y += (y / 5) * disp;
                    z += (z / 5) * disp;
                }

                // Rhythmic pulsing based on activity/pulseFreq - Reduced intensity for accessibility
                const activityPulse = Math.sin(Date.now() * pulseFreq * 2) * 0.5 + 0.5;
                const activityDisp = activityPulse * (type === 'pyramidal' ? 0.6 : 0.4);
                x *= (1 + activityDisp * 0.03);
                y *= (1 + activityDisp * 0.03);
                z *= (1 + activityDisp * 0.03);

                // Rotate Y
                let tx = x * Math.cos(rotY) - z * Math.sin(rotY);
                let tz = x * Math.sin(rotY) + z * Math.cos(rotY);
                x = tx; z = tz;

                let ty = y * Math.cos(rotX) - z * Math.sin(rotX);
                tz = y * Math.sin(rotX) + z * Math.cos(rotX);
                y = ty; z = tz;

                tx = x * Math.cos(rotZ) - y * Math.sin(rotZ);
                ty = x * Math.sin(rotZ) + y * Math.cos(rotZ);
                x = tx; y = ty;

                const scale = type === 'pyramidal' ? 1.3 : 1.05;
                x *= scale; y *= scale; z *= scale;

                return { x: x + neuron.x, y: y + neuron.y, z: z + neuron.z };
            });

            const projected = transformedVertices.map(v =>
                GreenhouseModels3DMath.project3DTo2D(v.x, v.y, v.z, camera, projection)
            );

            const facesWithDepth = mesh.faces.map(face => {
                const v1 = projected[face[0]];
                const v2 = projected[face[1]];
                const v3 = projected[face[2]];

                if (v1.scale > 0 && v2.scale > 0 && v3.scale > 0) {
                    return {
                        depth: (v1.depth + v2.depth + v3.depth) / 3,
                        vertices: [v1, v2, v3],
                        origVertices: [transformedVertices[face[0]], transformedVertices[face[1]], transformedVertices[face[2]]]
                    };
                }
                return null;
            }).filter(Boolean).sort((a, b) => b.depth - a.depth);

            const lightDir = { x: 0.5, y: -0.5, z: 1 };
            const len = Math.sqrt(lightDir.x * lightDir.x + lightDir.y * lightDir.y + lightDir.z * lightDir.z);
            lightDir.x /= len; lightDir.y /= len; lightDir.z /= len;

            facesWithDepth.forEach(({ vertices, origVertices, depth }) => {
                const [v1, v2, v3] = vertices;
                const [ov1, ov2, ov3] = origVertices;
                const alpha = GreenhouseModels3DMath.applyDepthFog(1, depth);

                const dx1 = v2.x - v1.x;
                const dy1 = v2.y - v1.y;
                const dx2 = v3.x - v1.x;
                const dy2 = v3.y - v1.y;
                if (dx1 * dy2 - dy1 * dx2 <= 0) return;

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

                let intensity = 0.4;
                if (nLen > 0) {
                    nx /= nLen; ny /= nLen; nz /= nLen;
                    const diffuse = Math.max(0, nx * lightDir.x + ny * lightDir.y + nz * lightDir.z);
                    intensity += diffuse * 0.6;
                }

                const colorStr = (typeof colorOverride === 'string') ? colorOverride : (typeof neuron.baseColor === 'string' ? neuron.baseColor : '#ffffff');
                const colorMatch = colorStr.match(/#([0-9a-f]{6})/i);
                let r = 235, g = 242, b = 255;
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

                    // --- Structural Neuron Shading ---
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(v1.x, v1.y);
                    ctx.lineTo(v2.x, v2.y);
                    ctx.lineTo(v3.x, v3.y);
                    ctx.closePath();
                    ctx.fill();

                    // Pattern overlay for accessibility - Reinforced distinctions
                    if (type === 'pyramidal') {
                        // Sharp wireframe highlight for pyramidals
                        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
                        ctx.lineWidth = 1.0;
                        ctx.stroke();
                    } else {
                        // Soft stipple effect for stellates
                        if (Math.random() < 0.3) {
                            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
                            ctx.beginPath();
                            ctx.arc(v1.x, v1.y, 1, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                    ctx.restore();
                }
            );

            // Draw Synaptic Pegs (Octahedrons) representing synapses
            const pegColor = '#D0D0D0';
            const pegCount = type === 'pyramidal' ? 6 : 4;
            for (let i = 0; i < pegCount; i++) {
                const angle = (i / pegCount) * Math.PI * 2 + now * 0.001;
                const r = type === 'pyramidal' ? 5 : 4;
                const px = Math.cos(angle) * r;
                const pz = Math.sin(angle) * r;
                const py = (i % 2 === 0 ? 1 : -1) * (type === 'pyramidal' ? 4 : 2);

                this.drawMeshAt(ctx, this.synapticPegMesh, {
                    x: neuron.x + px,
                    y: neuron.y + py,
                    z: neuron.z + pz
                }, camera, projection, pegColor, rotX, rotY, rotZ);
            }
        },

        drawMeshAt(ctx, mesh, pos, camera, projection, colorStr, rotX, rotY, rotZ) {
            const transformedVertices = mesh.vertices.map(v => {
                let x = v.x, y = v.y, z = v.z;
                // Simple Rotation
                let tx = x * Math.cos(rotY) - z * Math.sin(rotY);
                let tz = x * Math.sin(rotY) + z * Math.cos(rotY);
                x = tx; z = tz;
                let ty = y * Math.cos(rotX) - z * Math.sin(rotX);
                tz = y * Math.sin(rotX) + z * Math.cos(rotX);
                y = ty; z = tz;
                tx = x * Math.cos(rotZ) - y * Math.sin(rotZ);
                ty = x * Math.sin(rotZ) + y * Math.cos(rotZ);
                x = tx; y = ty;
                return { x: x + pos.x, y: y + pos.y, z: z + pos.z };
            });

            const projected = transformedVertices.map(v =>
                GreenhouseModels3DMath.project3DTo2D(v.x, v.y, v.z, camera, projection)
            );

            mesh.faces.forEach(face => {
                const v1 = projected[face[0]], v2 = projected[face[1]], v3 = projected[face[2]];
                if (v1.scale > 0 && v2.scale > 0 && v3.scale > 0) {
                    const depth = (v1.depth + v2.depth + v3.depth) / 3;
                    const alpha = GreenhouseModels3DMath.applyDepthFog(0.9, depth);
                    if ((v2.x - v1.x) * (v3.y - v1.y) - (v2.y - v1.y) * (v3.x - v1.x) > 0) {
                        ctx.fillStyle = colorStr;
                        ctx.globalAlpha = alpha;
                        ctx.beginPath();
                        ctx.moveTo(v1.x, v1.y);
                        ctx.lineTo(v2.x, v2.y);
                        ctx.lineTo(v3.x, v3.y);
                        ctx.fill();
                        ctx.globalAlpha = 1.0;
                    }
                }
            });
        },

        generateOctahedronMesh(size) {
            const s = size || 3;
            const vertices = [
                { x: 0, y: s, z: 0 }, { x: 0, y: -s, z: 0 },
                { x: s, y: 0, z: 0 }, { x: -s, y: 0, z: 0 },
                { x: 0, y: 0, z: s }, { x: 0, y: 0, z: -s }
            ];
            const faces = [
                [0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2],
                [1, 2, 4], [1, 4, 3], [1, 3, 5], [1, 5, 2]
            ];
            return { vertices, faces };
        },

        generatePyramidalMesh() {
            // Anatomically Detailed Pyramidal Mesh: Soma + Apical Dendrite + Basal Dendrites
            const r = 6;
            const h = 12;
            const vertices = [
                { x: 0, y: -h, z: 0 }, // 0: Apex (Top)
                { x: r, y: r, z: r },  // 1: Base 1
                { x: -r, y: r, z: r }, // 2: Base 2
                { x: 0, y: r, z: -r }, // 3: Base 3
                { x: 0, y: -h * 1.5, z: 0 }, // 4: Tip of apical dendrite
                // Basal Dendrite Points
                { x: r * 1.5, y: r * 1.2, z: -r }, // 5: Basal 1
                { x: -r * 1.5, y: r * 1.2, z: -r }, // 6: Basal 2
                { x: r, y: r * 1.2, z: r * 1.5 },   // 7: Basal 3
                { x: -r, y: r * 1.2, z: r * 1.5 }   // 8: Basal 4
            ];
            const faces = [
                [4, 1, 2], [4, 2, 3], [4, 3, 1], // Elongated head
                [0, 1, 2], [0, 2, 3], [0, 3, 1], // Body
                [1, 3, 2], // Base
                // Connect Basal Dendrites
                [1, 3, 5], [2, 3, 6], [1, 2, 7], [2, 1, 8]
            ];
            return { vertices, faces };
        },

        generateStellateMesh() {
            // Multi-polar Stellate Mesh with Randomized Spike Morphology
            const s = 4; // size
            const p = 8; // base spike length
            const rnd = () => 0.8 + Math.random() * 0.4;
            const vertices = [
                // Cube Vertices (0-7)
                { x: -s, y: -s, z: -s }, { x: s, y: -s, z: -s }, { x: s, y: s, z: -s }, { x: -s, y: s, z: -s },
                { x: -s, y: -s, z: s }, { x: s, y: -s, z: s }, { x: s, y: s, z: s }, { x: -s, y: s, z: s },
                // Randomized Spikes (8-13)
                { x: 0, y: 0, z: (-s - p * 1.5) * rnd() }, // Back
                { x: 0, y: 0, z: (s + p) * rnd() },        // Front
                { x: 0, y: (-s - p) * rnd(), z: 0 },       // Top
                { x: 0, y: (s + p * 1.2) * rnd(), z: 0 },  // Bottom
                { x: (-s - p) * rnd(), z: 0, y: 0 },       // Left
                { x: (s + p * 0.8) * rnd(), y: 0, z: 0 }   // Right
            ];

            const faces = [];
            // Add faces for spikes connecting to cube corners...
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
        }
    };

    window.GreenhouseNeuroNeuron = GreenhouseNeuroNeuron;
})();
