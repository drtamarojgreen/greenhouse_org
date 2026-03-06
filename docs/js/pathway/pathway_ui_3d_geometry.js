(function () {
    'use strict';

    const GreenhousePathwayGeometry = {

        initializeBrainShell(brainShell) {
            // Realistic realistic brain mesh if available
            if (window.GreenhouseBrainMeshRealistic) {
                const realisticBrain = window.GreenhouseBrainMeshRealistic.generateRealisticBrain();
                brainShell.vertices = realisticBrain.vertices;
                brainShell.faces = realisticBrain.faces.map(face => ({ indices: face, region: null }));
                brainShell.regions = realisticBrain.regions;
                this.computeRegionsAndBoundaries(brainShell);
                return;
            }

            const radius = 200;
            const latitudeBands = 40;
            const longitudeBands = 40;

            for (let lat = 0; lat <= latitudeBands; lat++) {
                const theta = (lat * Math.PI) / latitudeBands;
                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);

                for (let lon = 0; lon <= longitudeBands; lon++) {
                    const phi = (lon * 2 * Math.PI) / longitudeBands;
                    const sinPhi = Math.sin(phi);
                    const cosPhi = Math.cos(phi);

                    let x = cosPhi * sinTheta * radius;
                    let y = cosTheta * radius;
                    let z = sinPhi * sinTheta * radius;

                    // Brain Shape Deformations
                    const fissure = 1 - Math.exp(-Math.abs(x / radius) * 5) * 0.3;
                    if (y > 0) y *= fissure;

                    // Assign Region Category based on spatial position
                    let region = 'pfc';
                    const ny = y / radius;
                    const nz = z / radius;
                    if (ny < -0.4) region = 'brain_stem';
                    else if (ny < -0.1 && nz > 0.1) region = 'hypothalamus';
                    else if (ny < -0.6) region = 'raphe';
                    else if (nz < -0.4) region = 'occipital';
                    else if (Math.abs(ny) < 0.2 && Math.abs(nz) < 0.2) region = 'thalamus';

                    brainShell.vertices.push({ x, y, z, region });
                }
            }

            for (let lat = 0; lat < latitudeBands; lat++) {
                for (let lon = 0; lon < longitudeBands; lon++) {
                    const first = lat * (longitudeBands + 1) + lon;
                    const second = first + longitudeBands + 1;

                    // Assign region to face based on first vertex
                    const region = brainShell.vertices[first].region;
                    brainShell.faces.push({ indices: [first, second, first + 1], region });
                    brainShell.faces.push({ indices: [second, second + 1, first + 1], region });
                }
            }
        },

        initializeTorsoShell(torsoShell) {
            torsoShell.vertices = [];
            torsoShell.faces = [];

            const heightSegments = 30;
            const radialSegments = 30;
            const totalHeight = 800;
            const startY = -180;

            for (let i = 0; i <= heightSegments; i++) {
                const t = i / heightSegments;
                const y = startY - t * totalHeight;

                let radiusX = 150;
                let radiusZ = 100;
                let region = 'neck';

                if (t < 0.1) {
                    radiusX = 60 + (t / 0.1) * 40;
                    radiusZ = 60 + (t / 0.1) * 20;
                    region = 'spinal_cord';
                } else if (t < 0.3) {
                    const st = (t - 0.1) / 0.2;
                    radiusX = 100 + st * 150;
                    radiusZ = 80 + st * 40;
                    region = 'heart';
                } else if (t < 0.6) {
                    const wt = (t - 0.3) / 0.3;
                    radiusX = 250 - wt * 100;
                    radiusZ = 120 - wt * 20;
                    region = (wt < 0.5) ? 'liver' : 'adrenals';
                } else {
                    const ht = (t - 0.6) / 0.4;
                    radiusX = 150 + ht * 70;
                    radiusZ = 100 + ht * 30;
                    region = 'gut';
                }

                for (let j = 0; j <= radialSegments; j++) {
                    const phi = (j / radialSegments) * Math.PI * 2;
                    const x = Math.cos(phi) * radiusX;
                    const z = Math.sin(phi) * radiusZ;
                    torsoShell.vertices.push({ x, y, z, region });
                }
            }

            for (let i = 0; i < heightSegments; i++) {
                for (let j = 0; j < radialSegments; j++) {
                    const first = i * (radialSegments + 1) + j;
                    const second = first + radialSegments + 1;
                    const region = torsoShell.vertices[first].region;
                    torsoShell.faces.push({ indices: [first, second, first + 1], region });
                    torsoShell.faces.push({ indices: [second, second + 1, first + 1], region });
                }
            }

            // Generate Arms
            // Generate Arms
            const armLength = 520;
            const armRadius = 40;

            // Left Arm
            const leftStart = { x: -180, y: -280, z: 0 };
            const leftDir = { x: -1, y: 0, z: 0 };
            // Shoulder
            this.initializeSphere(torsoShell, leftStart, 75, 'left_shoulder');
            // Arm
            this.initializeLimb(torsoShell, leftStart, armLength, armRadius, leftDir, 'left_arm');
            // Hand
            const leftEnd = {
                x: leftStart.x + leftDir.x * armLength,
                y: leftStart.y + leftDir.y * armLength,
                z: leftStart.z + leftDir.z * armLength
            };
            this.initializeSphere(torsoShell, leftEnd, 45, 'left_hand');


            // Right Arm
            const rightStart = { x: 180, y: -280, z: 0 };
            const rightDir = { x: 1, y: 0, z: 0 };
            // Shoulder
            this.initializeSphere(torsoShell, rightStart, 75, 'right_shoulder');
            // Arm
            this.initializeLimb(torsoShell, rightStart, armLength, armRadius, rightDir, 'right_arm');
            // Hand
            const rightEnd = {
                x: rightStart.x + rightDir.x * armLength,
                y: rightStart.y + rightDir.y * armLength,
                z: rightStart.z + rightDir.z * armLength
            };
            this.initializeSphere(torsoShell, rightEnd, 45, 'right_hand');
        },

        initializeLimb(shell, startPos, length, radius, direction, regionName) {
            const segments = 20;
            const radial = 15;
            const startIdx = shell.vertices.length;

            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                // Extrude along direction vector
                const xBase = startPos.x + direction.x * length * t;
                const yBase = startPos.y + direction.y * length * t;
                const zBase = startPos.z + direction.z * length * t;

                // Taper logic
                const currentRadius = radius * (1 - t * 0.4);

                for (let j = 0; j <= radial; j++) {
                    const phi = (j / radial) * Math.PI * 2;
                    let px, py, pz;

                    // Orientation logic:
                    if (Math.abs(direction.x) > Math.abs(direction.y)) {
                        px = xBase;
                        py = yBase + Math.cos(phi) * currentRadius;
                        pz = zBase + Math.sin(phi) * currentRadius;
                    } else {
                        px = xBase + Math.cos(phi) * currentRadius;
                        py = yBase;
                        pz = zBase + Math.sin(phi) * currentRadius;
                    }

                    shell.vertices.push({ x: px, y: py, z: pz, region: regionName });
                }
            }

            for (let i = 0; i < segments; i++) {
                for (let j = 0; j < radial; j++) {
                    const first = startIdx + i * (radial + 1) + j;
                    const second = first + radial + 1;
                    shell.faces.push({ indices: [first, second, first + 1], region: regionName });
                    shell.faces.push({ indices: [second, second + 1, first + 1], region: regionName });
                }
            }
        },

        initializeSphere(shell, center, radius, regionName) {
            const latBands = 12;
            const lonBands = 12;
            const startIdx = shell.vertices.length;

            for (let lat = 0; lat <= latBands; lat++) {
                const theta = lat * Math.PI / latBands;
                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);

                for (let lon = 0; lon <= lonBands; lon++) {
                    const phi = lon * 2 * Math.PI / lonBands;
                    const sinPhi = Math.sin(phi);
                    const cosPhi = Math.cos(phi);

                    const x = center.x + cosPhi * sinTheta * radius;
                    const y = center.y + cosTheta * radius;
                    const z = center.z + sinPhi * sinTheta * radius;

                    shell.vertices.push({ x, y, z, region: regionName });
                }
            }

            for (let lat = 0; lat < latBands; lat++) {
                for (let lon = 0; lon < lonBands; lon++) {
                    const first = startIdx + lat * (lonBands + 1) + lon;
                    const second = first + lonBands + 1;
                    shell.faces.push({ indices: [first, second, first + 1], region: regionName });
                    shell.faces.push({ indices: [second, second + 1, first + 1], region: regionName });
                }
            }
        },

        computeRegionsAndBoundaries(brainShell) {
            brainShell.boundaries = [];
        }
    };

    window.GreenhousePathwayGeometry = GreenhousePathwayGeometry;
})();
