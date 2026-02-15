/**
 * @file inflammation_geometry.js
 * @description Master-HD Brain Model specifically for Neuroinflammation.
 * Features realistic anatomical lobing and high-resolution smoothness.
 */

(function () {
    'use strict';

    const GreenhouseInflammationGeometry = {
        initializeBrainShell(brainShell) {
            console.log("Inflammation Geometry: Generating Ultra-Smooth Anatomical Model...");

            const baseRadius = 200;
            const latBands = 80;
            const lonBands = 80;

            brainShell.vertices = [];
            brainShell.faces = [];
            brainShell.regions = {
                hypothalamus: { name: 'Hypothalamus', color: 'rgba(255, 200, 50, 0.9)', vertices: [] },
                hippocampus: { name: 'Hippocampus', color: 'rgba(80, 240, 150, 0.7)', vertices: [] },
                thalamus: { name: 'Thalamus', color: 'rgba(230, 100, 255, 0.8)', vertices: [] },
                insula: { name: 'Insula', color: 'rgba(255, 120, 60, 0.7)', vertices: [] },
                basal_ganglia: { name: 'Basal Ganglia', color: 'rgba(80, 220, 220, 0.6)', vertices: [] },
                amygdala: { name: 'Amygdala', color: 'rgba(255, 0, 150, 0.8)', vertices: [] },
                frontal: { name: 'Frontal Lobe', color: 'rgba(255, 100, 100, 0.2)', vertices: [] },
                parietal: { name: 'Parietal Lobe', color: 'rgba(100, 255, 100, 0.2)', vertices: [] },
                temporal: { name: 'Temporal Lobe', color: 'rgba(100, 100, 255, 0.2)', vertices: [] },
                occipital: { name: 'Occipital Lobe', color: 'rgba(255, 255, 100, 0.2)', vertices: [] },
                cortex: { name: 'Cortex', color: 'rgba(180, 180, 200, 0.25)', vertices: [] }
            };

            for (let lat = 0; lat <= latBands; lat++) {
                const theta = (lat * Math.PI) / latBands;
                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);

                for (let lon = 0; lon <= lonBands; lon++) {
                    const phi = (lon * 2 * Math.PI) / lonBands;
                    const sinPhi = Math.sin(phi);
                    const cosPhi = Math.cos(phi);

                    let x = cosPhi * sinTheta;
                    let y = cosTheta;
                    let z = sinPhi * sinTheta;

                    const nx = x, ny = y, nz = z;

                    // Ovoid proportions
                    x *= 0.95; y *= 1.15; z *= 1.20;

                    // Broad Folds
                    const fissure = 1.0 - (Math.exp(-Math.abs(x) * 12) * 0.2);
                    const lobeScale = 1.0 + Math.sin(x * 3) * Math.cos(y * 3.5) * Math.sin(z * 3) * 0.08;
                    const sulci = 1.0 + Math.sin(x * 10) * Math.cos(z * 10) * 0.01;

                    const finalFactor = lobeScale * sulci * fissure;

                    let region = 'cortex';
                    let lobe = 'frontal';
                    let brodmann = null;

                    // Region Assignment
                    if (Math.abs(nx) < 0.2 && ny < 0.2 && ny > -0.1 && Math.abs(nz) < 0.2) region = 'thalamus';
                    else if (Math.abs(nx) < 0.18 && ny <= -0.1 && ny > -0.3 && Math.abs(nz) < 0.18) region = 'hypothalamus';
                    else if (Math.abs(nx) > 0.2 && Math.abs(nx) < 0.4 && ny < 0.15 && ny > -0.2 && Math.abs(nz) < 0.3) region = 'basal_ganglia';
                    else if (Math.abs(nx) > 0.45 && ny < 0.1 && ny > -0.3 && nz > -0.1 && nz < 0.25) region = 'insula';
                    else if (Math.abs(nx) > 0.35 && ny < 0.0 && ny > -0.35 && nz < -0.2 && nz > -0.5) region = 'hippocampus';
                    else if (Math.abs(nx) > 0.3 && ny < -0.3 && ny > -0.5 && nz < -0.1 && nz > -0.3) region = 'amygdala';

                    // Lobe Assignment
                    if (nz > 0.3) lobe = 'frontal';
                    else if (nz < -0.6) lobe = 'occipital';
                    else if (ny > 0.2) lobe = 'parietal';
                    else if (Math.abs(nx) > 0.6) lobe = 'temporal';
                    else if (Math.abs(nx) < 0.3 && ny < 0.2 && ny > -0.2) lobe = 'insular';

                    // Brodmann Area Assignment (Simplified)
                    if (lobe === 'frontal' && nx > 0.1 && ny > 0.4) brodmann = 'BA9';
                    if (lobe === 'frontal' && Math.abs(nx) < 0.1 && ny < 0.3 && ny > 0.1) brodmann = 'BA24';

                    const vIdx = brainShell.vertices.length;

                    // Fixed smooth normals
                    const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
                    const normal = { x: nx / nLen, y: ny / nLen, z: nz / nLen };

                    brainShell.vertices.push({
                        x: x * baseRadius * finalFactor,
                        y: y * baseRadius * finalFactor,
                        z: z * baseRadius * finalFactor,
                        normal: normal,
                        region: region,
                        lobe: lobe,
                        brodmann: brodmann,
                        hemisphere: nx > 0 ? 'right' : 'left'
                    });

                    if (brainShell.regions[region]) {
                        brainShell.regions[region].vertices.push(vIdx);
                    }
                }
            }

            for (let lat = 0; lat < latBands; lat++) {
                for (let lon = 0; lon < lonBands; lon++) {
                    const first = lat * (lonBands + 1) + lon;
                    const second = first + lonBands + 1;
                    brainShell.faces.push({ indices: [first, second, first + 1], region: brainShell.vertices[first].region });
                    brainShell.faces.push({ indices: [second, second + 1, first + 1], region: brainShell.vertices[second].region });
                }
            }

            for (const key in brainShell.regions) {
                const reg = brainShell.regions[key];
                if (reg.vertices.length > 0) {
                    let cx = 0, cy = 0, cz = 0;
                    reg.vertices.forEach(idx => {
                        const v = brainShell.vertices[idx];
                        cx += v.x; cy += v.y; cz += v.z;
                    });
                    reg.centroid = { x: cx / reg.vertices.length, y: cy / reg.vertices.length, z: cz / reg.vertices.length };
                }
            }
        },

        generateSphere(radius, segments) {
            const vertices = [];
            const faces = [];
            for (let i = 0; i <= segments; i++) {
                const lat = (i / segments) * Math.PI;
                const sinLat = Math.sin(lat);
                const cosLat = Math.cos(lat);
                for (let j = 0; j <= segments; j++) {
                    const lon = (j / segments) * 2 * Math.PI;
                    const x = radius * sinLat * Math.cos(lon);
                    const y = radius * cosLat;
                    const z = radius * sinLat * Math.sin(lon);
                    vertices.push({ x, y, z, n: { x: x / radius, y: y / radius, z: z / radius } });
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
            return { vertices, faces };
        },

        generateMoleculeCluster(type, scale = 1.0) {
            const vertices = [];
            const faces = [];

            const atom = (x, y, z, color, r = 4) => {
                const s = this.generateSphere(r * scale, 6);
                const offset = vertices.length;
                s.vertices.forEach(v => {
                    vertices.push({ x: v.x + x * scale, y: v.y + y * scale, z: v.z + z * scale, color: color });
                });
                s.faces.forEach(f => {
                    faces.push([f[0] + offset, f[1] + offset, f[2] + offset]);
                });
            };

            // CPK Colors: C=#333, O=#ff4444, N=#4444ff, H=#eee
            if (type === 'pro-cytokine' || type === 'tnf') {
                atom(0, 12, 0, '#ff4444', 5); atom(0, 4, 0, '#333333', 6); atom(-6, -4, 4, '#4444ff', 5);
                atom(8, -8, 4, '#333333', 6); atom(14, -12, 8, '#ff4444', 5);
                atom(-8, -8, 4, '#333333', 6); atom(-14, -12, 8, '#ff4444', 5);
                atom(0, -2, 8, '#eee', 3);
            } else if (type === 'anti-cytokine' || type === 'il10') {
                atom(-10, 0, 0, '#44ffaa', 6); atom(-18, 5, 2, '#4444ff', 4); atom(-4, -5, -2, '#ff4444', 4);
                atom(10, 0, 0, '#44ffaa', 6); atom(18, -5, -2, '#4444ff', 4); atom(4, 5, 2, '#ff4444', 4);
            } else if (type === 'neurotransmitter') {
                atom(0, 0, 0, '#333', 5); atom(0, 10, 0, '#4444ff', 5); atom(8, -4, 0, '#ff4444', 5); atom(4, -8, 4, '#ff4444', 4);
            } else {
                atom(0, 0, 0, '#64d2ff', 4); atom(5, 5, 0, '#eee', 2); atom(-5, 5, 0, '#eee', 2);
            }
            return { vertices, faces };
        },

        generateLipidBilayerSegment(width, height, subdivisions) {
            const vertices = [];
            const faces = [];
            const stepX = width / subdivisions;
            const stepY = height / subdivisions;

            for (let i = 0; i <= subdivisions; i++) {
                for (let j = 0; j <= subdivisions; j++) {
                    const x = i * stepX - width / 2;
                    const y = j * stepY - height / 2;
                    const wave = Math.sin(x * 0.012 + y * 0.008) * 15;

                    const layers = [
                        { z: wave + 25, type: 'head', color: '#64d2ff' },
                        { z: wave + 10, type: 'tail', color: '#1a2a3a' },
                        { z: wave - 10, type: 'tail', color: '#1a2a3a' },
                        { z: wave - 25, type: 'head', color: '#64d2ff' }
                    ];

                    layers.forEach(l => {
                        vertices.push({ x, y, z: l.z, type: l.type, color: l.color });
                    });
                }
            }

            const row = subdivisions + 1;
            for (let i = 0; i < subdivisions; i++) {
                for (let j = 0; j < subdivisions; j++) {
                    const i0 = (i * row + j) * 4;
                    const i1 = (i * row + (j + 1)) * 4;
                    const i2 = ((i + 1) * row + (j + 1)) * 4;
                    const i3 = ((i + 1) * row + j) * 4;
                    [0, 1, 2, 3].forEach(off => {
                        faces.push([i0 + off, i1 + off, i2 + off]);
                        faces.push([i0 + off, i2 + off, i3 + off]);
                    });
                }
            }
            return { vertices, faces };
        },

        generateMastCellMesh(scale = 1.0) {
            const vertices = [];
            const faces = [];
            const somaRadius = 18 * scale;
            const soma = this.generateSphere(somaRadius, 12);
            vertices.push(...soma.vertices.map(v => ({ ...v, color: '#ffb6c1' }))); // Light Pink soma
            faces.push(...soma.faces);

            // Internal granules (hallmark of mast cells)
            for (let i = 0; i < 15; i++) {
                const r = somaRadius * 0.6;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                const x = r * Math.sin(phi) * Math.cos(theta);
                const y = r * Math.cos(phi);
                const z = r * Math.sin(phi) * Math.sin(theta);

                const granule = this.generateSphere(5 * scale, 6);
                const offset = vertices.length;
                vertices.push(...granule.vertices.map(v => ({
                    x: v.x + x, y: v.y + y, z: v.z + z, color: '#990033' // Deep purple/red granules
                })));
                granule.faces.forEach(f => faces.push([f[0] + offset, f[1] + offset, f[2] + offset]));
            }

            // Surface IgE Receptors
            for (let i = 0; i < 20; i++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                const x = somaRadius * Math.sin(phi) * Math.cos(theta);
                const y = somaRadius * Math.cos(phi);
                const z = somaRadius * Math.sin(phi) * Math.sin(theta);

                const receptor = this.generateSphere(2 * scale, 4);
                const offset = vertices.length;
                vertices.push(...receptor.vertices.map(v => ({
                    x: v.x + x, y: v.y + y, z: v.z + z, color: '#4169e1' // Royal Blue receptors
                })));
                receptor.faces.forEach(f => faces.push([f[0] + offset, f[1] + offset, f[2] + offset]));
            }
            return { vertices, faces };
        },

        generateGliaMesh(type, scale = 1.0) {
            const vertices = [];
            const faces = [];
            const isAstro = type === 'astrocyte';
            const branches = isAstro ? 16 : 10;
            const somaRadius = (isAstro ? 12 : 8) * scale;
            const soma = this.generateSphere(somaRadius, 10);

            // Astrocytes: Gold/Yellow; Microglia: Cyan/Blue-ish (Resting) or Red (Active)
            const baseColor = isAstro ? '#ffcc00' : '#4ca1af';
            vertices.push(...soma.vertices.map(v => ({ ...v, color: baseColor })));
            faces.push(...soma.faces);

            for (let i = 0; i < branches; i++) {
                const angle = (i / branches) * Math.PI * 2;
                const phi = (Math.random() - 0.5) * Math.PI;
                const p1 = { x: 0, y: 0, z: 0 };
                const p2 = {
                    x: Math.cos(angle) * Math.cos(phi) * 80 * scale,
                    y: Math.sin(phi) * 80 * scale,
                    z: Math.sin(angle) * Math.cos(phi) * 80 * scale
                };
                const cp = { x: p2.x * 0.5 + (Math.random() - 0.5) * 30, y: p2.y * 0.5 + (Math.random() - 0.5) * 30, z: p2.z * 0.5 };

                const hasEndfoot = isAstro && Math.random() > 0.6;
                const radius = (isAstro ? 3 : 2) * scale;
                const tube = this.generateTubeMesh(p1, p2, cp, radius, 6);
                const offset = vertices.length;
                vertices.push(...tube.vertices.map(v => ({ ...v, color: baseColor })));
                tube.faces.forEach(f => faces.push([f[0] + offset, f[1] + offset, f[2] + offset]));

                if (hasEndfoot) {
                    const foot = this.generateSphere(8 * scale, 6);
                    const fOffset = vertices.length;
                    vertices.push(...foot.vertices.map(v => ({
                        x: v.x + p2.x, y: v.y + p2.y, z: v.z + p2.z, color: '#ffea00'
                    })));
                    foot.faces.forEach(f => faces.push([f[0] + fOffset, f[1] + fOffset, f[2] + fOffset]));
                }
            }
            return { vertices, faces };
        },

        generateTubeMesh(p1, p2, cp, radius, segments) {
            const vertices = [];
            const faces = [];
            const steps = 10;
            const getPoint = (t) => {
                const mt = 1 - t;
                return {
                    x: mt * mt * p1.x + 2 * mt * t * cp.x + t * t * p2.x,
                    y: mt * mt * p1.y + 2 * mt * t * cp.y + t * t * p2.y,
                    z: mt * mt * p1.z + 2 * mt * t * cp.z + t * t * p2.z
                };
            };
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const p = getPoint(t);
                const nextP = getPoint(Math.min(1, t + 0.01));
                let tx = nextP.x - p.x, ty = nextP.y - p.y, tz = nextP.z - p.z;
                const len = Math.sqrt(tx * tx + ty * ty + tz * tz);
                tx /= len; ty /= len; tz /= len;
                let ux = 0, uy = 1, uz = 0;
                if (Math.abs(ty) > 0.9) { ux = 1; uy = 0; }
                let bx = ty * uz - tz * uy, by = tz * ux - tx * uz, bz = tx * uy - ty * ux;
                const bLen = Math.sqrt(bx * bx + by * by + bz * bz);
                bx /= bLen; by /= bLen; bz /= bLen;
                let nx = by * tz - bz * ty, ny = bz * tx - bx * tz, nz = bx * ty - by * tx;
                for (let j = 0; j < segments; j++) {
                    const theta = (j / segments) * Math.PI * 2;
                    const sin = Math.sin(theta), cos = Math.cos(theta);
                    vertices.push({ x: p.x + radius * (nx * cos + bx * sin), y: p.y + radius * (ny * cos + by * sin), z: p.z + radius * (nz * cos + bz * sin) });
                }
            }
            for (let i = 0; i < steps; i++) {
                for (let j = 0; j < segments; j++) {
                    const current = i * segments + j, next = current + segments, nextJ = (j + 1) % segments;
                    faces.push([current, i * segments + nextJ, (i + 1) * segments + nextJ]);
                    faces.push([current, (i + 1) * segments + nextJ, next]);
                }
            }
            return { vertices, faces };
        },

        createSynapseGeometry(radius, segments, type) {
            const vertices = [];
            const faces = [];
            for (let i = 0; i <= segments; i++) {
                const lat = (i / segments) * Math.PI, sinLat = Math.sin(lat), cosLat = Math.cos(lat);
                for (let j = 0; j <= segments; j++) {
                    const lon = (j / segments) * Math.PI * 2, sinLon = Math.sin(lon), cosLon = Math.cos(lon);
                    let r = radius;
                    if (type === 'pre') {
                        r *= 1.0 + Math.sin(lat * 3) * 0.1 + Math.cos(lon * 4) * 0.1;
                        if (cosLat < -0.5) r *= 0.8 + (cosLat + 0.5) * 0.2;
                        r += Math.sin(lat * 12) * Math.cos(lon * 12) * 0.5;
                    } else {
                        if (cosLat > 0) { r *= 1.2; if (cosLat > 0.8) r *= 0.9; }
                        else { const t = -cosLat; if (t > 0.3) r *= Math.max(0.3, 1.0 - (t - 0.3) * 2); }
                        r += Math.sin(lat * 8) * 0.5;
                    }
                    vertices.push({ x: r * sinLat * cosLon, y: r * cosLat, z: r * sinLat * sinLon });
                }
            }
            for (let i = 0; i < segments; i++) {
                for (let j = 0; j < segments; j++) {
                    const first = i * (segments + 1) + j, second = first + segments + 1;
                    faces.push([first, second, first + 1]); faces.push([second, second + 1, first + 1]);
                }
            }
            return { vertices, faces };
        }
    };

    window.GreenhouseInflammationGeometry = GreenhouseInflammationGeometry;
})();
