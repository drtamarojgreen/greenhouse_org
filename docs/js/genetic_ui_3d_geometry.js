(function () {
    'use strict';

    const GreenhouseGeneticGeometry = {

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
            // Procedural "Random Walk" to simulate folding
            const vertices = [];
            let cx = 0, cy = 0, cz = 0;
            const length = 30;
            const step = 10;

            // Simple pseudo-random based on seed string
            const seedStr = String(seed);
            let seedVal = 0;
            for (let i = 0; i < seedStr.length; i++) seedVal += seedStr.charCodeAt(i);
            const random = () => {
                const x = Math.sin(seedVal++) * 10000;
                return x - Math.floor(x);
            };

            for (let i = 0; i < length; i++) {
                vertices.push({ x: cx, y: cy, z: cz });

                // Random direction but biased towards center to keep it compact (globular)
                cx += (random() - 0.5) * step - (cx * 0.05);
                cy += (random() - 0.5) * step - (cy * 0.05);
                cz += (random() - 0.5) * step - (cz * 0.05);
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
            // X-Shaped Chromosome (Two crossed, slightly bent capsules)
            // VERTICAL ORIENTATION for PiP display
            const vertices = [];
            const faces = [];
            const radius = 15; // Slightly smaller for PiP
            const length = 100; // Adjusted length
            const segments = 10;
            const rings = 20;

            // Helper to generate a bent capsule (arm)
            const generateArm = (angleOffset, bendFactor, zOffset) => {
                for (let i = 0; i <= rings; i++) {
                    const t = i / rings;
                    const profile = 1.0 + Math.pow(Math.abs(t - 0.5) * 2, 2) * 0.5;
                    const r = radius * profile;
                    const lPos = (t - 0.5) * length * 2;
                    let y = lPos;
                    let x = Math.pow(lPos / length, 2) * bendFactor;
                    let z = zOffset;

                    const cos = Math.cos(angleOffset);
                    const sin = Math.sin(angleOffset);
                    const rx = x * cos - y * sin;
                    const ry = x * sin + y * cos;

                    x = rx; y = ry;

                    for (let j = 0; j < segments; j++) {
                        const theta = (j / segments) * Math.PI * 2;
                        const nx = Math.cos(theta);
                        const nz = Math.sin(theta);
                        vertices.push({ x: x + nx * r, y: y, z: z + nz * r });
                    }
                }
            };

            generateArm(Math.PI / 6, 15, 0);
            generateArm(-Math.PI / 6, 15, 0);

            const vertsPerArm = (rings + 1) * segments;
            for (let arm = 0; arm < 2; arm++) {
                const offset = arm * vertsPerArm;
                for (let i = 0; i < rings; i++) {
                    for (let j = 0; j < segments; j++) {
                        const current = offset + i * segments + j;
                        const next = offset + (i + 1) * segments + j;
                        const nextJ = (j + 1) % segments;
                        faces.push([current, offset + i * segments + nextJ, offset + (i + 1) * segments + nextJ]);
                        faces.push([current, offset + (i + 1) * segments + nextJ, next]);
                    }
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
                    // This is key to removing the 'soccer ball' look
                    const noise = (Math.sin(x * 12) * Math.cos(y * 12) * Math.sin(z * 12)) * 0.03 +
                        (Math.sin(x * 25) * Math.cos(y * 25)) * 0.01;

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
                pfc: { color: 'rgba(100, 150, 255, 0.6)', vertices: this.getRegionVertices(brainShell, 'pfc') },
                amygdala: { color: 'rgba(255, 100, 100, 0.6)', vertices: this.getRegionVertices(brainShell, 'amygdala') },
                hippocampus: { color: 'rgba(100, 255, 150, 0.6)', vertices: this.getRegionVertices(brainShell, 'hippocampus') },
                temporalLobe: { color: 'rgba(255, 165, 0, 0.6)', vertices: this.getRegionVertices(brainShell, 'temporalLobe') },
                parietalLobe: { color: 'rgba(147, 112, 219, 0.6)', vertices: this.getRegionVertices(brainShell, 'parietalLobe') },
                occipitalLobe: { color: 'rgba(255, 192, 203, 0.6)', vertices: this.getRegionVertices(brainShell, 'occipitalLobe') },
                cerebellum: { color: 'rgba(64, 224, 208, 0.6)', vertices: this.getRegionVertices(brainShell, 'cerebellum') },
                brainstem: { color: 'rgba(255, 215, 0, 0.6)', vertices: this.getRegionVertices(brainShell, 'brainstem') }
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
            edgeMap.forEach((faces, key) => {
                if (faces.length === 2) {
                    const f1 = brainShell.faces[faces[0]], f2 = brainShell.faces[faces[1]];
                    if (f1.region !== f2.region && f1.region && f2.region) {
                        const [i1, i2] = key.split('-').map(Number);
                        brainShell.boundaries.push({ i1, i2 });
                    }
                }
            });
        }
    };

    window.GreenhouseGeneticGeometry = GreenhouseGeneticGeometry;
})();
