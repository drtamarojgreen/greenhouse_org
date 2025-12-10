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

        generateChromosomeMesh() {
            // X-Shaped Chromosome (Two crossed, slightly bent capsules)
            const vertices = [];
            const faces = [];
            const radius = 20;
            const length = 120;
            const segments = 10;
            const rings = 20;

            // Helper to generate a bent capsule (arm)
            // angleOffset: rotation around Y axis
            // bendFactor: how much it curves
            const generateArm = (angleOffset, bendFactor, yOffset) => {
                for (let i = 0; i <= rings; i++) {
                    const t = i / rings; // 0 to 1
                    // t=0.5 is the center (centromere)

                    // Shape profile: Thicker at ends, thinner at centromere
                    const profile = 1.0 + Math.pow(Math.abs(t - 0.5) * 2, 2) * 0.5;
                    const r = radius * profile;

                    // Position along the arm length
                    // Centered at 0
                    const lPos = (t - 0.5) * length * 2;

                    // Bend logic: x = lPos, z = bend based on x
                    let x = lPos;
                    let y = yOffset;
                    let z = Math.pow(lPos / length, 2) * bendFactor;

                    // Rotate around Y
                    const cos = Math.cos(angleOffset);
                    const sin = Math.sin(angleOffset);
                    const rx = x * cos - z * sin;
                    const rz = x * sin + z * cos;

                    x = rx;
                    z = rz;

                    // Generate Ring
                    for (let j = 0; j < segments; j++) {
                        const theta = (j / segments) * Math.PI * 2;
                        // Normal to the tube direction (approximate)
                        // Ideally we calculate Frenet frame, but for simple bend, simple normal works
                        const nx = Math.cos(theta);
                        const ny = Math.sin(theta);

                        // Add vertex
                        vertices.push({
                            x: x + nx * r,
                            y: y + ny * r,
                            z: z
                        });
                    }
                }
            };

            // Generate two chromatids
            // Chromatid 1
            generateArm(Math.PI / 6, 20, 0);
            // Chromatid 2 (Crossed)
            generateArm(-Math.PI / 6, 20, 0);

            // Generate Faces (Grid)
            // We have 2 arms. Each arm has (rings+1) * segments vertices.
            const vertsPerArm = (rings + 1) * segments;

            for (let arm = 0; arm < 2; arm++) {
                const offset = arm * vertsPerArm;
                for (let i = 0; i < rings; i++) {
                    for (let j = 0; j < segments; j++) {
                        const current = offset + i * segments + j;
                        const next = offset + (i + 1) * segments + j;
                        const nextJ = (j + 1) % segments;

                        const v1 = current;
                        const v2 = offset + i * segments + nextJ;
                        const v3 = offset + (i + 1) * segments + nextJ;
                        const v4 = next;

                        faces.push([v1, v2, v3]);
                        faces.push([v1, v3, v4]);
                    }
                }
            }

            return { vertices, faces };
        }
    };

    window.GreenhouseGeneticGeometry = GreenhouseGeneticGeometry;
})();
