// docs/js/brain_mesh_realistic.js
// Anatomically Realistic Brain Mesh Generator

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
            // Item 1: Increase base mesh resolution (80x80)
            const latBands = 80;
            const lonBands = 80;

            // Ensure geometry dependencies are ready
            if (!window.GreenhouseModels3DMath) {
                console.warn('Realistic Brain: 3D Math not available during generation.');
            }

            // Generate base ellipsoid with anatomical proportions
            for (let lat = 0; lat <= latBands; lat++) {
                const theta = (lat * Math.PI) / latBands;
                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);

                for (let lon = 0; lon <= lonBands; lon++) {
                    const phi = (lon * 2 * Math.PI) / lonBands;
                    const sinPhi = Math.sin(phi);
                    const cosPhi = Math.cos(phi);

                    // Start with unit sphere coordinates
                    let x = cosPhi * sinTheta;
                    let y = cosTheta;
                    let z = sinPhi * sinTheta;

                    // Apply anatomical deformations
                    const deformed = this.applyAnatomicalDeformations(x, y, z);
                    x = deformed.x * baseRadius;
                    y = deformed.y * baseRadius;
                    z = deformed.z * baseRadius;

                    // Determine region
                    let region = this.determineRegion(x / baseRadius, y / baseRadius, z / baseRadius);

                    // Add cortical folds (gyri and sulci)
                    const folds = this.addCorticalFolds(x, y, z, baseRadius, region);
                    x += folds.x;
                    y += folds.y;
                    z += folds.z;

                    // Calculate normal (approximate)
                    const len = Math.sqrt(x * x + y * y + z * z);
                    const normal = {
                        x: x / len,
                        y: y / len,
                        z: z / len
                    };

                    // Determine region
                    region = this.determineRegion(x / baseRadius, y / baseRadius, z / baseRadius);

                    brain.vertices.push({ x, y, z, normal, region });
                }
            }

            // Generate faces (triangles)
            for (let lat = 0; lat < latBands; lat++) {
                for (let lon = 0; lon < lonBands; lon++) {
                    const first = lat * (lonBands + 1) + lon;
                    const second = first + lonBands + 1;

                    brain.faces.push([first, second, first + 1]);
                    brain.faces.push([second, second + 1, first + 1]);
                }
            }

            // Item 3: Recalculate vertex normals with angle weighting
            this.computeWeightedNormals(brain);

            // Item 2: Apply adaptive subdivision where curvature is high
            this.applyAdaptiveSubdivision(brain, 0.15);

            // Item 57: Precompute curvature maps
            this.computeCurvatureMap(brain);

            // Define regions with labels - Anatomically correct monochromatic hierarchy
            brain.regions = {
                pfc: {
                    name: 'Prefrontal Cortex',
                    color: 'rgba(224, 224, 224, 0.6)',
                    vertices: []
                },
                motorCortex: {
                    name: 'Motor Cortex',
                    color: 'rgba(210, 210, 210, 0.6)',
                    vertices: []
                },
                somatosensoryCortex: {
                    name: 'Somatosensory Cortex',
                    color: 'rgba(200, 200, 200, 0.6)',
                    vertices: []
                },
                parietalLobe: {
                    name: 'Parietal Lobe',
                    color: 'rgba(190, 190, 190, 0.6)',
                    vertices: []
                },
                temporalLobe: {
                    name: 'Temporal Lobe',
                    color: 'rgba(180, 180, 180, 0.6)',
                    vertices: []
                },
                occipitalLobe: {
                    name: 'Occipital Lobe',
                    color: 'rgba(140, 140, 140, 0.6)',
                    vertices: []
                },
                cerebellum: {
                    name: 'Cerebellum',
                    color: 'rgba(120, 120, 120, 0.6)',
                    vertices: []
                },
                brainstem: {
                    name: 'Brainstem',
                    color: 'rgba(100, 100, 100, 0.6)',
                    vertices: []
                },
                amygdala: {
                    name: 'Amygdala',
                    color: 'rgba(160, 160, 160, 0.6)',
                    vertices: []
                },
                hippocampus: {
                    name: 'Hippocampus',
                    color: 'rgba(160, 160, 160, 0.6)',
                    vertices: []
                },
                thalamus: {
                    name: 'Thalamus',
                    color: 'rgba(150, 150, 150, 0.6)',
                    vertices: []
                },
                hypothalamus: {
                    name: 'Hypothalamus',
                    color: 'rgba(150, 150, 150, 0.6)',
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
         * Item 57: Precompute curvature map for stylistic overlays
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
         * Item 2: Apply adaptive subdivision where curvature exceeds a threshold
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
         * Item 3: Compute vertex normals using angle-weighted averaging
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
            x *= 1.0; y *= 1.15; z *= 1.1;

            if (y > 0.2) {
                const fissureDepth = Math.exp(-Math.abs(x) * 8) * 0.15;
                y *= (1 - fissureDepth);
            }

            if (z > 0.5 && y > -0.2) {
                const bulgeFactor = (z - 0.5) * 0.3;
                z *= (1 + bulgeFactor);
                y *= (1 + bulgeFactor * 0.2);
            }

            if (z < -0.4 && y > -0.1) {
                const bulgeFactor = (-z - 0.4) * 0.25;
                z *= (1 + bulgeFactor);
            }

            if (Math.abs(x) > 0.5 && y < 0.2 && y > -0.4 && z > -0.3 && z < 0.3) {
                const bulgeFactor = (Math.abs(x) - 0.5) * 0.4;
                x *= (1 + bulgeFactor * Math.sign(x));
                z *= (1 + bulgeFactor * 0.3);
            }

            if (y < -0.2 && z < -0.3) {
                const dist = Math.sqrt((y + 0.4)**2 + (z + 0.5)**2);
                if (dist < 0.4) {
                    const bulgeFactor = (0.4 - dist) * 0.8;
                    y *= (1 + bulgeFactor);
                    z *= (1 + bulgeFactor);
                    x *= (1 + bulgeFactor * 0.5);
                }
            }

            if (y < -0.5 && Math.abs(x) < 0.25 && Math.abs(z) < 0.25) {
                const taper = (y + 0.5) / -0.5;
                x *= (1 - taper * 0.6);
                z *= (1 - taper * 0.6);
            }

            if (y < -0.6) y *= 0.85;

            return { x, y, z };
        },

        /**
         * Add cortical folds (gyri and sulci) for realistic appearance
         */
        addCorticalFolds(x, y, z, baseRadius, region) {
            if (y < -0.2 * baseRadius && region !== 'cerebellum') {
                return { x: 0, y: 0, z: 0 };
            }

            const nx = x / baseRadius, ny = y / baseRadius, nz = z / baseRadius;
            let displacement = 0, freqMult = 1.0, ampMult = 1.0;

            switch (region) {
                case 'pfc':
                case 'prefrontalCortex':
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
         */
        determineRegion(x, y, z) {
            if (z > 0.4 && y > 0.1) return 'pfc';
            if (y > 0.5 && z > 0 && z < 0.4) return 'motorCortex';
            if (y > 0.5 && z < 0 && z > -0.3) return 'somatosensoryCortex';
            if (y > 0.3 && z < -0.3) return 'parietalLobe';
            if (z < -0.5 && y > -0.2) return 'occipitalLobe';
            if (Math.abs(x) > 0.5 && y < 0.2 && y > -0.4 && z > -0.4 && z < 0.4) return 'temporalLobe';
            if (y < -0.2 && z < -0.3) return 'cerebellum';
            if (y < -0.5 && Math.abs(x) < 0.3 && Math.abs(z) < 0.3) return 'brainstem';
            if (Math.abs(x) < 0.2 && y < 0.2 && y > -0.1 && Math.abs(z) < 0.2) return 'thalamus';
            if (Math.abs(x) < 0.15 && y <= -0.1 && y > -0.3 && Math.abs(z) < 0.15) return 'hypothalamus';
            if (Math.abs(x) > 0.2 && Math.abs(x) < 0.4 && y < 0.1 && y > -0.3 && Math.abs(z) < 0.2) return 'amygdala';
            if (Math.abs(x) > 0.3 && Math.abs(x) < 0.5 && y < 0 && y > -0.3 && z > -0.3 && z < 0.1) return 'hippocampus';
            return 'pfc';
        }
    };

    window.GreenhouseBrainMeshRealistic = GreenhouseBrainMeshRealistic;
})();
