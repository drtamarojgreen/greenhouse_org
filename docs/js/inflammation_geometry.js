/**
 * @file inflammation_geometry.js
 * @description Master-HD Brain Model specifically for Neuroinflammation.
 * Features realistic anatomical lobing and high-resolution smoothness.
 */

(function () {
    'use strict';

    const GreenhouseInflammationGeometry = {
        initializeBrainShell(brainShell) {
            console.log("Inflammation Geometry: Generating Ultra-Smooth Anatomical Model...");

            const baseRadius = 200;
            const latBands = 80;
            const lonBands = 80;

            brainShell.vertices = [];
            brainShell.faces = [];
            brainShell.regions = {
                hypothalamus: { name: 'Hypothalamus', color: 'rgba(255, 200, 50, 0.9)', vertices: [] },
                hippocampus: { name: 'Hippocampus', color: 'rgba(80, 240, 150, 0.7)', vertices: [] },
                thalamus: { name: 'Thalamus', color: 'rgba(230, 100, 255, 0.8)', vertices: [] },
                insula: { name: 'Insula', color: 'rgba(255, 120, 60, 0.7)', vertices: [] },
                basal_ganglia: { name: 'Basal Ganglia', color: 'rgba(80, 220, 220, 0.6)', vertices: [] },
                cortex: { name: 'Cortex', color: 'rgba(180, 180, 200, 0.25)', vertices: [] }
            };

            for (let lat = 0; lat <= latBands; lat++) {
                const theta = (lat * Math.PI) / latBands;
                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);

                for (let lon = 0; lon <= lonBands; lon++) {
                    const phi = (lon * 2 * Math.PI) / lonBands;
                    const sinPhi = Math.sin(phi);
                    const cosPhi = Math.cos(phi);

                    let x = cosPhi * sinTheta;
                    let y = cosTheta;
                    let z = sinPhi * sinTheta;

                    const nx = x, ny = y, nz = z;

                    // Ovoid proportions
                    x *= 0.95; y *= 1.15; z *= 1.20;

                    // Broad Folds
                    const fissure = 1.0 - (Math.exp(-Math.abs(x) * 12) * 0.2);
                    const lobeScale = 1.0 + Math.sin(x * 3) * Math.cos(y * 3.5) * Math.sin(z * 3) * 0.08;
                    const sulci = 1.0 + Math.sin(x * 10) * Math.cos(z * 10) * 0.01;

                    const finalFactor = lobeScale * sulci * fissure;

                    let region = 'cortex';
                    if (Math.abs(nx) < 0.2 && ny < 0.2 && ny > -0.1 && Math.abs(nz) < 0.2) region = 'thalamus';
                    else if (Math.abs(nx) < 0.18 && ny <= -0.1 && ny > -0.3 && Math.abs(nz) < 0.18) region = 'hypothalamus';
                    else if (Math.abs(nx) > 0.2 && Math.abs(nx) < 0.4 && ny < 0.15 && ny > -0.2 && Math.abs(nz) < 0.3) region = 'basal_ganglia';
                    else if (Math.abs(nx) > 0.45 && ny < 0.1 && ny > -0.3 && nz > -0.1 && nz < 0.25) region = 'insula';
                    else if (Math.abs(nx) > 0.35 && ny < 0.0 && ny > -0.35 && nz < -0.2 && nz > -0.5) region = 'hippocampus';

                    const vIdx = brainShell.vertices.length;

                    // Fixed smooth normals
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

    window.GreenhouseInflammationGeometry = GreenhouseInflammationGeometry;
})();
