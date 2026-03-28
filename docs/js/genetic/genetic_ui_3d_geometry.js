(function () {
    'use strict';

    const GreenhouseGeneticGeometry = {

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

        generateHelixPoints(index, totalNodes, helixOffset) {
            // True 3D Double Helix Topology with Major/Minor Grooves
            const pairIndex = Math.floor(index / 2); // Which base pair rung
            const strandIndex = index % 2; // 0 or 1

            const t = pairIndex * 0.4; // Spacing along the helix
            const radius = 60;
            const verticalSpread = 12;

            // Major/Minor Groove Offset
            // Standard B-DNA has grooves. We simulate this by offsetting the second strand 
            // not by 180 degrees (PI), but by roughly 140 degrees (2.44 rad).
            // Let's exaggerate it slightly for visual clarity: 2.2 rad (~126 deg)
            const strandOffset = strandIndex === 0 ? 0 : 2.2;

            const angle = t + strandOffset;

            // 3D Spiral: x = r*cos(t), z = r*sin(t), y = t
            const x = helixOffset + Math.cos(angle) * radius;
            const y = (pairIndex * verticalSpread) - 300;
            const z = Math.sin(angle) * radius;

            return { x, y, z, strandIndex };
        },

        generateProteinChain(seed) {
            // Procedural "Random Walk" with Secondary Structure Segments
            const vertices = [];
            let cx = 0, cy = 0, cz = 0;
            const segments = 4;
            const step = 8;

            const seedStr = String(seed);
            let seedVal = 0;
            for (let i = 0; i < seedStr.length; i++) seedVal += seedStr.charCodeAt(i);
            const random = () => {
                const x = Math.sin(seedVal++) * 10000;
                return x - Math.floor(x);
            };

            for (let s = 0; s < segments; s++) {
                const typeRand = random();
                let type = 'coil';
                if (typeRand < 0.4) type = 'helix';
                else if (typeRand < 0.7) type = 'sheet';

                const segLength = 10 + Math.floor(random() * 10);

                // Base direction for the segment
                let dx = (random() - 0.5);
                let dy = (random() - 0.5);
                let dz = (random() - 0.5);
                const dLen = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
                dx /= dLen; dy /= dLen; dz /= dLen;

                // Perpendicular system for spirals/zigzags
                let px = 0, py = 1, pz = 0;
                if (Math.abs(dy) > 0.9) px = 1;
                let ux = dy * pz - dz * py;
                let uy = dz * px - dx * pz;
                let uz = dx * py - dy * px;
                const uLen = Math.sqrt(ux*ux + uy*uy + uz*uz) || 1;
                ux /= uLen; uy /= uLen; uz /= uLen;
                let vx = uy * dz - uz * dy;
                let vy = uz * dx - ux * dz;
                let vz = ux * dy - uy * dx;

                for (let i = 0; i < segLength; i++) {
                    let rx = cx, ry = cy, rz = cz;

                    if (type === 'helix') {
                        const angle = i * 0.8;
                        const radius = 5;
                        rx += (ux * Math.cos(angle) + vx * Math.sin(angle)) * radius;
                        ry += (uy * Math.cos(angle) + vy * Math.sin(angle)) * radius;
                        rz += (uz * Math.cos(angle) + vz * Math.sin(angle)) * radius;
                        cx += dx * 3; cy += dy * 3; cz += dz * 3;
                    } else if (type === 'sheet') {
                        const zig = (i % 2 === 0 ? 1 : -1) * 4;
                        rx += ux * zig; ry += uy * zig; rz += uz * zig;
                        cx += dx * 5; cy += dy * 5; cz += dz * 5;
                    } else {
                        cx += (random() - 0.5) * step;
                        cy += (random() - 0.5) * step;
                        cz += (random() - 0.5) * step;
                        rx = cx; ry = cy; rz = cz;
                    }

                    vertices.push({ x: rx, y: ry, z: rz, type });
                }
            }
            return { vertices };
        },

        // Reusing the tube mesh generator (could be shared in a common util, but for now duplicating or keeping separate is safer for modularity)
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

        generateCylinderMesh(p1, p2, radius, segments) {
            const vertices = [];
            const faces = [];

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dz = p2.z - p1.z;
            const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

            // Orientation vectors
            let ux = 0, uy = 1, uz = 0;
            if (Math.abs(dy / len) > 0.9) { ux = 1; uy = 0; }

            // Binormal
            let bx = dy * uz - dz * uy;
            let by = dz * ux - dx * uz;
            let bz = dx * uy - dy * ux;
            const bLen = Math.sqrt(bx * bx + by * by + bz * bz);
            bx /= bLen; by /= bLen; bz /= bLen;

            // Normal
            let nx = by * dz - bz * dy;
            let ny = bz * dx - bx * dz;
            let nz = bx * dy - by * dx;
            const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
            nx /= nLen; ny /= nLen; nz /= nLen;

            for (let i = 0; i <= 1; i++) {
                const p = i === 0 ? p1 : p2;
                for (let j = 0; j < segments; j++) {
                    const theta = (j / segments) * Math.PI * 2;
                    const cos = Math.cos(theta);
                    const sin = Math.sin(theta);

                    vertices.push({
                        x: p.x + radius * (nx * cos + bx * sin),
                        y: p.y + radius * (ny * cos + by * sin),
                        z: p.z + radius * (nz * cos + bz * sin)
                    });
                }
            }

            for (let j = 0; j < segments; j++) {
                const v1 = j;
                const v2 = (j + 1) % segments;
                const v3 = segments + ((j + 1) % segments);
                const v4 = segments + j;

                faces.push([v1, v2, v3]);
                faces.push([v1, v3, v4]);
            }

            return { vertices, faces };
        },

        generateSphereMesh(center, radius, bands) {
            const vertices = [];
            const faces = [];

            for (let lat = 0; lat <= bands; lat++) {
                const theta = (lat * Math.PI) / bands;
                const sinT = Math.sin(theta);
                const cosT = Math.cos(theta);

                for (let lon = 0; lon <= bands; lon++) {
                    const phi = (lon * 2 * Math.PI) / bands;
                    const sinP = Math.sin(phi);
                    const cosP = Math.cos(phi);

                    vertices.push({
                        x: center.x + radius * cosP * sinT,
                        y: center.y + radius * cosT,
                        z: center.z + radius * sinP * sinT
                    });
                }
            }

            for (let lat = 0; lat < bands; lat++) {
                for (let lon = 0; lon < bands; lon++) {
                    const first = lat * (bands + 1) + lon;
                    const second = first + bands + 1;

                    faces.push([first, second, first + 1]);
                    faces.push([second, second + 1, first + 1]);
                }
            }

            return { vertices, faces };
        },

        generateChromosomeMesh() {
            // High-fidelity Chromosome: Beads-on-a-string (Nucleosomes) + Centromere + Telomeres
            const vertices = [];
            const faces = [];
            const radius = 12;
            const length = 120;
            const segments = 12;
            const rings = 40;

            const generateArm = (angleOffset, bendFactor, isRight) => {
                const armOffset = vertices.length;
                for (let i = 0; i <= rings; i++) {
                    const t = i / rings;
                    const lPos = (t - 0.5) * length;

                    // 1. Centromere Constriction (at t=0.5)
                    const distFromCenter = Math.abs(t - 0.5);
                    const constriction = 0.4 + 0.6 * Math.min(1, distFromCenter * 10);

                    // 2. Nucleosome "Beads" (Periodic swellings)
                    const beads = 1.0 + 0.2 * Math.pow(Math.sin(t * Math.PI * 10), 2);

                    // 3. Telomere Caps (at ends)
                    const telomere = (t < 0.05 || t > 0.95) ? 1.2 : 1.0;

                    const r = radius * constriction * beads * telomere;

                    let y = lPos;
                    let x = Math.pow(lPos / (length/2), 2) * bendFactor;
                    let z = 0;

                    const cos = Math.cos(angleOffset);
                    const sin = Math.sin(angleOffset);
                    const rx = x * cos - y * sin;
                    const ry = x * sin + y * cos;
                    x = rx; y = ry;

                    for (let j = 0; j < segments; j++) {
                        const theta = (j / segments) * Math.PI * 2;
                        // 4. Fine surface ridges (chromatin packing)
                        const ridge = 1 + 0.05 * Math.sin(theta * 6);
                        const nx = Math.cos(theta);
                        const nz = Math.sin(theta);
                        vertices.push({ x: x + nx * r * ridge, y: y, z: z + nz * r * ridge });
                    }
                }

                // Faces
                for (let i = 0; i < rings; i++) {
                    for (let j = 0; j < segments; j++) {
                        const v1 = armOffset + i * segments + j;
                        const v2 = armOffset + i * segments + (j + 1) % segments;
                        const v3 = armOffset + (i + 1) * segments + (j + 1) % segments;
                        const v4 = armOffset + (i + 1) * segments + j;
                        faces.push([v1, v2, v3]);
                        faces.push([v1, v3, v4]);
                    }
                }
            };

            generateArm(Math.PI / 6, 10, false);
            generateArm(-Math.PI / 6, 10, true);

            // Centromere Torus
            const centOffset = vertices.length;
            const cRadius = 15, tRadius = 5;
            const tSteps = 8;
            for (let i = 0; i <= tSteps; i++) {
                const u = (i / tSteps) * Math.PI * 2;
                for (let j = 0; j <= tSteps; j++) {
                    const v = (j / tSteps) * Math.PI * 2;
                    const x = (cRadius + tRadius * Math.cos(v)) * Math.cos(u);
                    const y = (cRadius + tRadius * Math.cos(v)) * Math.sin(u);
                    const z = tRadius * Math.sin(v);
                    vertices.push({ x, y: y * 0.2, z });
                }
            }

            for (let i = 0; i < tSteps; i++) {
                for (let j = 0; j < tSteps; j++) {
                    const current = centOffset + i * (tSteps + 1) + j;
                    const next = current + tSteps + 1;
                    faces.push([current, next, current + 1]);
                    faces.push([next, next + 1, current + 1]);
                }
            }

            return { vertices, faces };
        },

        initializeBrainShell(brainShell) {
            // Use realistic brain mesh if available
            if (window.GreenhouseBrainMeshRealistic) {
                const realisticBrain = window.GreenhouseBrainMeshRealistic.generateRealisticBrain();
                brainShell.vertices = realisticBrain.vertices;
                brainShell.faces = realisticBrain.faces.map(face => ({ indices: face, region: null }));
                brainShell.regions = realisticBrain.regions;
                this.computeRegionsAndBoundaries(brainShell);
                return;
            }

            // Fallback parametric brain shell
            const radius = 200;
            const bands = 40;
            for (let lat = 0; lat <= bands; lat++) {
                const theta = (lat * Math.PI) / bands;
                const sinT = Math.sin(theta); const cosT = Math.cos(theta);
                for (let lon = 0; lon <= bands; lon++) {
                    const phi = (lon * 2 * Math.PI) / bands;
                    const sinP = Math.sin(phi); const cosP = Math.cos(phi);

                    let x = cosP * sinT;
                    let y = cosT;
                    let z = sinP * sinT;

                    // 1. Longitudanal Fissure (Hemispheric Split)
                    const fissure = 1 - Math.exp(-Math.abs(x) * 5) * 0.35;
                    if (y > 0) y *= fissure;

                    // 2. Temporal Lobe Bulge (Organic sides)
                    const tempY = -0.2;
                    const tempX = 0.65;
                    const dy = y - tempY;
                    const dx = Math.abs(x) - tempX;
                    const distTemp = Math.sqrt(dx * dx + dy * dy);
                    if (distTemp < 0.5) {
                        const bulge = Math.cos(distTemp * Math.PI) * 0.5 + 0.5;
                        x *= (1 + bulge * 0.25);
                        z *= (1 + bulge * 0.15);
                    }

                    // 3. Cerebellum (Lower Posterior rounding)
                    if (y < -0.3 && z < -0.4) {
                        const distCere = Math.sqrt(x * x + (y + 0.5) * (y + 0.5) + (z + 0.6) * (z + 0.6));
                        if (distCere < 0.5) {
                            const bulge = 1 + (0.5 - distCere) * 0.5;
                            x *= bulge; y *= bulge; z *= bulge;
                        }
                    }

                    // 4. Procedural Gyri/Sulci Noise (The brain surface 'wrinkles')
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

                    brainShell.vertices.push({ x, y, z });
                }
            }
            for (let lat = 0; lat < bands; lat++) {
                for (let lon = 0; lon < bands; lon++) {
                    const first = lat * (bands + 1) + lon;
                    const second = first + bands + 1;
                    brainShell.faces.push({ indices: [first, second, first + 1], region: null });
                    brainShell.faces.push({ indices: [second, second + 1, first + 1], region: null });
                }
            }
            brainShell.regions = {
                pfc: { color: 'rgba(220, 220, 220, 0.6)', vertices: this.getRegionVertices(brainShell, 'pfc'), roughness: 0.8, metallic: 0.0 },
                amygdala: { color: 'rgba(200, 200, 200, 0.6)', vertices: this.getRegionVertices(brainShell, 'amygdala'), roughness: 0.2, metallic: 0.4 },
                hippocampus: { color: 'rgba(210, 210, 210, 0.6)', vertices: this.getRegionVertices(brainShell, 'hippocampus'), roughness: 0.3, metallic: 0.3 },
                temporalLobe: { color: 'rgba(225, 225, 225, 0.6)', vertices: this.getRegionVertices(brainShell, 'temporalLobe'), roughness: 0.6, metallic: 0.1 },
                parietalLobe: { color: 'rgba(220, 220, 220, 0.6)', vertices: this.getRegionVertices(brainShell, 'parietalLobe'), roughness: 0.7, metallic: 0.1 },
                occipitalLobe: { color: 'rgba(215, 215, 215, 0.6)', vertices: this.getRegionVertices(brainShell, 'occipitalLobe'), roughness: 0.9, metallic: 0.0 },
                cerebellum: { color: 'rgba(190, 190, 190, 0.6)', vertices: this.getRegionVertices(brainShell, 'cerebellum'), roughness: 1.0, metallic: 0.0 },
                brainstem: { color: 'rgba(230, 230, 230, 0.6)', vertices: this.getRegionVertices(brainShell, 'brainstem'), roughness: 0.5, metallic: 0.2 }
            };

            // Define topological cut planes for smooth boundary rendering
            brainShell.regionalPlanes = [
                { axis: 'z', value: 0.4, label: 'Frontal' },
                { axis: 'z', value: -0.5, label: 'Occipital' },
                { axis: 'y', value: 0.4, label: 'Parietal' },
                { axis: 'y', value: -0.3, label: 'Lower' },
                { axis: 'y', value: -0.2, label: 'Base' },
                { axis: 'y', value: 0.1, label: 'Temporal-Top' },
                { axis: 'x', value: 0.4, label: 'Temporal R' },
                { axis: 'x', value: -0.4, label: 'Temporal L' }
            ];
            this.computeRegionsAndBoundaries(brainShell);
        },

        getRegionVertices(brainShell, regionKey) {
            const indices = [];
            brainShell.vertices.forEach((v, i) => {
                let match = false;
                const x = v.x / 200, y = v.y / 200, z = v.z / 200;
                switch (regionKey) {
                    case 'pfc': if (z > 0.4 && y > -0.2) match = true; break;
                    case 'occipitalLobe': if (z < -0.5 && y > -0.2) match = true; break;
                    case 'temporalLobe': if (Math.abs(x) > 0.4 && y < 0.1 && z > -0.4 && z < 0.4) match = true; break;
                    case 'parietalLobe': if (y > 0.4 && z > -0.4 && z < 0.4) match = true; break;
                    case 'cerebellum': if (y < -0.3 && z < -0.4) match = true; break;
                    case 'brainstem': if (y < -0.5 && Math.abs(x) < 0.3 && Math.abs(z) < 0.3) match = true; break;
                    case 'amygdala': if (Math.abs(x) < 0.3 && Math.abs(y) < 0.3 && Math.abs(z) < 0.3) match = true; break;
                    case 'hippocampus': if (Math.abs(x) > 0.2 && Math.abs(x) < 0.5 && y < 0 && z > -0.2 && z < 0.2) match = true; break;
                }
                if (match) indices.push(i);
            });
            return indices;
        },

        computeRegionsAndBoundaries(brainShell) {
            brainShell.vertices.forEach((v, i) => {
                v.region = null;
                for (const [name, data] of Object.entries(brainShell.regions)) {
                    if (data.vertices.includes(i)) { v.region = name; break; }
                }
            });
            const edgeMap = new Map();
            brainShell.faces.forEach((face, idx) => {
                face.region = brainShell.vertices[face.indices[0]].region || brainShell.vertices[face.indices[1]].region || brainShell.vertices[face.indices[2]].region;
                [[face.indices[0], face.indices[1]], [face.indices[1], face.indices[2]], [face.indices[2], face.indices[0]]].forEach(e => {
                    const key = `${Math.min(e[0], e[1])}-${Math.max(e[0], e[1])}`;
                    if (!edgeMap.has(key)) edgeMap.set(key, []);
                    edgeMap.get(key).push(idx);
                });
            });
            brainShell.boundaries = [];
            const boundaryVertices = new Set();
            edgeMap.forEach((faces, key) => {
                if (faces.length === 2) {
                    const f1 = brainShell.faces[faces[0]], f2 = brainShell.faces[faces[1]];
                    if (f1.region !== f2.region && f1.region && f2.region) {
                        const [i1, i2] = key.split('-').map(Number);
                        brainShell.boundaries.push({ i1, i2 });
                        boundaryVertices.add(i1);
                        boundaryVertices.add(i2);
                    }
                }
            });

            // Inset boundary vertices to create visible grooves
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
        }
    };

    window.GreenhouseGeneticGeometry = GreenhouseGeneticGeometry;
})();
