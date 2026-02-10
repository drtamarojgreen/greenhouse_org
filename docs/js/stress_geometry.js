/**
 * @file stress_geometry.js
 * @description Master-HD Brain Model specifically for Stress Dynamics.
 * Advanced lobing logic to prevent "golf ball" facets while maintaining anatomical fidelity.
 */

(function () {
    'use strict';

    const GreenhouseStressGeometry = {
        initializeBrainShell(brainShell) {
            console.log("Stress Geometry: Generating Ultra-Smooth Anatomical Model...");

            const baseRadius = 200;
            const latBands = 80;
            const lonBands = 80;

            brainShell.vertices = [];
            brainShell.faces = [];
            brainShell.regions = {
                pfc: { name: 'Prefrontal Cortex', color: 'rgba(100, 180, 255, 0.7)', vertices: [] },
                amygdala: { name: 'Amygdala', color: 'rgba(255, 80, 80, 0.9)', vertices: [] },
                hippocampus: { name: 'Hippocampus', color: 'rgba(80, 255, 120, 0.7)', vertices: [] },
                hypothalamus: { name: 'Hypothalamus', color: 'rgba(255, 220, 0, 1.0)', vertices: [] },
                cortex: { name: 'Cortical Ribbon', color: 'rgba(180, 180, 200, 0.25)', vertices: [] },
                cerebellum: { name: 'Cerebellum', color: 'rgba(60, 210, 210, 0.35)', vertices: [] },
                brainstem: { name: 'Brainstem', color: 'rgba(120, 120, 140, 0.5)', vertices: [] },
                vagus_nerve: { name: 'Vagus Nerve', color: 'rgba(0, 255, 128, 0.8)', vertices: [] }
            };

            for (let lat = 0; lat <= latBands; lat++) {
                const theta = (lat * Math.PI) / latBands;
                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);

                for (let lon = 0; lon <= lonBands; lon++) {
                    const phi = (lon * 2 * Math.PI) / lonBands;
                    const sinPhi = Math.sin(phi);
                    const cosPhi = Math.cos(phi);

                    // Smooth Ovoid Base
                    let x = cosPhi * sinTheta;
                    let y = cosTheta;
                    let z = sinPhi * sinTheta;

                    // Anatomical Proportions
                    x *= 0.95;
                    y *= 1.12;
                    z *= 1.15;

                    const nx = x, ny = y, nz = z;

                    // 1. Broad Anatomical Lobing (Low Frequency)
                    // This creates the large "bumps" of the brain lobes without sharp facets
                    const lobeX = Math.sin(x * 3.0);
                    const lobeY = Math.cos(y * 3.5);
                    const lobeZ = Math.sin(z * 3.2);
                    const anatomicalScale = 1.0 + (lobeX * lobeY * lobeZ * 0.08);

                    // 2. Fissure (Longitudinal)
                    const fissureIndent = 1.0 - (Math.exp(-Math.abs(x) * 15) * 0.2);

                    // 3. Subtle Sulci (Fine detail, but very smooth)
                    const sulci = 1.0 + (Math.sin(x * 12) * Math.cos(z * 12) * 0.012);

                    const finalFactor = anatomicalScale * fissureIndent * sulci;

                    let region = 'cortex';
                    if (nz > 0.5 && ny > -0.2) region = 'pfc';
                    else if (Math.abs(nx) > 0.3 && Math.abs(nx) < 0.5 && ny < 0.1 && ny > -0.2 && nz > -0.1 && nz < 0.2) region = 'amygdala';
                    else if (Math.abs(nx) > 0.4 && ny < -0.05 && ny > -0.4 && nz < -0.1 && nz > -0.4) region = 'hippocampus';
                    else if (Math.abs(nx) < 0.15 && ny < 0.0 && ny > -0.2 && Math.abs(nz) < 0.15) region = 'hypothalamus';
                    else if (ny < -0.4 && nz < -0.4) region = 'cerebellum';
                    else if (Math.abs(nx) < 0.12 && ny < -0.2 && ny > -0.8 && nz < -0.1) region = 'brainstem';
                    else if (Math.abs(nx) < 0.05 && ny < -0.7 && nz < -0.05) region = 'vagus_nerve';

                    const vIdx = brainShell.vertices.length;

                    // The Normal stays strictly the smooth base direction to ensure smooth lighting
                    const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
                    const normal = { x: nx / nLen, y: ny / nLen, z: nz / nLen };

                    brainShell.vertices.push({
                        x: x * baseRadius * finalFactor,
                        y: y * baseRadius * finalFactor,
                        z: z * baseRadius * finalFactor,
                        normal: normal,
                        region: region
                    });

                    if (brainShell.regions[region]) {
                        brainShell.regions[region].vertices.push(vIdx);
                    }
                }
            }

            for (let lat = 0; lat < latBands; lat++) {
                for (let lon = 0; lon < lonBands; lon++) {
                    const first = lat * (lonBands + 1) + lon;
                    const second = first + lonBands + 1;
                    brainShell.faces.push({ indices: [first, second, first + 1], region: brainShell.vertices[first].region });
                    brainShell.faces.push({ indices: [second, second + 1, first + 1], region: brainShell.vertices[second].region });
                }
            }

            for (const key in brainShell.regions) {
                const reg = brainShell.regions[key];
                if (reg.vertices.length > 0) {
                    let cx = 0, cy = 0, cz = 0;
                    reg.vertices.forEach(idx => {
                        const v = brainShell.vertices[idx];
                        cx += v.x; cy += v.y; cz += v.z;
                    });
                    reg.centroid = { x: cx / reg.vertices.length, y: cy / reg.vertices.length, z: cz / reg.vertices.length };
                }
            }
        }
    };

    window.GreenhouseStressGeometry = GreenhouseStressGeometry;
})();
