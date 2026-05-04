(function () {
    'use strict';

    const GreenhouseNeuroGeometry = {
        // Cache for expensive geometries
        cache: new Map(),

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

        generateBox(size) {
            const s = size / 2;
            const vertices = [
                { x: -s, y: -s, z: -s }, { x: s, y: -s, z: -s }, { x: s, y: s, z: -s }, { x: -s, y: s, z: -s },
                { x: -s, y: -s, z: s }, { x: s, y: -s, z: s }, { x: s, y: s, z: s }, { x: -s, y: s, z: s }
            ];
            const faces = [
                [0, 1, 2], [0, 2, 3], [4, 5, 6], [4, 6, 7],
                [0, 1, 5], [0, 5, 4], [2, 3, 7], [2, 7, 6],
                [0, 3, 7], [0, 7, 4], [1, 2, 6], [1, 6, 5]
            ];
            return { vertices, faces };
        },

        generateOctahedron(size) {
            const s = size;
            const vertices = [
                { x: s, y: 0, z: 0 }, { x: -s, y: 0, z: 0 }, { x: 0, y: s, z: 0 },
                { x: 0, y: -s, z: 0 }, { x: 0, y: 0, z: s }, { x: 0, y: 0, z: -s }
            ];
            const faces = [
                [0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2],
                [1, 2, 5], [1, 5, 3], [1, 3, 4], [1, 4, 2]
            ];
            return { vertices, faces };
        },

        generateMoleculeCluster(type, scale = 1.0) {
            const vertices = [];
            const faces = [];
            const centers = [];

            // Pro-inflammatory (TNF): Trimeric/Complex shape
            if (type === 'tnf' || type === 'pro-cytokine') {
                centers.push({ x: 0, y: 10, z: 0, color: '#ff4444' });
                centers.push({ x: -8, y: -5, z: 5, color: '#ff8844' });
                centers.push({ x: 8, y: -5, z: 5, color: '#ff8844' });
            } else if (type === 'il10' || type === 'anti-cytokine') {
                // IL-10: Dimeric/Oval shape
                centers.push({ x: -6, y: 0, z: 0, color: '#44ffaa' });
                centers.push({ x: 6, y: 0, z: 0, color: '#44ffaa' });
            } else {
                // Generic small cluster
                centers.push({ x: 0, y: 0, z: 0, color: '#ffffff' });
            }

            centers.forEach(c => {
                const s = this.generateSphere(5 * scale, 8);
                const offset = vertices.length;
                s.vertices.forEach(v => {
                    vertices.push({ x: v.x + c.x * scale, y: v.y + c.y * scale, z: v.z + c.z * scale, color: c.color });
                });
                s.faces.forEach(f => {
                    faces.push([f[0] + offset, f[1] + offset, f[2] + offset]);
                });
            });
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
                    const z = Math.sin(x * 0.02) * Math.cos(y * 0.02) * 5; // Slight wave

                    // Top Layer (Heads)
                    vertices.push({ x, y, z: z + 5, type: 'head' });
                    // Bottom Layer (Heads)
                    vertices.push({ x, y, z: z - 5, type: 'head' });
                }
            }

            for (let i = 0; i < subdivisions; i++) {
                for (let j = 0; j < subdivisions; j++) {
                    const row = subdivisions + 1;
                    const i0 = (i * row + j) * 2;
                    const i1 = (i * row + j + 1) * 2;
                    const i2 = ((i + 1) * row + j + 1) * 2;
                    const i3 = ((i + 1) * row + j) * 2;

                    // Top Faces
                    faces.push([i0, i1, i2]); faces.push([i0, i2, i3]);
                    // Bottom Faces
                    faces.push([i0 + 1, i3 + 1, i2 + 1]); faces.push([i0 + 1, i2 + 1, i1 + 1]);
                }
            }
            return { vertices, faces };
        },

        generateGliaMesh(type, scale = 1.0) {
            const vertices = [];
            const faces = [];
            const branches = type === 'astrocyte' ? 12 : 8;

            // Central Soma
            const soma = this.generateSphere(10 * scale, 8);
            vertices.push(...soma.vertices.map(v => ({ ...v, color: type === 'astrocyte' ? '#E0E0E0' : '#ff4444' })));
            faces.push(...soma.faces);

            // Processes (Dendrite-like branches)
            for (let i = 0; i < branches; i++) {
                const angle = (i / branches) * Math.PI * 2;
                const phi = (Math.random() - 0.5) * Math.PI;
                const p1 = { x: 0, y: 0, z: 0 };
                const p2 = {
                    x: Math.cos(angle) * Math.cos(phi) * 60 * scale,
                    y: Math.sin(phi) * 60 * scale,
                    z: Math.sin(angle) * Math.cos(phi) * 60 * scale
                };
                const cp = { x: p2.x * 0.5 + (Math.random() - 0.5) * 20, y: p2.y * 0.5 + (Math.random() - 0.5) * 20, z: p2.z * 0.5 };

                const tube = this.generateTubeMesh(p1, p2, cp, 2 * scale, 6);
                const offset = vertices.length;
                vertices.push(...tube.vertices.map(v => ({ ...v, color: type === 'astrocyte' ? '#E0E0E0' : '#ff6666' })));
                tube.faces.forEach(f => faces.push([f[0] + offset, f[1] + offset, f[2] + offset]));
            }
            return { vertices, faces };
        },

        inferRegionFromUnitPosition(x, y, z) {
            if (y < -0.5 && Math.abs(x) < 0.3 && Math.abs(z) < 0.3) return 'brainstem';
            if (y < -0.3 && z < -0.4) return 'cerebellum';
            if (z > 0.4 && y > -0.2) return 'pfc';
            if (z < -0.5 && y > -0.2) return 'occipitalLobe';
            if (y > 0.4 && z > -0.4 && z < 0.4) return 'parietalLobe';
            if (Math.abs(x) > 0.4 && y < 0.1 && z > -0.4 && z < 0.4) return 'temporalLobe';
            if (Math.abs(x) < 0.3 && Math.abs(y) < 0.3 && Math.abs(z) < 0.3) return 'amygdala';
            if (Math.abs(x) > 0.2 && Math.abs(x) < 0.5 && y < 0 && z > -0.2 && z < 0.2) return 'hippocampus';
            return null;
        },

        getRegionalSurfaceNoise(region, x, y, z) {
            switch (region) {
                case 'pfc':
                    return Math.sin(x * 18) * Math.cos(y * 18) * 0.02 + Math.sin(z * 26) * 0.012;
                case 'temporalLobe':
                    return Math.sin(z * 12) * Math.cos(x * 6) * 0.028 + Math.sin(y * 9) * 0.01;
                case 'occipitalLobe':
                    return Math.sin(y * 8) * Math.cos(z * 8) * 0.023;
                case 'parietalLobe':
                    return Math.sin(x * 14) * Math.cos(z * 14) * 0.022;
                case 'cerebellum':
                    return (Math.sin(z * 40) * 0.022) + (Math.sin(z * 20) * 0.018);
                case 'brainstem':
                    return Math.sin(y * 4) * 0.006;
                case 'hippocampus':
                    return Math.sin((x + z) * 16) * 0.016;
                case 'amygdala':
                    return Math.sin((x * x + y * y + z * z) * 10) * 0.012;
                default:
                    return Math.sin(x * 10) * Math.cos(y * 10) * Math.sin(z * 10) * 0.012;
            }
        },

        initializeBrainShell(brainShell) {
            // Use realistic brain mesh if available
            if (window.GreenhouseBrainMeshRealistic) {
                const realisticBrain = window.GreenhouseBrainMeshRealistic.generateRealisticBrain();
                brainShell.vertices = realisticBrain.vertices;
                // Convert faces to the new object structure to ensure compatibility
                brainShell.faces = realisticBrain.faces.map(face => ({ indices: face, region: null }));
                brainShell.regions = realisticBrain.regions;

                // Compute boundaries
                this.computeRegionsAndBoundaries(brainShell);
                return;
            }

            // Fallback to original sphere generation
            const radius = 200;
            const latitudeBands = 30;
            const longitudeBands = 30;

            for (let lat = 0; lat <= latitudeBands; lat++) {
                const theta = (lat * Math.PI) / latitudeBands;
                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);

                for (let lon = 0; lon <= longitudeBands; lon++) {
                    const phi = (lon * 2 * Math.PI) / longitudeBands;
                    const sinPhi = Math.sin(phi);
                    const cosPhi = Math.cos(phi);

                    let x = cosPhi * sinTheta;
                    let y = cosTheta;
                    let z = sinPhi * sinTheta;

                    // Apply Deformations for Brain Shape
                    // 1. Flatten bottom (less aggressive, more rounded)
                    if (y < -0.1) {
                        // Smooth taper instead of hard flatten
                        const t = (y + 0.1) / -0.9; // 0 to 1 roughly
                        y *= (1.0 - t * 0.2); // Only shrink by 20% max
                    }

                    // 2. Hemispheric Split (Longitudinal Fissure)
                    // Smooth indentation at x=0
                    const fissure = 1 - Math.exp(-Math.abs(x) * 5) * 0.3; // Smooth exponential dip
                    if (y > 0) y *= fissure; // Only affect top

                    // 3. Temporal Lobes (Bulge on sides) - "Smokey" Fix
                    // Use smooth radial bulge instead of hard box check
                    // Bulge around y=-0.2, x=+-0.6
                    const tempY = -0.2;
                    const tempX = 0.65;
                    const dy = y - tempY;
                    const dx = Math.abs(x) - tempX;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 0.5) {
                        const bulge = Math.cos(dist * Math.PI) * 0.5 + 0.5; // Smooth bell curve
                        x *= (1 + bulge * 0.3); // Gentle 30% bulge
                        z *= (1 + bulge * 0.2);
                    }

                    // 4. Cerebellum (Bulge at lower back)
                    if (y < -0.3 && z < -0.4) {
                        const dist = Math.sqrt(x * x + (y + 0.5) * (y + 0.5) + (z + 0.6) * (z + 0.6));
                        if (dist < 0.5) {
                            const bulge = 1 + (0.5 - dist) * 0.6; // Reduced bulge
                            x *= bulge;
                            y *= bulge;
                            z *= bulge;
                        }
                    }

                    // 5. Gyri/Sulci Noise (The brain surface 'wrinkles')
                    // Regional Morphological Variations
                    let freq = 12;
                    let amp = 0.03;

                    // Approximate region check for noise variance
                    if (y < -0.3 && z < -0.4) { // Cerebellum area
                        freq = 40; amp = 0.015; // Denser, finer folds
                    } else if (z > 0.4) { // PFC area
                        freq = 15; amp = 0.04;  // Deeper, more pronounced
                    } else if (Math.abs(x) > 0.6) { // Temporal
                        freq = 8; amp = 0.025;  // Wider, smoother
                    }

                    const noise = (Math.sin(x * freq) * Math.cos(y * freq) * Math.sin(z * freq)) * amp +
                        (Math.sin(x * freq * 2) * Math.cos(y * freq * 2)) * (amp * 0.3);

                    x = x * radius * (1 + noise);
                    y = y * radius * (1 + noise);
                    z = z * radius * (1 + noise);

                    // Compute Normal
                    const len = Math.sqrt(x * x + y * y + z * z);
                    const normal = len > 0 ? 1.0 / len : 0; // Approx normal is just position for sphere

                    // Texture coordinate (UV)
                    const u = 1 - (lon / longitudeBands);
                    const v = 1 - (lat / latitudeBands);

                    // Add Gyri Texture (Visual only, affects lighting)
                    // We can bake this into the normal or color later
                    let texture = 0;
                    if (window.GreenhouseModels3DMath && window.GreenhouseModels3DMath.noise) {
                        // If we had a noise function...
                    } else {
                        // Simple procedural texture
                        texture = (Math.sin(x * 0.1) + Math.cos(y * 0.1) + Math.sin(z * 0.1)) * 0.5 + 0.5;
                    }

                    // Apply texture to geometry (displacement mapping)
                    if (texture > 0.6) {
                        const disp = (texture - 0.6) * 5;
                        x += (x / len) * disp;
                        y += (y / len) * disp;
                        z += (z / len) * disp;
                    }

                    brainShell.vertices.push({ x, y, z });
                }
            }

            // Generate faces (triangles)
            for (let lat = 0; lat < latitudeBands; lat++) {
                for (let lon = 0; lon < longitudeBands; lon++) {
                    const first = lat * (longitudeBands + 1) + lon;
                    const second = first + longitudeBands + 1;

                    // Two triangles per quad
                    brainShell.faces.push({ indices: [first, second, first + 1], region: null });
                    brainShell.faces.push({ indices: [second, second + 1, first + 1], region: null });
                }
            }

            // Define Regions
            brainShell.regions = {
                pfc: {
                    color: 'rgba(160, 174, 192, 0.6)',
                    vertices: this.getRegionVertices(brainShell, 'pfc')
                },
                amygdala: {
                    color: 'rgba(255, 159, 67, 0.6)',
                    vertices: this.getRegionVertices(brainShell, 'amygdala')
                },
                hippocampus: {
                    color: 'rgba(79, 209, 197, 0.6)',
                    vertices: this.getRegionVertices(brainShell, 'hippocampus')
                },
                temporalLobe: {
                    color: 'rgba(160, 174, 192, 0.6)',
                    vertices: this.getRegionVertices(brainShell, 'temporalLobe')
                },
                parietalLobe: {
                    color: 'rgba(160, 174, 192, 0.6)',
                    vertices: this.getRegionVertices(brainShell, 'parietalLobe')
                },
                occipitalLobe: {
                    color: 'rgba(160, 174, 192, 0.6)',
                    vertices: this.getRegionVertices(brainShell, 'occipitalLobe')
                },
                cerebellum: {
                    color: 'rgba(160, 174, 192, 0.6)',
                    vertices: this.getRegionVertices(brainShell, 'cerebellum')
                },
                brainstem: {
                    color: 'rgba(160, 174, 192, 0.6)',
                    vertices: this.getRegionVertices(brainShell, 'brainstem')
                }
            };

            // Define topological cut planes for smooth boundary rendering
            brainShell.regionalPlanes = [
                { axis: 'z', value: 0.4, label: 'Frontal' },   // PFC
                { axis: 'z', value: -0.5, label: 'Occipital' }, // Occipital
                { axis: 'y', value: 0.4, label: 'Parietal' },  // Parietal
                { axis: 'y', value: -0.3, label: 'Lower' },    // Cerebellum
                { axis: 'y', value: -0.2, label: 'Base' },     // Middle split
                { axis: 'y', value: 0.1, label: 'Temporal-Top' },
                { axis: 'x', value: 0.4, label: 'Temporal R' },
                { axis: 'x', value: -0.4, label: 'Temporal L' }
            ];

            // Pre-calculate Regions and Boundaries
            this.computeRegionsAndBoundaries(brainShell);
        },

        updateMesh(geometry, time, state = {}) {
            if (!geometry || !Array.isArray(geometry.vertices)) return geometry;
            const load = Math.max(0, Math.min(1, state.cognitiveLoad ?? state.load ?? 0));
            const tension = Math.max(0, Math.min(1, state.tension ?? 0));

            geometry.vertices.forEach((v, idx) => {
                if (v.baseX === undefined) {
                    v.baseX = v.x;
                    v.baseY = v.y;
                    v.baseZ = v.z;
                }
                const regionNoise = this.getRegionalSurfaceNoise(v.region, v.baseX / 200, v.baseY / 200, v.baseZ / 200);
                const osc = Math.sin(time * 0.0018 + idx * 0.13) * (0.8 + load);
                const displacement = regionNoise * (3.2 + load * 4.5) + osc * tension * 0.9;
                const len = Math.sqrt(v.baseX * v.baseX + v.baseY * v.baseY + v.baseZ * v.baseZ) || 1;
                v.x = v.baseX + (v.baseX / len) * displacement;
                v.y = v.baseY + (v.baseY / len) * displacement;
                v.z = v.baseZ + (v.baseZ / len) * displacement;
            });

            return geometry;
        },

        getRegionVertices(brainShell, regionKey) {
            const indices = [];
            brainShell.vertices.forEach((v, i) => {
                let match = false;
                // Normalize coords for region checking
                const x = v.x / 200;
                const y = v.y / 200;
                const z = v.z / 200;

                switch (regionKey) {
                    case 'pfc': // Front
                        if (z > 0.4 && y > -0.2) match = true;
                        break;
                    case 'occipitalLobe': // Back
                        if (z < -0.5 && y > -0.2) match = true;
                        break;
                    case 'temporalLobe': // Sides
                        if (Math.abs(x) > 0.4 && y < 0.1 && z > -0.4 && z < 0.4) match = true;
                        break;
                    case 'parietalLobe': // Top
                        if (y > 0.4 && z > -0.4 && z < 0.4) match = true;
                        break;
                    case 'cerebellum': // Lower Back
                        if (y < -0.3 && z < -0.4) match = true;
                        break;
                    case 'brainstem': // Bottom Center
                        if (y < -0.5 && Math.abs(x) < 0.3 && Math.abs(z) < 0.3) match = true;
                        break;
                    case 'amygdala': // Deep Center (Approx)
                        if (Math.abs(x) < 0.3 && Math.abs(y) < 0.3 && Math.abs(z) < 0.3) match = true;
                        break;
                    case 'hippocampus': // Deep Side (Approx)
                        if (Math.abs(x) > 0.2 && Math.abs(x) < 0.5 && y < 0 && z > -0.2 && z < 0.2) match = true;
                        break;
                }
                if (match) indices.push(i);
            });
            return indices;
        },

        computeRegionsAndBoundaries(brainShell) {
            // 1. Assign Regions to Vertices
            brainShell.vertices.forEach((v, i) => {
                v.region = null;
                for (const [name, data] of Object.entries(brainShell.regions)) {
                    if (data.vertices.includes(i)) {
                        v.region = name;
                        break;
                    }
                }
            });

            // 2. Assign Regions to Faces & Build Edge Map
            const edgeMap = new Map(); // "v1-v2" -> [faceIndex, faceIndex]

            brainShell.faces.forEach((face, faceIdx) => {
                const indices = face.indices || face;
                const v1 = brainShell.vertices[indices[0]];
                const v2 = brainShell.vertices[indices[1]];
                const v3 = brainShell.vertices[indices[2]];

                if (!v1 || !v2 || !v3) return;

                const region = v1.region || v2.region || v3.region;
                face.region = region;

                // Register Edges
                const edges = [
                    [Math.min(face.indices[0], face.indices[1]), Math.max(face.indices[0], face.indices[1])],
                    [Math.min(face.indices[1], face.indices[2]), Math.max(face.indices[1], face.indices[2])],
                    [Math.min(face.indices[2], face.indices[0]), Math.max(face.indices[2], face.indices[0])]
                ];

                edges.forEach(edge => {
                    const key = `${edge[0]}-${edge[1]}`;
                    if (!edgeMap.has(key)) edgeMap.set(key, []);
                    edgeMap.get(key).push(faceIdx);
                });
            });

            // 3. Find Boundary Edges
            brainShell.boundaries = [];

            edgeMap.forEach((faces, key) => {
                if (faces.length === 2) {
                    const f1 = brainShell.faces[faces[0]];
                    const f2 = brainShell.faces[faces[1]];

                    if (f1.region !== f2.region && f1.region && f2.region) {
                        const [i1, i2] = key.split('-').map(Number);
                        brainShell.boundaries.push({ i1, i2, type: 'border' });
                    }
                }
            });
        },

        generateTubeMesh(p1, p2, cp, radius, segments) {
            const vertices = [];
            const faces = [];
            const steps = 10; // Number of rings along the tube

            // Helper to get point on Bezier curve
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

                // Calculate Tangent
                const nextP = getPoint(Math.min(1, t + 0.01));
                let tx = nextP.x - p.x;
                let ty = nextP.y - p.y;
                let tz = nextP.z - p.z;
                const len = Math.sqrt(tx * tx + ty * ty + tz * tz);
                tx /= len; ty /= len; tz /= len;

                // Calculate Normal (Arbitrary up vector)
                let ux = 0, uy = 1, uz = 0;
                if (Math.abs(ty) > 0.9) { ux = 1; uy = 0; } // Handle vertical tangent

                // Binormal = Tangent x Up
                let bx = ty * uz - tz * uy;
                let by = tz * ux - tx * uz;
                let bz = tx * uy - ty * ux;
                const bLen = Math.sqrt(bx * bx + by * by + bz * bz);
                bx /= bLen; by /= bLen; bz /= bLen;

                // Recalculate Normal = Binormal x Tangent
                let nx = by * tz - bz * ty;
                let ny = bz * tx - bx * tz;
                let nz = bx * ty - by * tx;

                // Generate Ring
                for (let j = 0; j < segments; j++) {
                    const theta = (j / segments) * Math.PI * 2;
                    const sin = Math.sin(theta);
                    const cos = Math.cos(theta);

                    // Vertex position: P + Normal*cos + Binormal*sin
                    const vx = p.x + radius * (nx * cos + bx * sin);
                    const vy = p.y + radius * (ny * cos + by * sin);
                    const vz = p.z + radius * (nz * cos + bz * sin);

                    vertices.push({ x: vx, y: vy, z: vz });
                }
            }

            // Generate Faces
            for (let i = 0; i < steps; i++) {
                for (let j = 0; j < segments; j++) {
                    const current = i * segments + j;
                    const next = current + segments;
                    const nextJ = (j + 1) % segments;

                    const v1 = current;
                    const v2 = i * segments + nextJ;
                    const v3 = (i + 1) * segments + nextJ;
                    const v4 = next;

                    faces.push([v1, v2, v3]);
                    faces.push([v1, v3, v4]);
                }
            }

            return { vertices, faces };
        },

        createSynapseGeometry(radius, segments, type) {
            const vertices = [];
            const faces = [];

            // Type: 'pre' (Bouton) or 'post' (Spine/Cup)

            for (let i = 0; i <= segments; i++) {
                const lat = (i / segments) * Math.PI; // 0 to PI
                const sinLat = Math.sin(lat);
                const cosLat = Math.cos(lat);

                for (let j = 0; j <= segments; j++) {
                    const lon = (j / segments) * Math.PI * 2;
                    const sinLon = Math.sin(lon);
                    const cosLon = Math.cos(lon);

                    let r = radius;
                    let yOffset = 0;

                    if (type === 'pre') {
                        // Pre-synaptic Bouton: Organic "Bag of Marbles" look
                        // Base sphere
                        // Deform to be slightly irregular
                        r *= 1.0 + Math.sin(lat * 3) * 0.1 + Math.cos(lon * 4) * 0.1;

                        // Flatten bottom slightly where it meets cleft
                        if (cosLat < -0.5) {
                            r *= 0.8 + (cosLat + 0.5) * 0.2;
                        }

                        // Add surface bumps (vesicles pressing out)
                        const bumps = Math.sin(lat * 12) * Math.cos(lon * 12);
                        r += bumps * 0.5;
                    } else {
                        // Post-synaptic Spine: "Mushroom Head" (Convex)
                        // Not a cup! A bulbous head on a neck.

                        if (cosLat > 0) {
                            // Top half (Head): Bulbous
                            r *= 1.2;
                            // Flatten very top slightly for PSD
                            if (cosLat > 0.8) r *= 0.9;
                        } else {
                            // Bottom half: Taper sharply to neck
                            const t = -cosLat; // 0 to 1
                            if (t > 0.3) {
                                r *= Math.max(0.3, 1.0 - (t - 0.3) * 2); // Neck
                            }
                        }

                        // Organic noise
                        r += Math.sin(lat * 8) * 0.5;
                    }

                    const x = r * sinLat * cosLon;
                    const y = r * cosLat + yOffset;
                    const z = r * sinLat * sinLon;

                    vertices.push({ x, y, z });
                }
            }

            // Generate Faces
            for (let i = 0; i < segments; i++) {
                for (let j = 0; j < segments; j++) {
                    const first = i * (segments + 1) + j;
                    const second = first + segments + 1;
                    faces.push([first, second, first + 1]);
                    faces.push([second, second + 1, first + 1]);
                }
            }
            return { vertices, faces };
        }
    };

    window.GreenhouseNeuroGeometry = GreenhouseNeuroGeometry;
})();
