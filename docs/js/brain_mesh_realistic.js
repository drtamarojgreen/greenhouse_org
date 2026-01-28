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
            const latBands = 60; // Higher resolution for detail
            const lonBands = 60;

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

                    // Add cortical folds (gyri and sulci)
                    const folds = this.addCorticalFolds(x, y, z, baseRadius);
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
                    const region = this.determineRegion(x / baseRadius, y / baseRadius, z / baseRadius);

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

            // Define regions with labels
            brain.regions = {
                prefrontalCortex: {
                    name: 'Prefrontal Cortex',
                    color: 'rgba(100, 150, 255, 0.6)',
                    vertices: []
                },
                dlPFC: {
                    name: 'Dorsal PFC',
                    color: 'rgba(100, 180, 255, 0.7)',
                    vertices: []
                },
                vmPFC: {
                    name: 'Ventromedial PFC',
                    color: 'rgba(120, 160, 255, 0.7)',
                    vertices: []
                },
                ofc: {
                    name: 'Orbitofrontal Cortex',
                    color: 'rgba(80, 140, 255, 0.7)',
                    vertices: []
                },
                motorCortex: {
                    name: 'Motor Cortex',
                    color: 'rgba(255, 150, 100, 0.6)',
                    vertices: []
                },
                somatosensoryCortex: {
                    name: 'Somatosensory Cortex',
                    color: 'rgba(150, 255, 150, 0.6)',
                    vertices: []
                },
                parietalLobe: {
                    name: 'Parietal Lobe',
                    color: 'rgba(147, 112, 219, 0.6)',
                    vertices: []
                },
                temporalLobe: {
                    name: 'Temporal Lobe',
                    color: 'rgba(255, 165, 0, 0.6)',
                    vertices: []
                },
                occipitalLobe: {
                    name: 'Occipital Lobe',
                    color: 'rgba(255, 192, 203, 0.6)',
                    vertices: []
                },
                cerebellum: {
                    name: 'Cerebellum',
                    color: 'rgba(64, 224, 208, 0.6)',
                    vertices: []
                },
                brainstem: {
                    name: 'Brainstem',
                    color: 'rgba(255, 215, 0, 0.6)',
                    vertices: []
                },
                amygdala: {
                    name: 'Amygdala',
                    color: 'rgba(255, 100, 100, 0.6)',
                    vertices: []
                },
                hippocampus: {
                    name: 'Hippocampus',
                    color: 'rgba(100, 255, 150, 0.6)',
                    vertices: []
                },
                thalamus: {
                    name: 'Thalamus',
                    color: 'rgba(100, 150, 255, 0.6)',
                    vertices: []
                },
                hypothalamus: {
                    name: 'Hypothalamus',
                    color: 'rgba(255, 200, 100, 0.6)',
                    vertices: []
                },
                insula: {
                    name: 'Insula',
                    color: 'rgba(255, 100, 255, 0.6)',
                    vertices: []
                },
                acc: {
                    name: 'Anterior Cingulate Cortex',
                    color: 'rgba(100, 255, 255, 0.6)',
                    vertices: []
                },
                subgenualACC: {
                    name: 'Subgenual ACC (Area 25)',
                    color: 'rgba(80, 220, 220, 0.7)',
                    vertices: []
                },
                striatum: {
                    name: 'Striatum',
                    color: 'rgba(200, 100, 255, 0.6)',
                    vertices: []
                },
                nucleusAccumbens: {
                    name: 'Nucleus Accumbens',
                    color: 'rgba(180, 80, 255, 0.8)',
                    vertices: []
                },
                cortex: {
                    name: 'Cortex',
                    color: 'rgba(120, 120, 120, 0.3)',
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
         * Apply anatomical deformations to create realistic brain shape
         * @param {number} x - X coordinate (normalized)
         * @param {number} y - Y coordinate (normalized)
         * @param {number} z - Z coordinate (normalized)
         * @returns {Object} Deformed coordinates
         */
        applyAnatomicalDeformations(x, y, z) {
            // 1. Ellipsoidal shape (brain is not perfectly spherical)
            x *= 1.0;  // Width
            y *= 1.15; // Height (taller)
            z *= 1.1;  // Depth (slightly elongated front-to-back)

            // 2. Longitudinal fissure (split between hemispheres)
            if (y > 0.2) {
                const fissureDepth = Math.exp(-Math.abs(x) * 8) * 0.15;
                y *= (1 - fissureDepth);
            }

            // 3. Frontal lobe bulge (forehead area)
            if (z > 0.5 && y > -0.2) {
                const bulgeFactor = (z - 0.5) * 0.3;
                z *= (1 + bulgeFactor);
                y *= (1 + bulgeFactor * 0.2);
            }

            // 4. Occipital lobe (back of head)
            if (z < -0.4 && y > -0.1) {
                const bulgeFactor = (-z - 0.4) * 0.25;
                z *= (1 + bulgeFactor);
            }

            // 5. Temporal lobes (sides, lower)
            if (Math.abs(x) > 0.5 && y < 0.2 && y > -0.4 && z > -0.3 && z < 0.3) {
                const bulgeFactor = (Math.abs(x) - 0.5) * 0.4;
                x *= (1 + bulgeFactor * Math.sign(x));
                z *= (1 + bulgeFactor * 0.3);
            }

            // 6. Cerebellum (lower back, bulbous)
            if (y < -0.2 && z < -0.3) {
                const dist = Math.sqrt((y + 0.4) * (y + 0.4) + (z + 0.5) * (z + 0.5));
                if (dist < 0.4) {
                    const bulgeFactor = (0.4 - dist) * 0.8;
                    y *= (1 + bulgeFactor);
                    z *= (1 + bulgeFactor);
                    x *= (1 + bulgeFactor * 0.5);
                }
            }

            // 7. Brainstem (narrow bottom center)
            if (y < -0.5 && Math.abs(x) < 0.25 && Math.abs(z) < 0.25) {
                const taper = (y + 0.5) / -0.5; // 0 to 1
                x *= (1 - taper * 0.6);
                z *= (1 - taper * 0.6);
            }

            // 8. Flatten bottom slightly
            if (y < -0.6) {
                y *= 0.85;
            }

            return { x, y, z };
        },

        /**
         * Add cortical folds (gyri and sulci) for realistic appearance
         * @param {number} x - X coordinate
         * @param {number} y - Y coordinate
         * @param {number} z - Z coordinate
         * @param {number} baseRadius - Base radius
         * @returns {Object} Displacement vector
         */
        addCorticalFolds(x, y, z, baseRadius) {
            // Only add folds to cortex (upper regions)
            if (y < -0.2 * baseRadius) {
                return { x: 0, y: 0, z: 0 };
            }

            const nx = x / baseRadius;
            const ny = y / baseRadius;
            const nz = z / baseRadius;

            // Multiple frequency components for realistic folds
            let displacement = 0;

            // Large gyri (major folds)
            displacement += Math.sin(nx * 4 + nz * 3) * Math.cos(ny * 3) * 0.08;
            
            // Medium sulci (grooves)
            displacement += Math.sin(nx * 8 + nz * 6) * Math.cos(ny * 7) * 0.04;
            
            // Fine detail
            displacement += Math.sin(nx * 16 + nz * 12) * Math.cos(ny * 14) * 0.02;

            // Radial displacement (outward from center)
            const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
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
         * @param {number} x - Normalized X coordinate
         * @param {number} y - Normalized Y coordinate
         * @param {number} z - Normalized Z coordinate
         * @returns {string} Region name
         */
        determineRegion(x, y, z) {
            // Prefrontal Cortex Subdivisions
            if (z > 0.4) {
                if (y > 0.4) return 'dlPFC';
                if (y < 0.1 && y > -0.3) return 'ofc';
                if (Math.abs(x) < 0.2) return 'vmPFC';
                return 'prefrontalCortex';
            }

            // Motor Cortex (top front-center)
            if (y > 0.5 && z > 0 && z < 0.4) {
                return 'motorCortex';
            }

            // Somatosensory Cortex (top center-back)
            if (y > 0.5 && z < 0 && z > -0.3) {
                return 'somatosensoryCortex';
            }

            // Parietal Lobe (top back)
            if (y > 0.3 && z < -0.3) {
                return 'parietalLobe';
            }

            // Occipital Lobe (back)
            if (z < -0.5 && y > -0.2) {
                return 'occipitalLobe';
            }

            // Temporal Lobes (sides, lower)
            if (Math.abs(x) > 0.5 && y < 0.2 && y > -0.4 && z > -0.4 && z < 0.4) {
                return 'temporalLobe';
            }

            // Cerebellum (lower back)
            if (y < -0.2 && z < -0.3) {
                return 'cerebellum';
            }

            // Brainstem (bottom center)
            if (y < -0.5 && Math.abs(x) < 0.3 && Math.abs(z) < 0.3) {
                return 'brainstem';
            }

            // Thalamus (deep, center, slightly above mid)
            if (Math.abs(x) < 0.2 && y < 0.2 && y > -0.1 && Math.abs(z) < 0.2) {
                return 'thalamus';
            }

            // Hypothalamus (deep, center, below thalamus)
            if (Math.abs(x) < 0.15 && y <= -0.1 && y > -0.3 && Math.abs(z) < 0.15) {
                return 'hypothalamus';
            }

            // Amygdala (deep, center-side)
            if (Math.abs(x) > 0.2 && Math.abs(x) < 0.4 && y < 0.1 && y > -0.3 && Math.abs(z) < 0.2) {
                return 'amygdala';
            }

            // Hippocampus (deep, side, slightly back)
            if (Math.abs(x) > 0.3 && Math.abs(x) < 0.5 && y < 0 && y > -0.3 && z > -0.3 && z < 0.1) {
                return 'hippocampus';
            }

            // Insula (deep within lateral sulcus)
            if (Math.abs(x) > 0.4 && Math.abs(x) < 0.6 && y < 0.2 && y > -0.2 && z > -0.2 && z < 0.2) {
                return 'insula';
            }

            // Anterior Cingulate Cortex (ACC)
            if (Math.abs(x) < 0.15 && z > 0 && z < 0.5) {
                if (y > 0.1 && y < 0.4) return 'acc';
                if (y <= 0.1 && y > -0.2 && z > 0.2) return 'subgenualACC';
            }

            // Striatum
            if (Math.abs(x) > 0.15 && Math.abs(x) < 0.35 && y < 0.1 && y > -0.2 && z > 0.1 && z < 0.4) {
                if (y < 0 && z > 0.3) return 'nucleusAccumbens';
                return 'striatum';
            }

            // Default to general cortex
            return 'cortex';
        }
    };

    window.GreenhouseBrainMeshRealistic = GreenhouseBrainMeshRealistic;
})();
