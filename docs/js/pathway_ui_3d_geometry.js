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
        },

        computeRegionsAndBoundaries(brainShell) {
            brainShell.boundaries = [];
        }
    };

    window.GreenhousePathwayGeometry = GreenhousePathwayGeometry;
})();
