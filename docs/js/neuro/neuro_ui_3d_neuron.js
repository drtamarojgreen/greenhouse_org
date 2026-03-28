(function () {
    'use strict';

    const GreenhouseNeuroNeuron = {
        neuronMeshes: {}, // Cache for neuron meshes

        drawNeuron(ctx, neuron, camera, projection, colorOverride, pulseFreq = 0.005) {
            // Project Center for LOD and Culling
            const p = GreenhouseModels3DMath.project3DTo2D(neuron.x, neuron.y, neuron.z, camera, projection);

            // Culling
            if (p.scale <= 0) return;

            // Determine cell type based on region
            const pyramidalRegions = ['pfc', 'temporalLobe', 'parietalLobe', 'occipitalLobe', 'hippocampus'];
            const type = pyramidalRegions.includes(neuron.region) ? 'pyramidal' : 'stellate';

            // LOD 0: Icon for very distant neurons
            if (p.scale < 0.3) {
                const alpha = GreenhouseModels3DMath.applyDepthFog(1, p.depth);
                ctx.save();
                ctx.globalAlpha = alpha;
                const color = colorOverride || neuron.baseColor;
                ctx.fillStyle = color;
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.translate(p.x, p.y);
                const size = neuron.radius * p.scale;
                if (type === 'pyramidal') {
                    // Triangle Icon
                    ctx.beginPath();
                    ctx.moveTo(0, -size);
                    ctx.lineTo(size, size);
                    ctx.lineTo(-size, size);
                    ctx.closePath();
                    ctx.fill();
                } else {
                    // Circle with radiating lines icon
                    ctx.beginPath();
                    ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
                    ctx.fill();
                    for (let i = 0; i < 6; i++) {
                        ctx.beginPath();
                        const angle = i * Math.PI / 3;
                        ctx.moveTo(Math.cos(angle) * size * 0.7, Math.sin(angle) * size * 0.7);
                        ctx.lineTo(Math.cos(angle) * size * 1.2, Math.sin(angle) * size * 1.2);
                        ctx.stroke();
                    }
                }
                ctx.restore();
                return;
            }

            // LOD 1: Simple Circle for medium distance
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

            // LOD 2: High Detail 3D Mesh
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

            // Activity Signals
            const now = Date.now();
            const isActive = neuron.activation > 0.5;
            const isFiring = neuron.isFiring;
            const firingScale = isFiring ? 1.1 : 1.0;

            const transformedVertices = mesh.vertices.map(v => {
                // Rotate
                let x = v.x, y = v.y, z = v.z;

                // Membrane Flickering (Activity Signal)
                if (isActive) {
                    const freq = 0.2;
                    const amp = 0.5;
                    const offset = Math.sin((v.x + v.y + v.z) * freq + now * 0.01) * amp;
                    x += v.nx * offset;
                    y += v.ny * offset;
                    z += v.nz * offset;
                }

                // Rotate Y
                let tx = x * Math.cos(rotY) - z * Math.sin(rotY);
                let tz = x * Math.sin(rotY) + z * Math.cos(rotY);
                x = tx; z = tz;

                // Rotate X
                let ty = y * Math.cos(rotX) - z * Math.sin(rotX);
                tz = y * Math.sin(rotX) + z * Math.cos(rotX);
                y = ty; z = tz;

                // Scale
                const scale = (type === 'pyramidal' ? 1.5 : 1.0) * firingScale;
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
            // Pyramidal Cell: Ellipsoidal Soma + Apical Dendrite + Basal Dendrites
            const vertices = [];
            const faces = [];

            // 1. Soma (Ellipsoid icosphere approx)
            const segments = 8;
            for (let i = 0; i <= segments; i++) {
                const lat = (i / segments) * Math.PI;
                const sinLat = Math.sin(lat);
                const cosLat = Math.cos(lat);
                for (let j = 0; j <= segments; j++) {
                    const lon = (j / segments) * 2 * Math.PI;
                    const rx = 8 * sinLat * Math.cos(lon);
                    const ry = 10 * cosLat;
                    const rz = 8 * sinLat * Math.sin(lon);
                    const len = Math.sqrt(rx * rx + ry * ry + rz * rz);
                    vertices.push({ x: rx, y: ry, z: rz, nx: rx / len, ny: ry / len, nz: rz / len });
                }
            }
            for (let i = 0; i < segments; i++) {
                for (let j = 0; j < segments; j++) {
                    const first = i * (segments + 1) + j;
                    const second = first + segments + 1;
                    faces.push([first, second, first + 1]);
                    faces.push([second, second + 1, first + 1]);
                }
            }

            // 2. Apical Dendrite (Tapered cylinder pointing up)
            const apicalOffset = vertices.length;
            const apicalHeight = 40;
            const apicalSteps = 4;
            for (let i = 0; i <= apicalSteps; i++) {
                const y = 10 + (i / apicalSteps) * apicalHeight;
                const r = 3 * (1 - (i / apicalSteps) * 0.7);
                for (let j = 0; j < 6; j++) {
                    const angle = (j / 6) * 2 * Math.PI;
                    const x = Math.cos(angle) * r;
                    const z = Math.sin(angle) * r;
                    vertices.push({ x, y, z, nx: x / r, ny: 0, nz: z / r });
                }
            }
            for (let i = 0; i < apicalSteps; i++) {
                for (let j = 0; j < 6; j++) {
                    const first = apicalOffset + i * 6 + j;
                    const second = apicalOffset + (i + 1) * 6 + j;
                    const nextJ = (j + 1) % 6;
                    faces.push([first, second, apicalOffset + i * 6 + nextJ]);
                    faces.push([second, apicalOffset + (i + 1) * 6 + nextJ, apicalOffset + i * 6 + nextJ]);
                }
            }

            // 3. Basal Dendrites (A few short radiating branches at the bottom)
            for (let b = 0; b < 3; b++) {
                const basalOffset = vertices.length;
                const angle = (b / 3) * 2 * Math.PI;
                const dirX = Math.cos(angle);
                const dirZ = Math.sin(angle);
                const basalLength = 15;
                for (let i = 0; i <= 2; i++) {
                    const t = i / 2;
                    const dist = t * basalLength;
                    const r = 2 * (1 - t * 0.5);
                    const y = -10 - t * 5;
                    const centerX = dirX * dist;
                    const centerZ = dirZ * dist;
                    for (let j = 0; j < 4; j++) {
                        const a = (j / 4) * 2 * Math.PI;
                        const x = centerX + Math.cos(a) * r;
                        const z = centerZ + Math.sin(a) * r;
                        vertices.push({ x, y, z, nx: (x - centerX) / r, ny: 0, nz: (z - centerZ) / r });
                    }
                }
                for (let i = 0; i < 2; i++) {
                    for (let j = 0; j < 4; j++) {
                        const first = basalOffset + i * 4 + j;
                        const second = basalOffset + (i + 1) * 4 + j;
                        const nextJ = (j + 1) % 4;
                        faces.push([first, second, basalOffset + i * 4 + nextJ]);
                        faces.push([second, basalOffset + (i + 1) * 4 + nextJ, basalOffset + i * 4 + nextJ]);
                    }
                }
            }

            return { vertices, faces };
        },

        generateStellateMesh() {
            // Stellate Cell: Spherical Soma + Symmetric Radiating Dendrites
            const vertices = [];
            const faces = [];

            // 1. Soma
            const segments = 8;
            const radius = 6;
            for (let i = 0; i <= segments; i++) {
                const lat = (i / segments) * Math.PI;
                const sinLat = Math.sin(lat);
                const cosLat = Math.cos(lat);
                for (let j = 0; j <= segments; j++) {
                    const lon = (j / segments) * 2 * Math.PI;
                    const x = radius * sinLat * Math.cos(lon);
                    const y = radius * cosLat;
                    const z = radius * sinLat * Math.sin(lon);
                    vertices.push({ x, y, z, nx: x / radius, ny: y / radius, nz: z / radius });
                }
            }
            for (let i = 0; i < segments; i++) {
                for (let j = 0; j < segments; j++) {
                    const first = i * (segments + 1) + j;
                    const second = first + segments + 1;
                    faces.push([first, second, first + 1]);
                    faces.push([second, second + 1, first + 1]);
                }
            }

            // 2. Symmetric Dendrites (6 radiating branches)
            const dendriteDirs = [
                { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
                { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }
            ];

            dendriteDirs.forEach(dir => {
                const offset = vertices.length;
                const length = 20;
                for (let i = 0; i <= 2; i++) {
                    const t = i / 2;
                    const dist = radius + t * length;
                    const r = 2 * (1 - t * 0.7);
                    const centerX = dir.x * dist;
                    const centerY = dir.y * dist;
                    const centerZ = dir.z * dist;

                    // Perpendicular vectors for ring
                    let ux = 0, uy = 1, uz = 0;
                    if (Math.abs(dir.y) > 0.9) { ux = 1; uy = 0; }
                    let bx = dir.y * uz - dir.z * uy;
                    let by = dir.z * ux - dir.x * uz;
                    let bz = dir.x * uy - dir.y * ux;
                    const bLen = Math.sqrt(bx * bx + by * by + bz * bz);
                    if (bLen > 0) {
                        bx /= bLen; by /= bLen; bz /= bLen;
                    }
                    let nx = by * dir.z - bz * dir.y;
                    let ny = bz * dir.x - bx * dir.z;
                    let nz = bx * dir.y - by * dir.x;

                    for (let j = 0; j < 4; j++) {
                        const a = (j / 4) * 2 * Math.PI;
                        const vx = centerX + (nx * Math.cos(a) + bx * Math.sin(a)) * r;
                        const vy = centerY + (ny * Math.cos(a) + by * Math.sin(a)) * r;
                        const vz = centerZ + (nz * Math.cos(a) + bz * Math.sin(a)) * r;
                        vertices.push({ x: vx, y: vy, z: vz, nx: (vx - centerX) / r, ny: (vy - centerY) / r, nz: (vz - centerZ) / r });
                    }
                }
                for (let i = 0; i < 2; i++) {
                    for (let j = 0; j < 4; j++) {
                        const first = offset + i * 4 + j;
                        const second = offset + (i + 1) * 4 + j;
                        const nextJ = (j + 1) % 4;
                        faces.push([first, second, offset + i * 4 + nextJ]);
                        faces.push([second, offset + (i + 1) * 4 + nextJ, offset + i * 4 + nextJ]);
                    }
                }
            });

            return { vertices, faces };
        },
    };

    window.GreenhouseNeuroNeuron = GreenhouseNeuroNeuron;
})();
