// docs/js/genetic_geometry.js
// Dedicated geometry module for the Genetic application.
// Decoupled from Neuro to prevent cross-contamination of features.

(function () {
    'use strict';

    const GreenhouseGeneticGeometry = {

        /**
         * Initializes the brain shell, prioritizing the realistic mesh and falling back to a sphere.
         * @param {object} brainShell - The object to populate with vertices, faces, etc.
         */
        initializeBrainShell(brainShell) {
            // Use realistic brain mesh if available, as it provides the best visual fidelity.
            if (window.GreenhouseBrainMeshRealistic) {
                const realisticBrain = window.GreenhouseBrainMeshRealistic.generateRealisticBrain();
                brainShell.vertices = realisticBrain.vertices;
                brainShell.faces = realisticBrain.faces.map(face => ({ indices: face, region: null }));
                brainShell.regions = realisticBrain.regions;
                console.log('Genetic Geometry: Loaded realistic brain mesh.');

                // This computes region boundaries, which is useful for visualization.
                this.computeRegionsAndBoundaries(brainShell);
                return;
            }

            // Fallback to a basic sphere if the realistic mesh is not loaded.
            console.warn('Genetic Geometry: GreenhouseBrainMeshRealistic not found. Falling back to basic sphere.');
            this.generateFallbackSphere(brainShell);
        },

        /**
         * Generates a basic sphere as a fallback brain representation.
         * @param {object} brainShell - The object to populate.
         */
        generateFallbackSphere(brainShell) {
            const radius = 200;
            const latitudeBands = 30;
            const longitudeBands = 30;

            brainShell.vertices = [];
            brainShell.faces = [];
            brainShell.regions = {}; // Ensure regions is an object

            for (let lat = 0; lat <= latitudeBands; lat++) {
                const theta = (lat * Math.PI) / latitudeBands;
                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);

                for (let lon = 0; lon <= longitudeBands; lon++) {
                    const phi = (lon * 2 * Math.PI) / longitudeBands;
                    const x = radius * Math.cos(phi) * sinTheta;
                    const y = radius * Math.cos(theta);
                    const z = radius * Math.sin(phi) * sinTheta;
                    brainShell.vertices.push({ x, y, z });
                }
            }

            for (let lat = 0; lat < latitudeBands; lat++) {
                for (let lon = 0; lon < longitudeBands; lon++) {
                    const first = lat * (longitudeBands + 1) + lon;
                    const second = first + longitudeBands + 1;
                    brainShell.faces.push({ indices: [first, second, first + 1], region: null });
                    brainShell.faces.push({ indices: [second, second + 1, first + 1], region: null });
                }
            }
        },

        /**
         * Finds all vertex indices belonging to a specific named region.
         * This relies on the `brainShell.regions` object being populated correctly.
         * @param {object} brainShell - The fully initialized brain shell object.
         * @param {string} regionKey - The key of the region (e.g., 'pfc', 'amygdala').
         * @returns {number[]} An array of vertex indices.
         */
        getRegionVertices(brainShell, regionKey) {
            if (brainShell && brainShell.regions && brainShell.regions[regionKey]) {
                return brainShell.regions[regionKey].vertices || [];
            }
            return [];
        },

        /**
         * Computes region boundaries for visualization.
         * @param {object} brainShell - The brain shell object.
         */
        computeRegionsAndBoundaries(brainShell) {
            if (!brainShell || !brainShell.regions) return;

            // 1. Assign region to each vertex
            brainShell.vertices.forEach((v, i) => {
                v.region = null;
                for (const [name, data] of Object.entries(brainShell.regions)) {
                    if (data.vertices && data.vertices.includes(i)) {
                        v.region = name;
                        break;
                    }
                }
            });

            // 2. Assign region to each face based on its vertices
            brainShell.faces.forEach(face => {
                const v1 = brainShell.vertices[face.indices[0]];
                face.region = v1 ? v1.region : null;
            });
        },

        /**
         * Generates a tube-like mesh between two points, curving around a control point.
         * @param {object} p1 - Start point {x, y, z}.
         * @param {object} p2 - End point {x, y, z}.
         * @param {object} cp - Quadratic Bezier control point.
         * @param {number} radius - The radius of the tube.
         * @param {number} segments - Number of segments around the tube's circumference.
         * @returns {object} An object containing { vertices, faces }.
         */
        generateTubeMesh(p1, p2, cp, radius, segments) {
            // This is a complex geometry function that can be shared or kept specific.
            // For decoupling, we'll keep a copy here.
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
                const len = Math.sqrt(tx*tx + ty*ty + tz*tz);
                tx /= len; ty /= len; tz /= len;

                let ux = 0, uy = 1, uz = 0;
                if (Math.abs(ty) > 0.9) { ux = 1; uy = 0; }

                let bx = ty*uz - tz*uy, by = tz*ux - tx*uz, bz = tx*uy - ty*ux;
                const bLen = Math.sqrt(bx*bx + by*by + bz*bz);
                bx /= bLen; by /= bLen; bz /= bLen;

                let nx = by*tz - bz*ty, ny = bz*tx - bx*tz, nz = bx*ty - by*tx;

                for (let j = 0; j < segments; j++) {
                    const theta = (j / segments) * Math.PI * 2;
                    const vx = p.x + radius * (nx * Math.cos(theta) + bx * Math.sin(theta));
                    const vy = p.y + radius * (ny * Math.cos(theta) + by * Math.sin(theta));
                    const vz = p.z + radius * (nz * Math.cos(theta) + bz * Math.sin(theta));
                    vertices.push({ x: vx, y: vy, z: vz });
                }
            }

            for (let i = 0; i < steps; i++) {
                for (let j = 0; j < segments; j++) {
                    const nextJ = (j + 1) % segments;
                    const v1 = i * segments + j, v2 = i * segments + nextJ;
                    const v3 = (i + 1) * segments + nextJ, v4 = (i + 1) * segments + j;
                    faces.push([v1, v2, v3]);
                    faces.push([v1, v3, v4]);
                }
            }

            return { vertices, faces };
        }
    };

    window.GreenhouseGeneticGeometry = GreenhouseGeneticGeometry;

})();
