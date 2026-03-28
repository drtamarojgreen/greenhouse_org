(function () {
    'use strict';

    const GreenhouseNeuroGeometry = {
        // Cache for expensive geometries
        cache: new Map(),

        getRegionAt(x, y, z) {
            // Normalize coords for region checking (assuming radius 1 here)
            if (z > 0.4 && y > -0.2) return 'pfc';
            if (z < -0.5 && y > -0.2) return 'occipitalLobe';
            if (Math.abs(x) > 0.4 && y < 0.1 && z > -0.4 && z < 0.4) return 'temporalLobe';
            if (y > 0.4 && z > -0.4 && z < 0.4) return 'parietalLobe';
            if (y < -0.3 && z < -0.4) return 'cerebellum';
            if (y < -0.5 && Math.abs(x) < 0.3 && Math.abs(z) < 0.3) return 'brainstem';
            if (Math.abs(x) < 0.3 && Math.abs(y) < 0.3 && Math.abs(z) < 0.3) return 'amygdala';
            if (Math.abs(x) > 0.2 && Math.abs(x) < 0.5 && y < 0 && z > -0.2 && z < 0.2) return 'hippocampus';
            return 'default';
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

        generateGliaMesh(type, scale = 1.0, activationLevel = 0) {
            const vertices = [];
            const faces = [];

            // Morph from ramified (many branches, small soma) to amoeboid (few/no branches, large soma)
            const branchesCount = Math.floor((type === 'astrocyte' ? 12 : 8) * (1 - activationLevel * 0.8));
            const somaRadius = 10 * scale * (1 + activationLevel);

            // Central Soma
            const soma = this.generateSphere(somaRadius, 8);
            vertices.push(...soma.vertices.map(v => ({ ...v, color: type === 'astrocyte' ? '#ffcc00' : '#ff4444' })));
            faces.push(...soma.faces);

            // Processes (Dendrite-like branches)
            for (let i = 0; i < branchesCount; i++) {
                const angle = (i / branchesCount) * Math.PI * 2;
                const phi = (Math.random() - 0.5) * Math.PI;
                const p1 = { x: 0, y: 0, z: 0 };

                // Retract branches as activationLevel increases
                const branchLength = 60 * scale * (1 - activationLevel * 0.6);
                const p2 = {
                    x: Math.cos(angle) * Math.cos(phi) * branchLength,
                    y: Math.sin(phi) * branchLength,
                    z: Math.sin(angle) * Math.cos(phi) * branchLength
                };
                const cp = {
                    x: p2.x * 0.5 + (Math.random() - 0.5) * 20 * (1 - activationLevel),
                    y: p2.y * 0.5 + (Math.random() - 0.5) * 20 * (1 - activationLevel),
                    z: p2.z * 0.5
                };

                const tube = this.generateTubeMesh(p1, p2, cp, 2 * scale * (1 + activationLevel * 0.5), 6);
                const offset = vertices.length;
                vertices.push(...tube.vertices.map(v => ({ ...v, color: type === 'astrocyte' ? '#ffcc00' : '#ff6666' })));
                tube.faces.forEach(f => faces.push([f[0] + offset, f[1] + offset, f[2] + offset]));
            }
            return { vertices, faces };
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
                    const region = this.getRegionAt(x, y, z);
                    let freq = 12;
                    let amp = 0.03;

                    if (region === 'pfc') freq = 18;
                    else if (region === 'temporalLobe') freq = 12;
                    else if (region === 'occipitalLobe') freq = 8;
                    else if (region === 'brainstem') amp = 0.005;

                    let noise = (Math.sin(x * freq) * Math.cos(y * freq) * Math.sin(z * freq)) * amp;

                    if (region === 'cerebellum') {
                        noise = (Math.sin(z * 0.4) * 0.04);
                    }

                    x = x * radius * (1 + noise);
                    y = y * radius * (1 + noise);
                    z = z * radius * (1 + noise);

                    // Compute Normal
                    const len = Math.sqrt(x * x + y * y + z * z);

                    // Simple procedural texture
                    const texture = (Math.sin(x * 0.1) + Math.cos(y * 0.1) + Math.sin(z * 0.1)) * 0.5 + 0.5;

                    // Apply texture to geometry (displacement mapping)
                    if (texture > 0.6) {
                        x += (x / len) * 2;
                        y += (y / len) * 2;
                        z += (z / len) * 2;
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
                    color: 'rgba(100, 150, 255, 0.6)',
                    vertices: this.getRegionVertices(brainShell, 'pfc'),
                    roughness: 0.7, metallic: 0.1
                },
                amygdala: {
                    color: 'rgba(255, 100, 100, 0.6)',
                    vertices: this.getRegionVertices(brainShell, 'amygdala'),
                    roughness: 0.4, metallic: 0.2
                },
                hippocampus: {
                    color: 'rgba(100, 255, 150, 0.6)',
                    vertices: this.getRegionVertices(brainShell, 'hippocampus'),
                    roughness: 0.4, metallic: 0.2
                },
                temporalLobe: {
                    color: 'rgba(255, 165, 0, 0.6)',
                    vertices: this.getRegionVertices(brainShell, 'temporalLobe'),
                    roughness: 0.7, metallic: 0.1
                },
                parietalLobe: {
                    color: 'rgba(147, 112, 219, 0.6)',
                    vertices: this.getRegionVertices(brainShell, 'parietalLobe'),
                    roughness: 0.7, metallic: 0.1
                },
                occipitalLobe: {
                    color: 'rgba(255, 192, 203, 0.6)',
                    vertices: this.getRegionVertices(brainShell, 'occipitalLobe'),
                    roughness: 0.7, metallic: 0.1
                },
                cerebellum: {
                    color: 'rgba(64, 224, 208, 0.6)',
                    vertices: this.getRegionVertices(brainShell, 'cerebellum'),
                    roughness: 0.8, metallic: 0.0
                },
                brainstem: {
                    color: 'rgba(255, 215, 0, 0.6)',
                    vertices: this.getRegionVertices(brainShell, 'brainstem'),
                    roughness: 0.5, metallic: 0.1
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
                const v1 = brainShell.vertices[face.indices[0]];
                const v2 = brainShell.vertices[face.indices[1]];
                const v3 = brainShell.vertices[face.indices[2]];

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

            // 3. Find Boundary Edges and apply grooves (beveling)
            brainShell.boundaries = [];
            const boundaryVertices = new Set();

            edgeMap.forEach((faces, key) => {
                if (faces.length === 2) {
                    const f1 = brainShell.faces[faces[0]];
                    const f2 = brainShell.faces[faces[1]];

                    if (f1.region !== f2.region && f1.region && f2.region) {
                        const [i1, i2] = key.split('-').map(Number);
                        brainShell.boundaries.push({ i1, i2, type: 'border' });
                        boundaryVertices.add(i1);
                        boundaryVertices.add(i2);
                    }
                }
            });

            // 4. Inset boundary vertices to create visible grooves
            boundaryVertices.forEach(idx => {
                const v = brainShell.vertices[idx];
                const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
                if (len > 0) {
                    const inset = 3;
                    v.x -= (v.x / len) * inset;
                    v.y -= (v.y / len) * inset;
                    v.z -= (v.z / len) * inset;
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

        createSynapseGeometry(radius, segments, type, synapticWeight = 1.0) {
            const vertices = [];
            const faces = [];

            const weightScale = 0.8 + synapticWeight * 0.4; // 0.8 to 1.2

            for (let i = 0; i <= segments; i++) {
                const lat = (i / segments) * Math.PI; // 0 to PI
                const sinLat = Math.sin(lat);
                const cosLat = Math.cos(lat);

                for (let j = 0; j <= segments; j++) {
                    const lon = (j / segments) * Math.PI * 2;
                    const sinLon = Math.sin(lon);
                    const cosLon = Math.cos(lon);

                    let r = radius * weightScale;

                    if (type === 'pre') {
                        // Pre-synaptic Bouton: Organic "Bag of Marbles" look
                        r *= 1.0 + Math.sin(lat * 3) * 0.1 + Math.cos(lon * 4) * 0.1;

                        // Flatten bottom slightly where it meets cleft
                        if (cosLat < -0.5) {
                            r *= 0.8 + (cosLat + 0.5) * 0.2;
                        }

                        // Add surface bumps (vesicles pressing out) - scaled by weight
                        const bumps = Math.sin(lat * 12) * Math.cos(lon * 12);
                        r += bumps * 0.5 * weightScale;
                    } else {
                        // Post-synaptic Spine: "Mushroom Head"
                        if (cosLat > 0) {
                            // Top half (Head): Bulbous
                            r *= 1.2;
                            // Flatten very top slightly for PSD - deeper with more weight
                            const flattenThreshold = 1.0 - (0.2 * weightScale);
                            if (cosLat > flattenThreshold) r *= 0.9;
                        } else {
                            // Bottom half: Taper sharply to neck
                            const t = -cosLat; // 0 to 1
                            if (t > 0.3) {
                                r *= Math.max(0.3, 1.0 - (t - 0.3) * 2); // Neck
                            }
                        }
                        r += Math.sin(lat * 8) * 0.5;
                    }

                    const x = r * sinLat * cosLon;
                    const y = r * cosLat;
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

            // Structural Scaffolding Additions
            if (type === 'pre') {
                // Active Zone Pegs
                const pegOffset = vertices.length;
                const pegRows = 4, pegCols = 4;
                const pegSpacing = 20;
                for (let row = 0; row < pegRows; row++) {
                    for (let col = 0; col < pegCols; col++) {
                        const px = (col - (pegCols-1)/2) * pegSpacing;
                        const pz = (row - (pegRows-1)/2) * pegSpacing;
                        const py = -radius * 0.8; // Bottom surface
                        const pegIdx = vertices.length;
                        // Use small octahedron geometry for the peg to ensure visibility without complex cylinder logic
                        const pegSize = 3;
                        const s = pegSize;
                        vertices.push(
                            { x: px + s, y: py, z: pz }, { x: px - s, y: py, z: pz },
                            { x: px, y: py + s, z: pz }, { x: px, y: py - s, z: pz },
                            { x: px, y: py, z: pz + s }, { x: px, y: py, z: pz - s }
                        );
                        faces.push(
                            [pegIdx + 0, pegIdx + 2, pegIdx + 4], [pegIdx + 0, pegIdx + 4, pegIdx + 3],
                            [pegIdx + 0, pegIdx + 3, pegIdx + 5], [pegIdx + 0, pegIdx + 5, pegIdx + 2],
                            [pegIdx + 1, pegIdx + 2, pegIdx + 5], [pegIdx + 1, pegIdx + 5, pegIdx + 3],
                            [pegIdx + 1, pegIdx + 3, pegIdx + 4], [pegIdx + 1, pegIdx + 4, pegIdx + 2]
                        );
                    }
                }
            } else {
                // PSD Plate
                const psdOffset = vertices.length;
                const size = 80;
                vertices.push({ x: -size, y: radius * 0.8, z: -size });
                vertices.push({ x: size, y: radius * 0.8, z: -size });
                vertices.push({ x: size, y: radius * 0.8, z: size });
                vertices.push({ x: -size, y: radius * 0.8, z: size });
                faces.push([psdOffset, psdOffset + 1, psdOffset + 2]);
                faces.push([psdOffset, psdOffset + 2, psdOffset + 3]);
            }

            return { vertices, faces };
        }
    };

    window.GreenhouseNeuroGeometry = GreenhouseNeuroGeometry;
})();
