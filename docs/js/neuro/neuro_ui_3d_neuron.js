(function () {
    'use strict';

    const GreenhouseNeuroNeuron = {
        neuronMeshes: {},

        drawNeuron(ctx, neuron, camera, projection, colorOverride, pulseFreq = 0.005) {
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
                    ? this.generatePyramidalMesh(lod)
                    : this.generateStellateMesh(lod);
            }
            const mesh = this.neuronMeshes[meshKey];

            const now = Date.now();
            const activation = Math.max(0, Math.min(1, neuron.activationLevel ?? neuron.activation ?? 0));
            const neuronSeed = String(neuron.id ?? `${neuron.x}_${neuron.y}_${neuron.z}`)
                .split('')
                .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
            const firingOsc = Math.max(0, Math.sin(now * 0.02 + neuronSeed * 0.01));
            const firingPulse = (neuron.isFiring || activation > 0.85) ? firingOsc * 0.12 : 0;
            const membraneDisplacement = activation * 0.8;

            const rotX = neuron.x * 0.01;
            const rotY = neuron.y * 0.01 + now * (pulseFreq * 0.1);
            const rotZ = neuron.z * 0.01;

            const transformedVertices = mesh.vertices.map((v) => {
                let x = v.x;
                let y = v.y;
                let z = v.z;

                if (v.isSoma) {
                    const flicker = Math.sin((x * 0.35 + y * 0.25 + z * 0.3) + now * 0.012 + neuronSeed * 0.02);
                    const bump = 1 + membraneDisplacement * 0.06 * flicker + firingPulse;
                    x *= bump;
                    y *= bump;
                    z *= bump;
                }

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
                ctx.beginPath();
                ctx.moveTo(v1.x, v1.y);
                ctx.lineTo(v2.x, v2.y);
                ctx.lineTo(v3.x, v3.y);
                ctx.fill();
            });
        },

        drawLODIcon(ctx, p, neuron, type, colorOverride) {
            const alpha = GreenhouseModels3DMath.applyDepthFog(1, p.depth);
            const radius = Math.max(1.2, neuron.radius * p.scale * 0.9);
            const stroke = colorOverride || neuron.baseColor || '#dbeafe';

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.lineWidth = Math.max(1, p.scale * 1.5);
            ctx.strokeStyle = stroke;
            ctx.fillStyle = 'rgba(255,255,255,0.14)';

            if (type === 'pyramidal') {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y - radius * 1.6);
                ctx.lineTo(p.x + radius * 1.35, p.y + radius * 1.2);
                ctx.lineTo(p.x - radius * 1.35, p.y + radius * 1.2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                const rays = 6;
                for (let i = 0; i < rays; i++) {
                    const angle = (i / rays) * Math.PI * 2;
                    const x1 = p.x + Math.cos(angle) * radius;
                    const y1 = p.y + Math.sin(angle) * radius;
                    const x2 = p.x + Math.cos(angle) * radius * 1.8;
                    const y2 = p.y + Math.sin(angle) * radius * 1.8;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
            }

            ctx.restore();
        },

        appendSphere(vertices, faces, center, radius, latBands = 8, lonBands = 8) {
            const base = vertices.length;
            for (let lat = 0; lat <= latBands; lat++) {
                const theta = (lat / latBands) * Math.PI;
                const sinT = Math.sin(theta);
                const cosT = Math.cos(theta);
                for (let lon = 0; lon <= lonBands; lon++) {
                    const phi = (lon / lonBands) * Math.PI * 2;
                    vertices.push({
                        x: center.x + radius * Math.cos(phi) * sinT,
                        y: center.y + radius * cosT,
                        z: center.z + radius * Math.sin(phi) * sinT,
                        isSoma: true
                    });
                }
            }
            for (let lat = 0; lat < latBands; lat++) {
                for (let lon = 0; lon < lonBands; lon++) {
                    const row = lonBands + 1;
                    const a = base + lat * row + lon;
                    const b = a + row;
                    faces.push([a, b, a + 1]);
                    faces.push([b, b + 1, a + 1]);
                }
            }
        },

        appendTaperedBranch(vertices, faces, start, end, rStart, rEnd, segments = 6) {
            const base = vertices.length;
            let tx = end.x - start.x;
            let ty = end.y - start.y;
            let tz = end.z - start.z;
            const tLen = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1;
            tx /= tLen; ty /= tLen; tz /= tLen;

            let ux = 0, uy = 1, uz = 0;
            if (Math.abs(ty) > 0.9) { ux = 1; uy = 0; uz = 0; }

            let bx = ty * uz - tz * uy;
            let by = tz * ux - tx * uz;
            let bz = tx * uy - ty * ux;
            const bLen = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
            bx /= bLen; by /= bLen; bz /= bLen;

            let nx = by * tz - bz * ty;
            let ny = bz * tx - bx * tz;
            let nz = bx * ty - by * tx;

            const rings = [
                { p: start, r: rStart },
                { p: end, r: rEnd }
            ];

            rings.forEach(ring => {
                for (let i = 0; i < segments; i++) {
                    const th = (i / segments) * Math.PI * 2;
                    const cos = Math.cos(th);
                    const sin = Math.sin(th);
                    vertices.push({
                        x: ring.p.x + ring.r * (nx * cos + bx * sin),
                        y: ring.p.y + ring.r * (ny * cos + by * sin),
                        z: ring.p.z + ring.r * (nz * cos + bz * sin),
                        isSoma: false
                    });
                }
            });

            for (let i = 0; i < segments; i++) {
                const a = base + i;
                const b = base + (i + 1) % segments;
                const c = base + segments + (i + 1) % segments;
                const d = base + segments + i;
                faces.push([a, b, c]);
                faces.push([a, c, d]);
            }
        },

        generatePyramidalMesh(lod = 2) {
            const vertices = [];
            const faces = [];

            this.appendSphere(vertices, faces, { x: 0, y: 0, z: 0 }, lod === 1 ? 5.5 : 7.5, lod === 1 ? 5 : 8, lod === 1 ? 5 : 8);

            const apicalEnd = { x: 0, y: lod === 1 ? 18 : 42, z: 0 };
            this.appendTaperedBranch(vertices, faces, { x: 0, y: 7, z: 0 }, apicalEnd, 1.8, 0.8, 6);

            if (lod >= 2) {
                const basalEnds = [
                    { x: 16, y: -5, z: 10 }, { x: -17, y: -4, z: 8 }, { x: 10, y: -6, z: -16 }, { x: -11, y: -5, z: -15 }
                ];
                basalEnds.forEach((end, idx) => {
                    const root = { x: end.x * 0.25, y: -2, z: end.z * 0.25 };
                    this.appendTaperedBranch(vertices, faces, root, end, 1.6, 0.75, 6);

                    const forkA = { x: end.x + (idx % 2 ? -7 : 7), y: end.y + 7, z: end.z + 5 };
                    const forkB = { x: end.x + (idx % 2 ? 6 : -6), y: end.y + 5, z: end.z - 6 };
                    this.appendTaperedBranch(vertices, faces, end, forkA, 0.75, 0.45, 5);
                    this.appendTaperedBranch(vertices, faces, end, forkB, 0.75, 0.45, 5);
                });

                this.appendTaperedBranch(vertices, faces, { x: 0, y: -6.5, z: 0 }, { x: 0, y: -20, z: 0 }, 1.5, 0.4, 5);
            }

            return { vertices, faces };
        },

        generateStellateMesh(lod = 2) {
            const vertices = [];
            const faces = [];

            this.appendSphere(vertices, faces, { x: 0, y: 0, z: 0 }, lod === 1 ? 5 : 6.2, lod === 1 ? 5 : 7, lod === 1 ? 5 : 7);

            const primary = lod === 1
                ? [{ x: 0, y: 18, z: 0 }]
                : [
                    { x: 0, y: 22, z: 0 }, { x: 0, y: -22, z: 0 }, { x: 20, y: 2, z: 0 }, { x: -20, y: -1, z: 0 },
                    { x: 0, y: 3, z: 20 }, { x: 0, y: -3, z: -20 }, { x: 14, y: 14, z: -10 }, { x: -14, y: -13, z: 10 }
                ];

            primary.forEach((end) => {
                const start = { x: end.x * 0.2, y: end.y * 0.2, z: end.z * 0.2 };
                this.appendTaperedBranch(vertices, faces, start, end, 1.4, 0.55, 5);

                if (lod >= 2) {
                    const spineA = { x: end.x + 2.5, y: end.y + 1.5, z: end.z };
                    const spineB = { x: end.x - 2.2, y: end.y - 1.1, z: end.z + 1.8 };
                    const spineC = { x: end.x, y: end.y + 1.8, z: end.z - 2.4 };
                    this.appendSphere(vertices, faces, spineA, 1.1, 4, 4);
                    this.appendSphere(vertices, faces, spineB, 1.0, 4, 4);
                    this.appendSphere(vertices, faces, spineC, 1.0, 4, 4);
                }
            });

            return { vertices, faces };
        }
    };

    window.GreenhouseNeuroNeuron = GreenhouseNeuroNeuron;
})();
