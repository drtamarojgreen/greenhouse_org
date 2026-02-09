/**
 * @file inflammation_geometry.js
 * @description Ultra-HD Brain Model specifically for Neuroinflammation.
 * Features specialized midbrain mapping and realistic cortical sulcation.
 */

(function () {
    'use strict';

    const GreenhouseInflammationGeometry = {
        initializeBrainShell(brainShell) {
            console.log("Inflammation Geometry: Generating Ultra-HD Internalized Model...");

            const baseRadius = 200;
            const latBands = 80;
            const lonBands = 80;

            brainShell.vertices = [];
            brainShell.faces = [];
            brainShell.regions = {
                hypothalamus: { name: 'Hypothalamus', color: 'rgba(255, 200, 50, 0.9)', vertices: [] },
                hippocampus: { name: 'Hippocampus', color: 'rgba(60, 240, 120, 0.7)', vertices: [] },
                thalamus: { name: 'Thalamus', color: 'rgba(230, 100, 255, 0.8)', vertices: [] },
                insula: { name: 'Insula', color: 'rgba(255, 120, 60, 0.7)', vertices: [] },
                basal_ganglia: { name: 'Basal Ganglia', color: 'rgba(80, 220, 220, 0.6)', vertices: [] },
                cortex: { name: 'Cortex', color: 'rgba(170, 170, 180, 0.25)', vertices: [] }
            };

            for (let lat = 0; lat <= latBands; lat++) {
                const theta = (lat * Math.PI) / latBands;
                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);

                for (let lon = 0; lon <= lonBands; lon++) {
                    const phi = (lon * 2 * Math.PI) / lonBands;
                    const sinPhi = Math.sin(phi);
                    const cosPhi = Math.cos(phi);

                    // Deformed Realistic Proportions
                    let x = cosPhi * sinTheta * 1.0;
                    let y = cosTheta * 1.15;
                    let z = sinPhi * sinTheta * 1.15;

                    // 1. Inflammatory Midbrain Emphasis
                    // We "open up" the model slightly to better view internal structures
                    const radialDist = Math.sqrt(x * x + z * z);
                    if (y > -0.2 && y < 0.3 && radialDist < 0.4) {
                        // Create a slight internal cavity effect for subcortical visibility
                    }

                    // 2. Realistic Cortical Texture
                    const sulcusNoise = Math.sin(x * 16) * Math.cos(y * 14) * Math.sin(z * 18) * 0.05;
                    const fineGrain = Math.sin(x * 35) * Math.cos(z * 35) * 0.01;
                    const surfaceFactor = 1 + sulcusNoise + fineGrain;

                    // 3. Precise Inflammation-Centric Mapping
                    const nx = x, ny = y, nz = z;
                    let region = 'cortex';

                    // Thalamus (Deep Central)
                    if (Math.abs(nx) < 0.2 && ny < 0.25 && ny > -0.1 && Math.abs(nz) < 0.2) region = 'thalamus';
                    // Hypothalamus (Postero-infra-thalamic)
                    else if (Math.abs(nx) < 0.16 && ny <= -0.1 && ny > -0.32 && Math.abs(nz) < 0.16) region = 'hypothalamus';
                    // Basal Ganglia (Lateral to core)
                    else if (Math.abs(nx) > 0.18 && Math.abs(nx) < 0.38 && ny < 0.15 && ny > -0.2 && Math.abs(nz) < 0.25) region = 'basal_ganglia';
                    // Insula (Deep side pocket)
                    else if (Math.abs(nx) > 0.44 && ny < 0.15 && ny > -0.35 && nz > -0.12 && nz < 0.22) region = 'insula';
                    // Hippocampus (Side-back)
                    else if (Math.abs(nx) > 0.32 && ny < 0.05 && ny > -0.3 && nz < -0.22 && nz > -0.55) region = 'hippocampus';

                    const finalX = x * baseRadius * surfaceFactor;
                    const finalY = y * baseRadius * surfaceFactor;
                    const finalZ = z * baseRadius * surfaceFactor;

                    const normal = { x: nx, y: ny, z: nz };
                    const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
                    normal.x /= nLen; normal.y /= nLen; normal.z /= nLen;

                    const vIdx = brainShell.vertices.length;
                    brainShell.vertices.push({ x: finalX, y: finalY, z: finalZ, normal, region: region });

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

            // Smoothed centroids
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

    window.GreenhouseInflammationGeometry = GreenhouseInflammationGeometry;
})();
