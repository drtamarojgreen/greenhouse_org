/**
 * @file brain_mesh_realistic.js
 * @description Procedural generation of high-fidelity anatomical brain components.
 */

(function () {
    'use strict';

    const GreenhouseBrainMeshRealistic = {
        /**
         * Generates a multi-component brain mesh.
         * @returns {Object} { vertices: [], faces: [], regions: {} }
         */
        generateRealisticBrain() {
            const result = {
                vertices: [],
                faces: [],
                regions: {
                    'pfc': { vertices: [], color: 'rgba(52, 152, 219, 0.4)' },
                    'temporalLobe': { vertices: [], color: 'rgba(155, 89, 182, 0.4)' },
                    'parietalLobe': { vertices: [], color: 'rgba(46, 204, 113, 0.4)' },
                    'occipitalLobe': { vertices: [], color: 'rgba(231, 76, 60, 0.4)' },
                    'cerebellum': { vertices: [], color: 'rgba(241, 196, 15, 0.4)' },
                    'brainstem': { vertices: [], color: 'rgba(149, 165, 166, 0.4)' }
                }
            };

            // 1. Generate Hemispheres
            this.addHemisphere(result, 1, 'right');  // Right
            this.addHemisphere(result, -1, 'left'); // Left

            // 2. Generate Cerebellum
            this.addCerebellum(result);

            // 3. Generate Brain Stem
            this.addBrainStem(result);

            // 4. Compute Normals for all vertices
            this.computeNormals(result);

            return result;
        },

        addHemisphere(target, side, sideName) {
            const rings = 24, segments = 24;
            const offset = target.vertices.length;

            for (let i = 0; i <= rings; i++) {
                const phi = (i / rings) * Math.PI;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);

                for (let j = 0; j <= segments; j++) {
                    const theta = (j / segments) * Math.PI;
                    const sinTheta = Math.sin(theta);
                    const cosTheta = Math.cos(theta);

                    // Parametric ellipsoid for hemisphere
                    let x = 110 * sinPhi * sinTheta * side;
                    let y = 140 * cosPhi;
                    let z = 100 * sinPhi * cosTheta;

                    // Anatomical Shaping
                    if (y > 0) { x *= 1.1; z *= 0.9; } // Frontal
                    if (y < 20 && y > -60) { x *= 1.25; z *= 1.1; } // Temporal
                    if (y < -80) { x *= 0.85; z *= 0.8; } // Occipital

                    // Fissure separation
                    x += 8 * side;

                    // Sulci indentation
                    const noise = this.getSulciNoise(x, y, z);
                    x += noise.dx; y += noise.dy; z += noise.dz;

                    const vIdx = target.vertices.length;
                    target.vertices.push({ x, y, z, normal: { x: 0, y: 0, z: 0 } });

                    // Assign to regions based on coordinates
                    if (y > 40) target.regions['pfc'].vertices.push(vIdx);
                    else if (y < -70) target.regions['occipitalLobe'].vertices.push(vIdx);
                    else if (z < -30) target.regions['temporalLobe'].vertices.push(vIdx);
                    else target.regions['parietalLobe'].vertices.push(vIdx);
                }
            }

            for (let i = 0; i < rings; i++) {
                for (let j = 0; j < segments; j++) {
                    const a = offset + i * (segments + 1) + j;
                    const b = offset + (i + 1) * (segments + 1) + j;
                    const c = offset + (i + 1) * (segments + 1) + (j + 1);
                    const d = offset + i * (segments + 1) + j + 1;

                    if (side > 0) {
                        target.faces.push([a, b, d], [b, c, d]);
                    } else {
                        target.faces.push([a, d, b], [d, c, b]);
                    }
                }
            }
        },

        addCerebellum(target) {
            const offset = target.vertices.length;
            const rings = 12, segments = 12;

            for (let i = 0; i <= rings; i++) {
                const phi = (i / rings) * Math.PI;
                for (let j = 0; j <= segments; j++) {
                    const theta = (j / segments) * Math.PI * 2;
                    let x = 70 * Math.sin(phi) * Math.cos(theta);
                    let y = -110 + 30 * Math.cos(phi);
                    let z = -60 + 50 * Math.sin(phi) * Math.sin(theta);

                    const vIdx = target.vertices.length;
                    target.vertices.push({ x, y, z, normal: { x: 0, y: 0, z: 0 } });
                    target.regions['cerebellum'].vertices.push(vIdx);
                }
            }

            for (let i = 0; i < rings; i++) {
                for (let j = 0; j < segments; j++) {
                    const a = offset + i * (segments + 1) + j;
                    const b = offset + (i + 1) * (segments + 1) + j;
                    const c = offset + (i + 1) * (segments + 1) + (j + 1);
                    const d = offset + i * (segments + 1) + j + 1;
                    target.faces.push([a, b, d], [b, c, d]);
                }
            }
        },

        addBrainStem(target) {
            const offset = target.vertices.length;
            const rings = 8, segments = 8;

            for (let i = 0; i <= rings; i++) {
                const u = i / rings;
                const r = 25 * (1 - u * 0.4);
                for (let j = 0; j <= segments; j++) {
                    const v = j / segments;
                    const theta = v * Math.PI * 2;
                    let x = r * Math.cos(theta);
                    let y = -130 - u * 100;
                    let z = -30 + r * Math.sin(theta);

                    const vIdx = target.vertices.length;
                    target.vertices.push({ x, y, z, normal: { x: 0, y: 0, z: 0 } });
                    target.regions['brainstem'].vertices.push(vIdx);
                }
            }

            for (let i = 0; i < rings; i++) {
                for (let j = 0; j < segments; j++) {
                    const a = offset + i * (segments + 1) + j;
                    const b = offset + (i + 1) * (segments + 1) + j;
                    const c = offset + (i + 1) * (segments + 1) + (j + 1);
                    const d = offset + i * (segments + 1) + j + 1;
                    target.faces.push([a, b, d], [b, c, d]);
                }
            }
        },

        getSulciNoise(x, y, z) {
            const freq = 0.04;
            const amp = 3.5;
            const d = amp * Math.sin(x * freq) * Math.cos(y * freq) * Math.sin(z * freq);
            return { dx: d, dy: d, dz: d };
        },

        computeNormals(target) {
            target.faces.forEach(face => {
                const v0 = target.vertices[face[0]];
                const v1 = target.vertices[face[1]];
                const v2 = target.vertices[face[2]];
                if (!v0 || !v1 || !v2) return;
                const edge1 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
                const edge2 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };
                const nx = edge1.y * edge2.z - edge1.z * edge2.y;
                const ny = edge1.z * edge2.x - edge1.x * edge2.z;
                const nz = edge1.x * edge2.y - edge1.y * edge2.x;
                face.forEach(idx => {
                    target.vertices[idx].normal.x += nx;
                    target.vertices[idx].normal.y += ny;
                    target.vertices[idx].normal.z += nz;
                });
            });
            target.vertices.forEach(v => {
                const mag = Math.sqrt(v.normal.x**2 + v.normal.y**2 + v.normal.z**2) || 1;
                v.normal.x /= mag; v.normal.y /= mag; v.normal.z /= mag;
            });
        }
    };

    window.GreenhouseBrainMeshRealistic = GreenhouseBrainMeshRealistic;
})();
