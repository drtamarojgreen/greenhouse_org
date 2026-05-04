// docs/js/brain_mesh_realistic.js
// Anatomically Realistic Brain Mesh Generator
// Updated to match reference schematic: schematic_human_brain_t.jpg

(function () {
    'use strict';

    const GreenhouseBrainMeshRealistic = {
        /**
         * Generate anatomically realistic brain mesh
         * @returns {Object} Brain mesh with vertices, faces, and regions
         */
        generateRealisticBrain() {
            const brain = {
                vertices: [],
                faces: [],
                regions: {}
            };

            // Parameters for realistic brain shape
            const baseRadius = 200;
            const latBands = 80;
            const lonBands = 80;

            // Generate layers: Internal structures first, then Cortex
            const layers = [
                { name: 'Internal', radius: 0.45 * baseRadius, latBands: 40, lonBands: 40 },
                { name: 'Cortex', radius: baseRadius, latBands: latBands, lonBands: lonBands }
            ];

            layers.forEach(layer => {
                const startIdx = brain.vertices.length;
                for (let lat = 0; lat <= layer.latBands; lat++) {
                    const theta = (lat * Math.PI) / layer.latBands;
                    const sinTheta = Math.sin(theta);
                    const cosTheta = Math.cos(theta);

                    for (let lon = 0; lon <= layer.lonBands; lon++) {
                        const phi = (lon * 2 * Math.PI) / layer.lonBands;
                        const sinPhi = Math.sin(phi);
                        const cosPhi = Math.cos(phi);

                        let x = cosPhi * sinTheta;
                        let y = cosTheta;
                        let z = sinPhi * sinTheta;

                        if (layer.name === 'Cortex') {
                            const deformed = this.applyAnatomicalDeformations(x, y, z);
                            x = deformed.x * layer.radius;
                            y = deformed.y * layer.radius;
                            z = deformed.z * layer.radius;
                        } else {
                            // Internal structures have simplified shape
                            x *= layer.radius;
                            y *= layer.radius;
                            z *= layer.radius;
                        }

                        let region = this.determineRegion(x / baseRadius, y / baseRadius, z / baseRadius, layer.name);

                        if (layer.name === 'Cortex') {
                            const folds = this.addCorticalFolds(x, y, z, baseRadius, region);
                            x += folds.x;
                            y += folds.y;
                            z += folds.z;
                            region = this.determineRegion(x / baseRadius, y / baseRadius, z / baseRadius, layer.name);
                        }

                        const len = Math.sqrt(x * x + y * y + z * z);
                        const normal = { x: x / len, y: y / len, z: z / len };

                        brain.vertices.push({ x, y, z, normal, region });
                    }
                }

                // Generate faces for this layer
                for (let lat = 0; lat < layer.latBands; lat++) {
                    for (let lon = 0; lon < layer.lonBands; lon++) {
                        const first = startIdx + lat * (layer.lonBands + 1) + lon;
                        const second = first + layer.lonBands + 1;

                        brain.faces.push([first, second, first + 1]);
                        brain.faces.push([second, second + 1, first + 1]);
                    }
                }
            });

            // Recalculate vertex normals with angle weighting
            this.computeWeightedNormals(brain);

            // Apply adaptive subdivision where curvature is high
            this.applyAdaptiveSubdivision(brain, 0.15);

            // Precompute curvature maps
            this.computeCurvatureMap(brain);

            // Define regions with labels - Anatomically correct hierarchy with 20% alpha
            // Colors mapped from schematic_human_brain_t.jpg
            brain.regions = {
                pfc: {
                    name: 'Prefrontal Cortex (Frontal Lobe)',
                    color: 'rgba(245, 230, 200, 0.2)', // Beige/Cream
                    vertices: []
                },
                motorCortex: {
                    name: 'Motor Cortex',
                    color: 'rgba(245, 230, 200, 0.2)', // Beige/Cream
                    vertices: []
                },
                somatosensoryCortex: {
                    name: 'Somatosensory Cortex',
                    color: 'rgba(245, 230, 200, 0.2)', // Beige/Cream
                    vertices: []
                },
                parietalLobe: {
                    name: 'Parietal Lobe',
                    color: 'rgba(245, 230, 200, 0.2)', // Beige/Cream
                    vertices: []
                },
                temporalLobe: {
                    name: 'Temporal Lobe',
                    color: 'rgba(245, 230, 200, 0.2)', // Beige/Cream
                    vertices: []
                },
                occipitalLobe: {
                    name: 'Occipital Lobe',
                    color: 'rgba(245, 230, 200, 0.2)', // Beige/Cream
                    vertices: []
                },
                cerebellum: {
                    name: 'Cerebellum',
                    color: 'rgba(255, 182, 193, 0.2)', // Pink
                    vertices: []
                },
                brainstem: {
                    name: 'Brainstem',
                    color: 'rgba(135, 206, 250, 0.2)', // Light Blue
                    vertices: []
                },
                amygdala: {
                    name: 'Amygdala',
                    color: 'rgba(165, 42, 42, 0.2)', // Reddish-brown (mapped to internal color)
                    vertices: []
                },
                hippocampus: {
                    name: 'Hippocampus',
                    color: 'rgba(165, 42, 42, 0.2)', // Reddish-brown (mapped to internal color)
                    vertices: []
                },
                thalamus: {
                    name: 'Thalamus',
                    color: 'rgba(165, 42, 42, 0.2)', // Reddish-brown
                    vertices: []
                },
                hypothalamus: {
                    name: 'Hypothalamus',
                    color: 'rgba(165, 42, 42, 0.2)', // Reddish-brown
                    vertices: []
                },
                corpusCallosum: {
                    name: 'Corpus Callosum',
                    color: 'rgba(135, 206, 250, 0.2)', // Light Blue
                    vertices: []
                },
                lateralVentricle: {
                    name: 'Lateral Ventricle',
                    color: 'rgba(165, 42, 42, 0.2)', // Reddish-brown in schematic
                    vertices: []
                },
                pituitaryGland: {
                    name: 'Pituitary Gland',
                    color: 'rgba(30, 144, 255, 0.2)', // Bright Blue
                    vertices: []
                },
                mammillaryBody: {
                    name: 'Mammillary Body',
                    color: 'rgba(255, 255, 255, 0.2)', // White
                    vertices: []
                }
            };

            // Populate region vertex indices
            brain.vertices.forEach((v, i) => {
                if (v.region && brain.regions[v.region]) {
                    brain.regions[v.region].vertices.push(i);
                }
            });

            return brain;
        },

        /**
         * Precompute curvature map for stylistic overlays
         */
        computeCurvatureMap(brain) {
            const { vertices, faces } = brain;
            vertices.forEach(v => v.curvature = 0);

            const edgeCounts = new Array(vertices.length).fill(0);

            faces.forEach(f => {
                const pairs = [[f[0], f[1]], [f[1], f[2]], [f[2], f[0]]];
                pairs.forEach(([i1, i2]) => {
                    const v1 = vertices[i1];
                    const v2 = vertices[i2];
                    const dot = v1.normal.x * v2.normal.x + v1.normal.y * v2.normal.y + v1.normal.z * v2.normal.z;
                    const diff = 1.0 - Math.max(-1, Math.min(1, dot));
                    v1.curvature += diff;
                    v2.curvature += diff;
                    edgeCounts[i1]++;
                    edgeCounts[i2]++;
                });
            });

            vertices.forEach((v, i) => {
                if (edgeCounts[i] > 0) v.curvature /= edgeCounts[i];
            });
        },

        /**
         * Apply adaptive subdivision where curvature exceeds a threshold
         */
        applyAdaptiveSubdivision(brain, threshold) {
            const { vertices, faces } = brain;
            const newFaces = [];
            const splitEdges = new Map();

            for (let i = 0; i < faces.length; i++) {
                const f = faces[i];
                const i0 = f[0], i1 = f[1], i2 = f[2];
                const v0 = vertices[i0], v1 = vertices[i1], v2 = vertices[i2];

                const dot01 = v0.normal.x * v1.normal.x + v0.normal.y * v1.normal.y + v0.normal.z * v1.normal.z;
                const dot12 = v1.normal.x * v2.normal.x + v1.normal.y * v2.normal.y + v1.normal.z * v2.normal.z;
                const dot20 = v2.normal.x * v0.normal.x + v2.normal.y * v0.normal.y + v2.normal.z * v0.normal.z;

                const split01 = (1.0 - dot01) > threshold;
                const split12 = (1.0 - dot12) > threshold;
                const split20 = (1.0 - dot20) > threshold;

                if (split01 || split12 || split20) {
                    const getMidpoint = (idxA, idxB) => {
                        const key = Math.min(idxA, idxB) + "-" + Math.max(idxA, idxB);
                        if (splitEdges.has(key)) return splitEdges.get(key);

                        const va = vertices[idxA], vb = vertices[idxB];
                        const midV = {
                            x: (va.x + vb.x) / 2,
                            y: (va.y + vb.y) / 2,
                            z: (va.z + vb.z) / 2,
                            normal: {
                                x: (va.normal.x + vb.normal.x) / 2,
                                y: (va.normal.y + vb.normal.y) / 2,
                                z: (va.normal.z + vb.normal.z) / 2
                            },
                            region: va.region
                        };
                        const l = Math.sqrt(midV.normal.x**2 + midV.normal.y**2 + midV.normal.z**2);
                        if (l > 0) { midV.normal.x /= l; midV.normal.y /= l; midV.normal.z /= l; }

                        const newIdx = vertices.length;
                        vertices.push(midV);
                        splitEdges.set(key, newIdx);
                        return newIdx;
                    };

                    const m01 = getMidpoint(i0, i1);
                    const m12 = getMidpoint(i1, i2);
                    const m20 = getMidpoint(i2, i0);

                    newFaces.push([i0, m01, m20]);
                    newFaces.push([i1, m12, m01]);
                    newFaces.push([i2, m20, m12]);
                    newFaces.push([m01, m12, m20]);
                } else {
                    newFaces.push(f);
                }
            }
            brain.faces = newFaces;
        },

        /**
         * Compute vertex normals using angle-weighted averaging
         */
        computeWeightedNormals(brain) {
            const { vertices, faces } = brain;
            vertices.forEach(v => {
                v.normal.x = 0; v.normal.y = 0; v.normal.z = 0;
            });

            faces.forEach(f => {
                const i0 = f[0], i1 = f[1], i2 = f[2];
                const v0 = vertices[i0], v1 = vertices[i1], v2 = vertices[i2];

                const e10 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
                const e20 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };
                const e21 = { x: v2.x - v1.x, y: v2.y - v1.y, z: v2.z - v1.z };
                const e01 = { x: v0.x - v1.x, y: v0.y - v1.y, z: v0.z - v1.z };
                const e02 = { x: v0.x - v2.x, y: v0.y - v2.y, z: v0.z - v2.z };
                const e12 = { x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z };

                const normalize = (v) => {
                    const l = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
                    return l > 0 ? { x: v.x / l, y: v.y / l, z: v.z / l } : v;
                };

                const n_e10 = normalize(e10);
                const n_e20 = normalize(e20);
                const n_e21 = normalize(e21);
                const n_e01 = normalize(e01);
                const n_e02 = normalize(e02);
                const n_e12 = normalize(e12);

                const faceNormal = {
                    x: e10.y * e20.z - e10.z * e20.y,
                    y: e10.z * e20.x - e10.x * e20.z,
                    z: e10.x * e20.y - e10.y * e20.x
                };
                const fnLen = Math.sqrt(faceNormal.x**2 + faceNormal.y**2 + faceNormal.z**2);
                if (fnLen > 0) { faceNormal.x /= fnLen; faceNormal.y /= fnLen; faceNormal.z /= fnLen; }

                const angle0 = Math.acos(Math.max(-1, Math.min(1, n_e10.x * n_e20.x + n_e10.y * n_e20.y + n_e10.z * n_e20.z)));
                const angle1 = Math.acos(Math.max(-1, Math.min(1, n_e01.x * n_e21.x + n_e01.y * n_e21.y + n_e01.z * n_e21.z)));
                const angle2 = Math.acos(Math.max(-1, Math.min(1, n_e02.x * n_e12.x + n_e02.y * n_e12.y + n_e02.z * n_e12.z)));

                v0.normal.x += faceNormal.x * angle0; v0.normal.y += faceNormal.y * angle0; v0.normal.z += faceNormal.z * angle0;
                v1.normal.x += faceNormal.x * angle1; v1.normal.y += faceNormal.y * angle1; v1.normal.z += faceNormal.z * angle1;
                v2.normal.x += faceNormal.x * angle2; v2.normal.y += faceNormal.y * angle2; v2.normal.z += faceNormal.z * angle2;
            });

            vertices.forEach(v => {
                const len = Math.sqrt(v.normal.x**2 + v.normal.y**2 + v.normal.z**2);
                if (len > 0) { v.normal.x /= len; v.normal.y /= len; v.normal.z /= len; }
            });
        },

        /**
         * Apply anatomical deformations to create realistic brain shape
         */
        applyAnatomicalDeformations(x, y, z) {
            // Proportional scaling for human brain (longer Z, wider X than sphere)
            x *= 1.1; y *= 1.2; z *= 1.35;

            // 1. Longitudinal fissure (Deep indent between hemispheres)
            const fissureEffect = Math.exp(-Math.abs(x) * 12) * 0.25;
            if (y > -0.5) {
                y *= (1 - fissureEffect);
            }

            // 2. Lateral Sulcus (Sylvian Fissure) - Indent on sides
            if (Math.abs(y) < 0.3 && z > -0.4 && z < 0.5) {
                const sulcusEffect = Math.exp(-Math.abs(y + 0.1) * 6) * 0.12;
                if (Math.abs(x) > 0.4) {
                    x *= (1 - sulcusEffect);
                }
            }

            // 3. Frontal Lobe (Broad bulge at front)
            if (z > 0.4) {
                const frontalShift = (z - 0.4) * 0.45;
                z *= (1 + frontalShift);
                x *= (1 + frontalShift * 0.2);
                y *= (1 + frontalShift * 0.1);
            }

            // 4. Temporal Lobes (Hang down and bulge sideways)
            if (Math.abs(x) > 0.6 && z > -0.3 && z < 0.5 && y < 0.2) {
                const tempBulge = (Math.abs(x) - 0.6) * 0.6;
                x *= (1 + tempBulge);
                y -= tempBulge * 0.4; // Hanging down
            }

            // 5. Occipital Lobe (Tapered back)
            if (z < -0.5) {
                const occipitalTaper = (-z - 0.5) * 0.35;
                x *= (1 - occipitalTaper);
                y *= (1 - occipitalTaper * 0.5);
                z *= (1 + occipitalTaper * 0.1);
            }

            // 6. Cerebellum (Separate bulbous structure at lower back)
            if (y < -0.3 && z < -0.4) {
                const distToCerebCenter = Math.sqrt(x*x + (y+0.6)**2 + (z+0.7)**2);
                if (distToCerebCenter < 0.6) {
                    const cerebBulge = (0.6 - distToCerebCenter) * 0.7;
                    x *= (1 + cerebBulge);
                    y *= (1 + cerebBulge);
                    z *= (1 + cerebBulge);
                }
            }

            // 7. Brainstem (Downward protrusion from center)
            if (Math.abs(x) < 0.35 && Math.abs(z) < 0.35 && y < -0.5) {
                const stemTaper = (-y - 0.5) * 0.6;
                x *= (1 - stemTaper);
                z *= (1 - stemTaper);
            }

            return { x, y, z };
        },

        /**
         * Add cortical folds (gyri and sulci) for realistic appearance
         */
        addCorticalFolds(x, y, z, baseRadius, region) {
            // No folds for internal structures or brainstem
            const internalRegions = ['corpusCallosum', 'lateralVentricle', 'thalamus', 'hypothalamus', 'pituitaryGland', 'mammillaryBody', 'brainstem'];
            if (internalRegions.includes(region)) {
                return { x: 0, y: 0, z: 0 };
            }

            const nx = x / baseRadius, ny = y / baseRadius, nz = z / baseRadius;
            let displacement = 0, freqMult = 1.0, ampMult = 1.0;

            switch (region) {
                case 'pfc':
                    freqMult = 1.2; ampMult = 1.1; break;
                case 'cerebellum':
                    freqMult = 3.0; ampMult = 0.5; break;
                case 'temporalLobe':
                    freqMult = 0.8; ampMult = 0.9; break;
                case 'occipitalLobe':
                    freqMult = 1.5; ampMult = 0.8; break;
            }

            displacement += Math.sin(nx * 4 * freqMult + nz * 3 * freqMult) * Math.cos(ny * 3 * freqMult) * 0.08 * ampMult;
            displacement += Math.sin(nx * 8 * freqMult + nz * 6 * freqMult) * Math.cos(ny * 7 * freqMult) * 0.04 * ampMult;
            displacement += Math.sin(nx * 16 * freqMult + nz * 12 * freqMult) * Math.cos(ny * 14 * freqMult) * 0.02 * ampMult;

            const len = Math.sqrt(nx**2 + ny**2 + nz**2);
            if (len > 0) {
                return {
                    x: (nx / len) * displacement * baseRadius,
                    y: (ny / len) * displacement * baseRadius,
                    z: (nz / len) * displacement * baseRadius
                };
            }
            return { x: 0, y: 0, z: 0 };
        },

        /**
         * Determine brain region for a vertex
         * Mapped to schematic_human_brain_t.jpg spatial relationships
         */
        determineRegion(x, y, z, layerName) {
            // Midline structures (Corpus Callosum, Ventricles, Thalamus, etc.)
            if (Math.abs(x) < 0.4) {
                // Pituitary Gland (hangs off hypothalamus at front)
                if (y <= -0.3 && y > -0.8 && z > 0.1 && z < 0.8) return 'pituitaryGland';

                // Corpus Callosum (C-shape above thalamus)
                const distToCallosumCenter = Math.sqrt((y - 0.2)**2 + (z - 0.1)**2);
                if (distToCallosumCenter > 0.2 && distToCallosumCenter < 0.45 && y > 0.1 && z > -0.4 && z < 0.6) {
                    return 'corpusCallosum';
                }

                // Lateral Ventricle (just below callosum)
                if (distToCallosumCenter < 0.2 && y > 0 && z > -0.2 && z < 0.4) {
                    return 'lateralVentricle';
                }

                // Thalamus (Central Egg shape)
                const distToThalamus = Math.sqrt(x*x + (y + 0.1)**2 + (z - 0.1)**2);
                if (distToThalamus < 0.35) return 'thalamus';

                // Hypothalamus (below thalamus)
                if (y <= -0.1 && y > -0.4 && z > 0 && z < 0.4) return 'hypothalamus';

                // Mammillary Body (small bump behind pituitary)
                if (y <= -0.35 && y > -0.55 && z > 0 && z < 0.25) return 'mammillaryBody';

                // Brainstem (protruding downwards)
                if (y < -0.4 && z < 0.2) return 'brainstem';
            }

            // Cerebellum (Lower posterior)
            if (y < -0.2 && z < -0.4) return 'cerebellum';

            // Subcortical (deeper temporal)
            if (Math.abs(x) > 0.2 && Math.abs(x) < 0.6 && y < 0.1 && y > -0.5) {
                if (z > -0.3 && z < 0.3) return 'hippocampus';
                if (z > 0.2 && z < 0.6) return 'amygdala';
            }

            // Cortex regions (Only if in Cortex layer or not caught above)
            if (z > 0.6) return 'pfc';
            if (y > 0.6) {
                if (z > 0) return 'motorCortex';
                return 'somatosensoryCortex';
            }
            if (y > 0.3 && z < -0.3) return 'parietalLobe';
            if (z < -0.6) return 'occipitalLobe';
            if (Math.abs(x) > 0.6 && y < 0.3) return 'temporalLobe';

            return 'pfc';
        }
    };

    window.GreenhouseBrainMeshRealistic = GreenhouseBrainMeshRealistic;
})();
