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

            // LOD 0: Low Detail (2D Shape-Coded Icon) for very distant neurons
            if (p.scale < 0.3) {
                const alpha = GreenhouseModels3DMath.applyDepthFog(0.8, p.depth);
                ctx.save();
                ctx.globalAlpha = alpha;
                // Standardized color for premium look, using shape-coding for identity
                ctx.fillStyle = colorOverride || '#E0E0E0';
                ctx.beginPath();
                if (type === 'pyramidal') {
                    // Triangle Icon
                    ctx.moveTo(p.x, p.y - 5 * p.scale);
                    ctx.lineTo(p.x + 5 * p.scale, p.y + 5 * p.scale);
                    ctx.lineTo(p.x - 5 * p.scale, p.y + 5 * p.scale);
                    ctx.closePath();
                } else {
                    // Circle with radiating lines icon
                    ctx.arc(p.x, p.y, 4 * p.scale, 0, Math.PI * 2);
                    for (let i = 0; i < 6; i++) {
                        const angle = (i / 6) * Math.PI * 2;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p.x + Math.cos(angle) * 7 * p.scale, p.y + Math.sin(angle) * 7 * p.scale);
                    }
                }
                ctx.fill();
                if (type === 'stellate') ctx.stroke();
                ctx.restore();
                return;
            }

            // LOD 1: Simple Mesh for medium distance
            if (p.scale < 0.6) {
                // Keep original simple mesh logic but use LOD-specific meshes
                const meshKey = `${type}_lod1`;
                if (!this.neuronMeshes[meshKey]) {
                    this.neuronMeshes[meshKey] = type === 'pyramidal' ? this.generatePyramidalMesh(1) : this.generateStellateMesh(1);
                }
                this.drawMesh(ctx, neuron, this.neuronMeshes[meshKey], camera, projection, colorOverride, pulseFreq, p.scale);
                return;
            }

            // LOD 2: High Detail 3D Mesh
            const meshKey = `${type}_lod2`;
            if (!this.neuronMeshes[meshKey]) {
                this.neuronMeshes[meshKey] = type === 'pyramidal' ? this.generatePyramidalMesh(2) : this.generateStellateMesh(2);
            }
            this.drawMesh(ctx, neuron, this.neuronMeshes[meshKey], camera, projection, colorOverride, pulseFreq, p.scale);
        },

        drawMesh(ctx, neuron, mesh, camera, projection, colorOverride, pulseFreq, centerScale) {
            const now = Date.now();
            const activation = neuron.activation || 0;
            const isFiring = neuron.firingTime && (now - neuron.firingTime < 200);
            const volumeScale = isFiring ? 1.1 : 1.0;

            const rotX = neuron.x * 0.01;
            const rotY = neuron.y * 0.01 + now * (pulseFreq * 0.1);

            const transformedVertices = mesh.vertices.map(v => {
                let x = v.x, y = v.y, z = v.z;
                if (activation > 0.5 && v.isSoma) {
                    const disp = Math.sin(v.x * 0.5 + v.y * 0.5 + now * 0.01) * activation * 1.5;
                    x += v.nx * disp; y += v.ny * disp; z += v.nz * disp;
                }
                if (isFiring && v.isSoma) { x *= volumeScale; y *= volumeScale; z *= volumeScale; }

                let tx = x * Math.cos(rotY) - z * Math.sin(rotY);
                let tz = x * Math.sin(rotY) + z * Math.cos(rotY);
                x = tx; z = tz;
                let ty = y * Math.cos(rotX) - z * Math.sin(rotX);
                tz = y * Math.sin(rotX) + z * Math.cos(rotX);
                y = ty; z = tz;

                const globalScale = (mesh.type === 'pyramidal') ? 1.2 : 1.0;
                return { x: x * globalScale + neuron.x, y: y * globalScale + neuron.y, z: z * globalScale + neuron.z };
            });

            const projected = transformedVertices.map(v => GreenhouseModels3DMath.project3DTo2D(v.x, v.y, v.z, camera, projection));

            const facesWithDepth = mesh.faces.map(face => {
                const v1 = projected[face[0]], v2 = projected[face[1]], v3 = projected[face[2]];
                if (v1 && v2 && v3 && v1.scale > 0 && v2.scale > 0 && v3.scale > 0) {
                    return { face, depth: (v1.depth + v2.depth + v3.depth) / 3, vertices: [v1, v2, v3], origVertices: [transformedVertices[face[0]], transformedVertices[face[1]], transformedVertices[face[2]]] };
                }
                return null;
            }).filter(f => f !== null).sort((a, b) => b.depth - a.depth);

            const lightDir = { x: 0.5, y: -0.5, z: 1 };
            const len = Math.sqrt(lightDir.x ** 2 + lightDir.y ** 2 + lightDir.z ** 2);
            lightDir.x /= len; lightDir.y /= len; lightDir.z /= len;

            facesWithDepth.forEach(({ vertices, origVertices, depth }) => {
                const [v1, v2, v3] = vertices;
                const [ov1, ov2, ov3] = origVertices;
                const alpha = GreenhouseModels3DMath.applyDepthFog(1, depth);
                if ((v2.x - v1.x) * (v3.y - v1.y) - (v2.y - v1.y) * (v3.x - v1.x) > 0) {
                    const ux = ov2.x - ov1.x, uy = ov2.y - ov1.y, uz = ov2.z - ov1.z;
                    const vx = ov3.x - ov1.x, vy = ov3.y - ov1.y, vz = ov3.z - ov1.z;
                    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
                    const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
                    let intensity = 0.4;
                    if (nLen > 0) { nx /= nLen; ny /= nLen; nz /= nLen; intensity += Math.max(0, nx * lightDir.x + ny * lightDir.y + nz * lightDir.z) * 0.6; }

                    const colorStr = (typeof colorOverride === 'string') ? colorOverride : '#E0E0E0';
                    const colorMatch = colorStr.match(/#([0-9a-f]{6})/i);
                    let r = 255, g = 255, b = 255;
                    if (colorMatch) { const hex = parseInt(colorMatch[1], 16); r = (hex >> 16) & 255; g = (hex >> 8) & 255; b = hex & 255; }
                    ctx.fillStyle = `rgba(${Math.min(255, r * intensity)}, ${Math.min(255, g * intensity)}, ${Math.min(255, b * intensity)}, ${alpha})`;
                    ctx.beginPath(); ctx.moveTo(v1.x, v1.y); ctx.lineTo(v2.x, v2.y); ctx.lineTo(v3.x, v3.y); ctx.fill();
                }
            });
        },

        generatePyramidalMesh(lod) {
            const vertices = []; const faces = [];
            const segments = lod === 2 ? 12 : 6, r = 8;
            for (let i = 0; i <= segments; i++) {
                const lat = (i / segments) * Math.PI;
                for (let j = 0; j <= segments; j++) {
                    const lon = (j / segments) * 2 * Math.PI;
                    const x = r * Math.sin(lat) * Math.cos(lon) * 0.8, y = r * Math.cos(lat) * 1.2, z = r * Math.sin(lat) * Math.sin(lon) * 0.8;
                    vertices.push({ x, y, z, nx: x / r, ny: y / r, nz: z / r, isSoma: true });
                }
            }
            for (let i = 0; i < segments; i++) {
                for (let j = 0; j < segments; j++) {
                    const first = i * (segments + 1) + j, second = first + segments + 1;
                    faces.push([first, second, first + 1], [second, second + 1, first + 1]);
                }
            }
            if (lod > 1) {
                this.addTaperedCylinder(vertices, faces, { x: 0, y: r * 1.2, z: 0 }, { x: 0, y: r * 1.2 + 40, z: 0 }, 2.5, 0.5, 6);
                for (let i = 0; i < 3; i++) {
                    const angle = (i / 3) * Math.PI * 2;
                    this.addTaperedCylinder(vertices, faces, { x: Math.cos(angle) * r * 0.6, y: -r * 0.8, z: Math.sin(angle) * r * 0.6 }, { x: Math.cos(angle) * 25, y: -r * 1.5, z: Math.sin(angle) * 25 }, 1.5, 0.3, 4);
                }
            }
            return { vertices, faces, type: 'pyramidal' };
        },

        generateStellateMesh(lod) {
            const vertices = []; const faces = [];
            const segments = lod === 2 ? 10 : 6, r = 6;
            for (let i = 0; i <= segments; i++) {
                const lat = (i / segments) * Math.PI;
                for (let j = 0; j <= segments; j++) {
                    const lon = (j / segments) * 2 * Math.PI;
                    const x = r * Math.sin(lat) * Math.cos(lon), y = r * Math.cos(lat), z = r * Math.sin(lat) * Math.sin(lon);
                    vertices.push({ x, y, z, nx: x / r, ny: y / r, nz: z / r, isSoma: true });
                }
            }
            for (let i = 0; i < segments; i++) {
                for (let j = 0; j < segments; j++) {
                    const first = i * (segments + 1) + j, second = first + segments + 1;
                    faces.push([first, second, first + 1], [second, second + 1, first + 1]);
                }
            }
            if (lod > 1) {
                for (let i = 0; i < 6; i++) {
                    const phi = Math.acos(-1 + (2 * i) / 6), theta = Math.sqrt(6 * Math.PI) * phi;
                    const dx = Math.sin(phi) * Math.cos(theta), dy = Math.sin(phi) * Math.sin(theta), dz = Math.cos(phi);
                    this.addTaperedCylinder(vertices, faces, { x: dx * r * 0.9, y: dy * r * 0.9, z: dz * r * 0.9 }, { x: dx * 25, y: dy * 25, z: dz * 25 }, 1.2, 0.4, 4);
                }
            }
            return { vertices, faces, type: 'stellate' };
        },

        addTaperedCylinder(vertices, faces, p1, p2, r1, r2, segments) {
            const baseIndex = vertices.length;
            const dy = p2.y - p1.y, len = Math.sqrt((p2.x - p1.x) ** 2 + dy ** 2 + (p2.z - p1.z) ** 2);
            let ux = 0, uy = 1, uz = 0; if (Math.abs(dy / len) > 0.9) ux = 1;
            let vx = dy * uz - (p2.z - p1.z) * uy, vy = (p2.z - p1.z) * ux - (p2.x - p1.x) * uz, vz = (p2.x - p1.x) * uy - dy * ux;
            const vlen = Math.sqrt(vx * vx + vy * vy + vz * vz); vx /= vlen; vy /= vlen; vz /= vlen;
            let wx = dy * vz - (p2.z - p1.z) * vy, wy = (p2.z - p1.z) * vx - (p2.x - p1.x) * vz, wz = (p2.x - p1.x) * vy - dy * vx;
            for (let i = 0; i <= 1; i++) {
                const p = i === 0 ? p1 : p2, r = i === 0 ? r1 : r2;
                for (let j = 0; j < segments; j++) {
                    const theta = (j / segments) * Math.PI * 2;
                    vertices.push({ x: p.x + r * (vx * Math.cos(theta) + wx * Math.sin(theta)), y: p.y + r * (vy * Math.cos(theta) + wy * Math.sin(theta)), z: p.z + r * (vz * Math.cos(theta) + wz * Math.sin(theta)), isSoma: false });
                }
            }
            for (let j = 0; j < segments; j++) {
                const nextJ = (j + 1) % segments;
                faces.push([baseIndex + j, baseIndex + nextJ, baseIndex + segments + nextJ], [baseIndex + j, baseIndex + segments + nextJ, baseIndex + segments + j]);
            }
        },
    };

    window.GreenhouseNeuroNeuron = GreenhouseNeuroNeuron;
})();
