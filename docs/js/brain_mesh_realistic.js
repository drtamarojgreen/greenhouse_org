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
                regions: {
                    // Unified Registry supporting all model keys
                    pfc: { name: 'Prefrontal Cortex', color: 'rgba(255, 225, 220, 0.25)', vertices: [] },
                    frontal: { name: 'Frontal Lobe', color: 'rgba(255, 225, 220, 0.25)', vertices: [] },
                    motorCortex: { name: 'Motor Cortex', color: 'rgba(255, 225, 220, 0.25)', vertices: [] },
                    somatosensoryCortex: { name: 'Somatosensory Cortex', color: 'rgba(255, 225, 220, 0.25)', vertices: [] },
                    parietalLobe: { name: 'Parietal Lobe', color: 'rgba(255, 225, 220, 0.25)', vertices: [] },
                    parietal: { name: 'Parietal Lobe', color: 'rgba(255, 225, 220, 0.25)', vertices: [] },
                    temporalLobe: { name: 'Temporal Lobe', color: 'rgba(255, 225, 220, 0.25)', vertices: [] },
                    temporal: { name: 'Temporal Lobe', color: 'rgba(255, 225, 220, 0.25)', vertices: [] },
                    occipitalLobe: { name: 'Occipital Lobe', color: 'rgba(255, 225, 220, 0.25)', vertices: [] },
                    occipital: { name: 'Occipital Lobe', color: 'rgba(255, 225, 220, 0.25)', vertices: [] },
                    cerebellum: { name: 'Cerebellum', color: 'rgba(255, 182, 193, 0.2)', vertices: [] },
                    brainstem: { name: 'Brainstem', color: 'rgba(135, 206, 250, 0.2)', vertices: [] },
                    amygdala: { name: 'Amygdala', color: 'rgba(165, 42, 42, 0.2)', vertices: [] },
                    hippocampus: { name: 'Hippocampus', color: 'rgba(165, 42, 42, 0.2)', vertices: [] },
                    thalamus: { name: 'Thalamus', color: 'rgba(165, 42, 42, 0.2)', vertices: [] },
                    hypothalamus: { name: 'Hypothalamus', color: 'rgba(165, 42, 42, 0.2)', vertices: [] },
                    striatum: { name: 'Striatum', color: 'rgba(165, 42, 42, 0.2)', vertices: [] },
                    basal_ganglia: { name: 'Basal Ganglia', color: 'rgba(165, 42, 42, 0.2)', vertices: [] },
                    insula: { name: 'Insula', color: 'rgba(165, 42, 42, 0.2)', vertices: [] },
                    cingulate: { name: 'Cingulate Cortex', color: 'rgba(165, 42, 42, 0.2)', vertices: [] },
                    vta: { name: 'Ventral Tegmental Area', color: 'rgba(165, 42, 42, 0.2)', vertices: [] },
                    vagus_nerve: { name: 'Vagus Nerve', color: 'rgba(0, 255, 128, 0.2)', vertices: [] },
                    optic_nerve: { name: 'Optic Nerve', color: 'rgba(135, 206, 250, 0.2)', vertices: [] },
                    corpusCallosum: { name: 'Corpus Callosum', color: 'rgba(135, 206, 250, 0.2)', vertices: [] },
                    lateralVentricle: { name: 'Lateral Ventricle', color: 'rgba(165, 42, 42, 0.2)', vertices: [] },
                    pituitaryGland: { name: 'Pituitary Gland', color: 'rgba(30, 144, 255, 0.2)', vertices: [] },
                    mammillaryBody: { name: 'Mammillary Body', color: 'rgba(255, 255, 255, 0.2)', vertices: [] },
                    dlPFC: { name: 'Dorsolateral PFC', color: 'rgba(255, 225, 220, 0.25)', vertices: [] },
                    vmPFC: { name: 'Ventromedial PFC', color: 'rgba(255, 225, 220, 0.25)', vertices: [] },
                    ofc: { name: 'Orbitofrontal Cortex', color: 'rgba(255, 225, 220, 0.25)', vertices: [] },
                    acc: { name: 'Anterior Cingulate', color: 'rgba(165, 42, 42, 0.2)', vertices: [] }
                }
            };

            // Parameters for realistic brain shape
            // Increased density for anatomical fidelity
            const baseRadius = 200;
            const latBands = 120;
            const lonBands = 120;

            // Generate layers: Internal structures first, then Cortex
            const layers = [
                { name: 'Internal', radius: 0.45 * baseRadius, latBands: 60, lonBands: 60 },
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

                        brain.faces.push({ indices: [first, second, first + 1] });
                        brain.faces.push({ indices: [second, second + 1, first + 1] });
                    }
                }
            });

            // Recalculate vertex normals with angle weighting
            this.computeWeightedNormals(brain);

            // Apply adaptive subdivision where curvature is high
            this.applyAdaptiveSubdivision(brain, 0.12);

            // Precompute curvature maps
            this.computeCurvatureMap(brain);

            // Populate region vertex indices and calculate centroids
            brain.vertices.forEach((v, i) => {
                if (v.region && brain.regions[v.region]) {
                    brain.regions[v.region].vertices.push(i);
                }
            });

            // Calculate Centroids for cross-model flow logic
            for (const key in brain.regions) {
                const reg = brain.regions[key];
                if (reg.vertices.length > 0) {
                    let cx = 0, cy = 0, cz = 0;
                    reg.vertices.forEach(vIdx => {
                        cx += brain.vertices[vIdx].x;
                        cy += brain.vertices[vIdx].y;
                        cz += brain.vertices[vIdx].z;
                    });
                    reg.centroid = {
                        x: cx / reg.vertices.length,
                        y: cy / reg.vertices.length,
                        z: cz / reg.vertices.length
                    };
                }
            }

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
                const indices = f.indices || f;
                const pairs = [[indices[0], indices[1]], [indices[1], indices[2]], [indices[2], indices[0]]];
                pairs.forEach(([i1, i2]) => {
                    const v1 = vertices[i1];
                    const v2 = vertices[i2];
                    if (!v1 || !v2 || !v1.normal || !v2.normal) return;

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
                const indices = f.indices || f;
                const i0 = indices[0], i1 = indices[1], i2 = indices[2];
                const v0 = vertices[i0], v1 = vertices[i1], v2 = vertices[i2];

                if (!v0 || !v1 || !v2 || !v0.normal || !v1.normal || !v2.normal) {
                    newFaces.push(f);
                    continue;
                }

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
                            region: va.region || vb.region
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

                    newFaces.push({ indices: [i0, m01, m20] });
                    newFaces.push({ indices: [i1, m12, m01] });
                    newFaces.push({ indices: [i2, m20, m12] });
                    newFaces.push({ indices: [m01, m12, m20] });
                } else {
                    newFaces.push({ indices: indices });
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
                const indices = f.indices || f;
                const i0 = indices[0], i1 = indices[1], i2 = indices[2];
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
            // Refined human brain proportions: Approx L:W:H = 1.0:0.85:0.75
            // Normalizing to Z (Length) as 1.4, X (Width) as 1.2, Y (Height) as 1.05
            x *= 1.2; y *= 1.05; z *= 1.4;

            // 1. Longitudinal fissure (Deep separation between hemispheres)
            // Softened the indentation to avoid a "cloven" or "mechanical" split
            const fissureSharpness = 12;
            const fissureDepth = 0.45;
            const fissureEffect = Math.exp(-Math.abs(x) * fissureSharpness) * fissureDepth;

            // Fissure indents from top (y > 0) and bottom (y < 0)
            if (Math.abs(y) > 0.1) {
                const yFactor = Math.abs(y) / 1.05;
                y *= (1 - fissureEffect * yFactor);
            }

            // 2. Lateral Sulcus (Sylvian Fissure) - Deep side indents
            if (Math.abs(y) < 0.35 && z > -0.2 && z < 0.5) {
                const sulcusEffect = Math.exp(-Math.abs(y + 0.1) * 8) * 0.35;
                if (Math.abs(x) > 0.4) {
                    x *= (1 - sulcusEffect);
                }
            }

            // 3. Frontal Lobe (Blunt, broad anterior region)
            if (z > 0.3) {
                const frontalTaper = Math.pow(z - 0.3, 0.7) * 0.4;
                z += frontalTaper;
                x *= (1 + frontalTaper * 0.3); // Broaden
                y *= (1 + frontalTaper * 0.1); // Slightly taller
            }

            // 4. Temporal Lobes (Bulging anterior-lateral 'hangs')
            if (Math.abs(x) > 0.5 && z > -0.3 && z < 0.4) {
                const tWeight = (Math.abs(x) - 0.5) * (z + 0.3) * 1.5;
                if (tWeight > 0 && y < 0.1) {
                    x *= (1 + tWeight * 0.4);
                    y -= tWeight * 0.3; // Distinct downward 'hang'
                }
            }

            // 5. Occipital Lobe (Distinct posterior taper)
            if (z < -0.4) {
                const occipitalEffect = (-z - 0.4) * 0.5;
                x *= (1 - occipitalEffect * 0.6);
                y *= (1 - occipitalEffect * 0.3);
                z -= occipitalEffect * 0.2;
            }

            // 6. Cerebellum (Tucked underneath the occipital lobe)
            if (y < -0.2 && z < -0.35) {
                const cX = x, cY = y + 0.5, cZ = z + 0.75;
                const distToCereb = Math.sqrt(cX*cX + cY*cY + cZ*cZ);
                if (distToCereb < 0.5) {
                    const cBulge = (0.5 - distToCereb) * 0.8;
                    x *= (1 + cBulge * 1.2);
                    y *= (1 + cBulge * 0.8);
                    z *= (1 + cBulge * 0.5);
                }

                // Horizontal separation indent between cerebrum and cerebellum
                if (y > -0.45 && y < -0.25) {
                    const sepEffect = Math.exp(-Math.pow(y + 0.35, 2) * 100) * 0.2;
                    z *= (1 - sepEffect);
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
            const internalRegions = ['corpusCallosum', 'lateralVentricle', 'thalamus', 'hypothalamus', 'pituitaryGland', 'mammillaryBody', 'brainstem', 'vagus_nerve', 'optic_nerve'];
            if (internalRegions.includes(region)) {
                return { x: 0, y: 0, z: 0 };
            }

            const nx = x / baseRadius, ny = y / baseRadius, nz = z / baseRadius;
            let displacement = 0, freqMult = 1.0, ampMult = 1.0;

            switch (region) {
                case 'pfc':
                    freqMult = 1.3; ampMult = 1.2; break;
                case 'cerebellum':
                    freqMult = 3.5; ampMult = 0.6; break;
                case 'temporalLobe':
                    freqMult = 0.9; ampMult = 1.0; break;
                case 'occipitalLobe':
                    freqMult = 1.6; ampMult = 0.9; break;
            }

            // Labyrinthine Folding Algorithm (Domain Warping)
            // Uses recursive coordinate perturbation to create winding, biological gyri
            const baseFreq = 7 * freqMult;

            const noise = (fx, fy, fz, freq, amp, angle) => {
                const s = Math.sin(angle), c = Math.cos(angle);

                // Domain Warping: Perturb input coordinates to break grid regularity
                const pfx = fx + Math.sin(fy * 4 + angle) * 0.15;
                const pfy = fy + Math.cos(fz * 4 + angle * 1.2) * 0.15;
                const pfz = fz + Math.sin(fx * 4 + angle * 0.8) * 0.15;

                const rx = pfx * c - pfz * s;
                const rz = pfx * s + pfz * c;
                const v = Math.sin(rx * freq) * Math.cos(pfy * freq * 1.1) * Math.sin(rz * freq * 0.9);

                // Create rounded ridges (gyri) and organic valleys (sulci)
                // Non-linear scaling ensures they don't look like mechanical "fins"
                return (v > 0) ? Math.pow(v, 0.6) * amp : -Math.pow(Math.abs(v), 1.1) * amp;
            };

            displacement += noise(nx, ny, nz, baseFreq, 0.11 * ampMult, 0.4);
            displacement += noise(nx, ny, nz, baseFreq * 1.7, 0.06 * ampMult, 1.2);
            displacement += noise(nx, ny, nz, baseFreq * 3.1, 0.03 * ampMult, 2.5);

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
         * Mapped to schematic_human_brain_t.jpg spatial relationships and cross-model logic.
         */
        determineRegion(x, y, z, layerName) {
            // Normalize internal coordinates
            const nx = x, ny = y, nz = z;

            // Vagus Nerve (Thin procedural strand hanging down from brainstem)
            if (Math.abs(nx) < 0.05 && ny < -0.7) return 'vagus_nerve';

            // Optic Nerve (Small bilateral protrusions at front base)
            if (Math.abs(nx) < 0.1 && nz > 0.4 && ny < -0.3) return 'optic_nerve';

            // Midline structures (Corpus Callosum, Ventricles, Thalamus, etc.)
            if (Math.abs(nx) < 0.4) {
                // Pituitary Gland (hangs off hypothalamus at front)
                if (ny <= -0.3 && ny > -0.8 && nz > 0.1 && nz < 0.8) return 'pituitaryGland';

                // Cingulate Cortex (Above corpus callosum)
                if (ny > 0.4 && ny < 0.7 && nz > -0.3 && nz < 0.6) return 'cingulate';
                if (ny > 0.1 && ny < 0.4 && nz > 0.2 && nz < 0.6) return 'acc';

                // Corpus Callosum (C-shape)
                const distToCallosumCenter = Math.sqrt((ny - 0.2)**2 + (nz - 0.1)**2);
                if (distToCallosumCenter > 0.2 && distToCallosumCenter < 0.45 && ny > 0.1 && nz > -0.4 && nz < 0.6) {
                    return 'corpusCallosum';
                }

                // Lateral Ventricle (just below callosum)
                if (distToCallosumCenter < 0.2 && ny > 0 && nz > -0.2 && nz < 0.4) {
                    return 'lateralVentricle';
                }

                // Thalamus (Central Egg shape)
                const distToThalamus = Math.sqrt(nx*nx + (ny + 0.1)**2 + (nz - 0.1)**2);
                if (distToThalamus < 0.35) return 'thalamus';

                // Hypothalamus (below thalamus)
                if (ny <= -0.1 && ny > -0.4 && nz > 0 && nz < 0.4) return 'hypothalamus';

                // VTA (Small area below/behind hypothalamus)
                if (ny < -0.3 && ny > -0.5 && nz > -0.2 && nz < 0.1) return 'vta';

                // Mammillary Body
                if (ny <= -0.35 && ny > -0.55 && nz > 0 && nz < 0.25) return 'mammillaryBody';

                // Brainstem (protruding downwards)
                if (ny < -0.4 && nz < 0.2) return 'brainstem';
            }

            // Cerebellum (Lower posterior)
            if (ny < -0.2 && nz < -0.4) return 'cerebellum';

            // Subcortical (deeper temporal / lateral midline)
            if (Math.abs(nx) > 0.15 && Math.abs(nx) < 0.6 && ny < 0.2 && ny > -0.5) {
                // Striatum (Lateral to thalamus)
                if (Math.abs(nx) < 0.4 && nz > 0 && nz < 0.5 && ny > -0.2) {
                    // Basal ganglia is the superset
                    return Math.random() > 0.5 ? 'striatum' : 'basal_ganglia';
                }
                // Insula (Deep within Sylvian fissure)
                if (Math.abs(nx) > 0.4 && nz > -0.2 && nz < 0.3) return 'insula';
                // Limbic
                if (nz > -0.3 && nz < 0.3 && ny < 0) return 'hippocampus';
                if (nz > 0.2 && nz < 0.6 && ny < 0.1) return 'amygdala';
            }

            // Cortex regions
            if (nz > 0.6) {
                // Frontal Lobe subdivisions
                if (ny > 0.4) return 'dlPFC';
                if (ny < 0.1 && ny > -0.3) return 'ofc';
                if (Math.abs(nx) < 0.2) return 'vmPFC';
                return Math.random() > 0.5 ? 'pfc' : 'frontal';
            }
            if (ny > 0.6) {
                if (nz > 0) return 'motorCortex';
                return 'somatosensoryCortex';
            }
            if (ny > 0.3 && nz < -0.3) return Math.random() > 0.5 ? 'parietalLobe' : 'parietal';
            if (nz < -0.6) return Math.random() > 0.5 ? 'occipitalLobe' : 'occipital';
            if (Math.abs(nx) > 0.6 && ny < 0.3) return Math.random() > 0.5 ? 'temporalLobe' : 'temporal';

            return 'pfc';
        }
    };

    window.GreenhouseBrainMeshRealistic = GreenhouseBrainMeshRealistic;
})();
