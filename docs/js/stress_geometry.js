/**
 * @file stress_geometry.js
 * @description Ultra-HD Brain Model specifically for Stress Dynamics.
 * Features multi-layered noise for realistic cortical folding and refined anatomy.
 */

(function () {
    'use strict';

    const GreenhouseStressGeometry = {
        initializeBrainShell(brainShell) {
            console.log("Stress Geometry: Generating Ultra-HD Stress-Centric Model...");

            const baseRadius = 200;
            const latBands = 80; // Higher resolution for premium look
            const lonBands = 80;

            brainShell.vertices = [];
            brainShell.faces = [];
            brainShell.regions = {
                pfc: { name: 'Prefrontal Cortex', color: 'rgba(80, 160, 255, 0.7)', vertices: [] },
                amygdala: { name: 'Amygdala', color: 'rgba(255, 80, 80, 0.9)', vertices: [] },
                hippocampus: { name: 'Hippocampus', color: 'rgba(50, 255, 100, 0.7)', vertices: [] },
                hypothalamus: { name: 'Hypothalamus', color: 'rgba(255, 220, 0, 1.0)', vertices: [] },
                cortex: { name: 'Cortical Ribbon', color: 'rgba(180, 180, 190, 0.3)', vertices: [] },
                cerebellum: { name: 'Cerebellum', color: 'rgba(50, 200, 200, 0.4)', vertices: [] }
            };

            for (let lat = 0; lat <= latBands; lat++) {
                const theta = (lat * Math.PI) / latBands;
                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);

                for (let lon = 0; lon <= lonBands; lon++) {
                    const phi = (lon * 2 * Math.PI) / lonBands;
                    const sinPhi = Math.sin(phi);
                    const cosPhi = Math.cos(phi);

                    // Base anatomical proportions (Realistic)
                    let x = cosPhi * sinTheta * 1.0;
                    let y = cosTheta * 1.18; // Height
                    let z = sinPhi * sinTheta * 1.12; // Depth

                    // 1. Longitudinal Fissure (Deep split)
                    if (y > 0.1) {
                        const fissureDepth = Math.exp(-Math.abs(x) * 10) * 0.22;
                        y *= (1 - fissureDepth);
                    }

                    // 2. Multi-layered Cortical Folding (The "WOW" factor)
                    // We use overlapping sine waves to simulate gyri and sulci
                    const gyrusLevel1 = Math.sin(x * 14 + z * 10) * Math.cos(y * 12) * 0.06;
                    const gyrusLevel2 = Math.sin(x * 25 - z * 15) * Math.cos(y * 22) * 0.02;
                    const gyrusFactor = 1 + gyrusLevel1 + gyrusLevel2;

                    // 3. Region Mapping Logic
                    const nx = x, ny = y, nz = z;
                    let region = 'cortex';

                    if (nz > 0.5 && ny > -0.2) region = 'pfc';
                    else if (Math.abs(nx) > 0.28 && Math.abs(nx) < 0.48 && ny < 0.1 && ny > -0.25 && nz > -0.15 && nz < 0.15) region = 'amygdala';
                    else if (Math.abs(nx) > 0.38 && ny < -0.05 && ny > -0.35 && nz < -0.05 && nz > -0.45) region = 'hippocampus';
                    else if (Math.abs(nx) < 0.18 && ny < -0.05 && ny > -0.3 && Math.abs(nz) < 0.18) region = 'hypothalamus';
                    else if (ny < -0.35 && nz < -0.4) region = 'cerebellum';

                    // 4. Biological Dilation for Stress
                    // We slightly expand the active centers for visual clarity
                    let expansion = 1.0;
                    if (region === 'pfc' || region === 'amygdala') expansion = 1.05;

                    const finalX = x * baseRadius * gyrusFactor * expansion;
                    const finalY = y * baseRadius * gyrusFactor * expansion;
                    const finalZ = z * baseRadius * gyrusFactor * expansion;

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

            // High-density faces
            for (let lat = 0; lat < latBands; lat++) {
                for (let lon = 0; lon < lonBands; lon++) {
                    const first = lat * (lonBands + 1) + lon;
                    const second = first + lonBands + 1;
                    brainShell.faces.push({ indices: [first, second, first + 1], region: brainShell.vertices[first].region });
                    brainShell.faces.push({ indices: [second, second + 1, first + 1], region: brainShell.vertices[second].region });
                }
            }

            // Pre-calculate smoothed centroids
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
