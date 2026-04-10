(function () {
    'use strict';

    const GreenhouseNeuroNeuron = {
        neuronMeshes: {},

        drawNeuron(ctx, neuron, camera, projection, colorOverride, pulseFreq = 0.005, isHovered = false) {
            // Project Center for LOD and Culling
            const p = GreenhouseModels3DMath.project3DTo2D(neuron.x, neuron.y, neuron.z, camera, projection);
            if (p.scale <= 0) return;

            const pyramidalRegions = ['pfc', 'temporalLobe', 'parietalLobe', 'occipitalLobe', 'hippocampus'];
            const type = pyramidalRegions.includes(neuron.region) ? 'pyramidal' : 'stellate';
            const lod = p.scale < 0.3 ? 0 : p.scale < 0.6 ? 1 : 2;

            if (lod === 0) {
                this.drawLODIcon(ctx, p, neuron, type, colorOverride);
                return;
            }

            const meshKey = `${type}_lod${lod}`;
            if (!this.neuronMeshes[meshKey]) {
                this.neuronMeshes[meshKey] = type === 'pyramidal'
                    ? this.generatePyramidalMesh(lod)
                    : this.generateStellateMesh(lod);
            }
            const mesh = this.neuronMeshes[meshKey];

            const now = Date.now();
            const activation = Math.max(0, Math.min(1, neuron.activationLevel ?? neuron.activation ?? 0));
            const neuronSeed = String(neuron.id ?? `${neuron.x}_${neuron.y}_${neuron.z}`)
                .split('')
                .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
            const firingOsc = Math.max(0, Math.sin(now * 0.02 + neuronSeed * 0.01));
            const firingPulse = (neuron.isFiring || activation > 0.85) ? firingOsc * 0.12 : 0;
            const membraneDisplacement = activation * 0.8;

            const rotX = neuron.x * 0.01;
            const rotY = neuron.y * 0.01 + now * (pulseFreq * 0.1);
            const rotZ = neuron.z * 0.01;

            const transformedVertices = mesh.vertices.map((v) => {
                let x = v.x;
                let y = v.y;
                let z = v.z;

            // --- Vertex Displacement for Hover/Pulsing ---
                if (isHovered) {
                    const disp = Math.sin(Date.now() * 0.01 + (x + y + z)) * 2.0;
                    x += (x / 5) * disp;
                    y += (y / 5) * disp;
                    z += (z / 5) * disp;
                }

                // Rhythmic pulsing based on activity/pulseFreq - Reduced intensity for accessibility
                const activityPulse = Math.sin(Date.now() * pulseFreq * 2) * 0.5 + 0.5;
                const activityDisp = activityPulse * (type === 'pyramidal' ? 0.6 : 0.4);
                x *= (1 + activityDisp * 0.03);
                y *= (1 + activityDisp * 0.03);
                z *= (1 + activityDisp * 0.03);

                // Rotate Y
                let tx = x * Math.cos(rotY) - z * Math.sin(rotY);
                let tz = x * Math.sin(rotY) + z * Math.cos(rotY);
                x = tx; z = tz;

                let ty = y * Math.cos(rotX) - z * Math.sin(rotX);
                tz = y * Math.sin(rotX) + z * Math.cos(rotX);
                y = ty; z = tz;

                tx = x * Math.cos(rotZ) - y * Math.sin(rotZ);
                ty = x * Math.sin(rotZ) + y * Math.cos(rotZ);
                x = tx; y = ty;

                const scale = type === 'pyramidal' ? 1.3 : 1.05;
                x *= scale; y *= scale; z *= scale;

                return { x: x + neuron.x, y: y + neuron.y, z: z + neuron.z };
            });

            const projected = transformedVertices.map(v =>
                GreenhouseModels3DMath.project3DTo2D(v.x, v.y, v.z, camera, projection)
            );

            const facesWithDepth = mesh.faces.map(face => {
                const v1 = projected[face[0]];
                const v2 = projected[face[1]];
                const v3 = projected[face[2]];

                if (v1.scale > 0 && v2.scale > 0 && v3.scale > 0) {
                    return {
                        depth: (v1.depth + v2.depth + v3.depth) / 3,
                        vertices: [v1, v2, v3],
                        origVertices: [transformedVertices[face[0]], transformedVertices[face[1]], transformedVertices[face[2]]]
                    };
                }
                return null;
            }).filter(Boolean).sort((a, b) => b.depth - a.depth);

            const lightDir = { x: 0.5, y: -0.5, z: 1 };
            const len = Math.sqrt(lightDir.x * lightDir.x + lightDir.y * lightDir.y + lightDir.z * lightDir.z);
            lightDir.x /= len; lightDir.y /= len; lightDir.z /= len;

            facesWithDepth.forEach(({ vertices, origVertices, depth }) => {
                const [v1, v2, v3] = vertices;
                const [ov1, ov2, ov3] = origVertices;
                const alpha = GreenhouseModels3DMath.applyDepthFog(1, depth);

                const dx1 = v2.x - v1.x;
                const dy1 = v2.y - v1.y;
                const dx2 = v3.x - v1.x;
                const dy2 = v3.y - v1.y;
                if (dx1 * dy2 - dy1 * dx2 <= 0) return;

                const ux = ov2.x - ov1.x;
                const uy = ov2.y - ov1.y;
                const uz = ov2.z - ov1.z;
                const vx = ov3.x - ov1.x;
                const vy = ov3.y - ov1.y;
                const vz = ov3.z - ov1.z;

                let nx = uy * vz - uz * vy;
                let ny = uz * vx - ux * vz;
                let nz = ux * vy - uy * vx;
                const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);

                let intensity = 0.4;
                if (nLen > 0) {
                    nx /= nLen; ny /= nLen; nz /= nLen;
                    const diffuse = Math.max(0, nx * lightDir.x + ny * lightDir.y + nz * lightDir.z);
                    intensity += diffuse * 0.6;
                }

                const colorStr = (typeof colorOverride === 'string') ? colorOverride : (typeof neuron.baseColor === 'string' ? neuron.baseColor : '#ffffff');
                const colorMatch = colorStr.match(/#([0-9a-f]{6})/i);
                let r = 235, g = 242, b = 255;
                if (colorMatch) {
                    const hex = parseInt(colorMatch[1], 16);
                    r = (hex >> 16) & 255;
                    g = (hex >> 8) & 255;
                    b = hex & 255;
                }

                const litR = Math.min(255, r * intensity);
                const litG = Math.min(255, g * intensity);
                const litB = Math.min(255, b * intensity);

                ctx.fillStyle = `rgba(${litR}, ${litG}, ${litB}, ${alpha})`;

                // --- Structural Neuron Shading ---
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(v1.x, v1.y);
                ctx.lineTo(v2.x, v2.y);
                ctx.lineTo(v3.x, v3.y);
                ctx.closePath();
                ctx.fill();

                // Pattern overlay for accessibility - Reinforced distinctions
                if (type === 'pyramidal') {
                    // Sharp wireframe highlight for pyramidals
                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
                    ctx.lineWidth = 1.0;
                    ctx.stroke();
                } else {
                    // Soft stipple effect for stellates
                    if (Math.random() < 0.3) {
                        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
                        ctx.beginPath();
                        ctx.arc(v1.x, v1.y, 1, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.restore();
            });
        },

        generatePyramidalMesh() {
            // Anatomically Correct Pyramidal Neuron
            // Soma (Pyramid) + Apical Dendrite (Long) + Basal Dendrites (Stubs)
            const r = 6;
            const h = 10;
            const vertices = [
                { x: 0, y: -h, z: 0 },    // 0: Soma Apex
                { x: r, y: h/2, z: r },   // 1: Soma Base R
                { x: -r, y: h/2, z: r },  // 2: Soma Base L
                { x: 0, y: h/2, z: -r },  // 3: Soma Base B

                { x: 0, y: -h * 2.5, z: 0 }, // 4: Apical Dendrite Tip

                { x: r * 1.5, y: h, z: r * 1.5 },   // 5: Basal 1
                { x: -r * 1.5, y: h, z: r * 1.5 },  // 6: Basal 2
                { x: 0, y: h, z: -r * 1.8 }         // 7: Basal 3
            ];
            const faces = [
                [0, 1, 2], [0, 2, 3], [0, 3, 1], // Soma
                [4, 0, 1], [4, 1, 3], [4, 3, 0], // Apical Stem (thicker look)
                [1, 5, 2], [2, 6, 3], [3, 7, 1]  // Basal Attachments
            ];

            // Add Synaptic Pegs (Octahedrons) at key dendritic points
            const pegs = [
                { x: 0, y: -h * 1.8, z: 0 },
                { x: r * 0.8, y: h * 0.8, z: r * 0.8 },
                { x: -r * 0.8, y: h * 0.8, z: r * 0.8 }
            ];
            this._addSynapticPegs(vertices, faces, pegs);

            return { vertices, faces };
        },

        generateStellateMesh() {
            // Anatomically Correct Stellate Neuron
            // Rounder Soma + Multi-polar dendritic branching
            const s = 5;
            const vertices = [
                // Octahedral Soma
                { x: s, y: 0, z: 0 }, { x: -s, y: 0, z: 0 },
                { x: 0, y: s, z: 0 }, { x: 0, y: -s, z: 0 },
                { x: 0, y: 0, z: s }, { x: 0, y: 0, z: -s },
                // Dendritic branching points
                { x: s * 2, y: s, z: s }, { x: -s * 2, y: -s, z: s },
                { x: s, y: s * 2, z: -s }, { x: -s, y: -s * 2, z: -s }
            ];
            const faces = [
                [2, 0, 4], [2, 4, 1], [2, 1, 5], [2, 5, 0], // Top Soma
                [3, 4, 0], [3, 1, 4], [3, 5, 1], [3, 0, 5], // Bottom Soma
                [0, 6, 2], [1, 7, 3], [2, 8, 5], [3, 9, 4]  // Dendrite stems
            ];

            // Add Synaptic Pegs
            const pegs = [
                { x: s * 1.5, y: s * 0.8, z: s * 0.8 },
                { x: -s * 1.5, y: -s * 0.8, z: s * 0.8 }
            ];
            this._addSynapticPegs(vertices, faces, pegs);

            return { vertices, faces };
        },

        _addSynapticPegs(vertices, faces, positions) {
            positions.forEach(pos => {
                const idx = vertices.length;
                const size = 1.5;
                // Octahedron peg
                vertices.push(
                    { x: pos.x + size, y: pos.y, z: pos.z },
                    { x: pos.x - size, y: pos.y, z: pos.z },
                    { x: pos.x, y: pos.y + size, z: pos.z },
                    { x: pos.x, y: pos.y - size, z: pos.z },
                    { x: pos.x, y: pos.y, z: pos.z + size },
                    { x: pos.x, y: pos.y, z: pos.z - size }
                );
                faces.push(
                    [idx + 2, idx, idx + 4], [idx + 2, idx + 4, idx + 1],
                    [idx + 2, idx + 1, idx + 5], [idx + 2, idx + 5, idx],
                    [idx + 3, idx + 4, idx], [idx + 3, idx + 1, idx + 4],
                    [idx + 3, idx + 5, idx + 1], [idx + 3, idx, idx + 5]
                );
            });
        }
    };

    window.GreenhouseNeuroNeuron = GreenhouseNeuroNeuron;
})();
