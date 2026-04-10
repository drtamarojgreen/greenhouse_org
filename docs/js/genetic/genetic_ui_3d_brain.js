// docs/js/genetic/genetic_ui_3d_brain.js
// Enhanced 3D Brain Rendering Engine for Genetic Model (adapted from neuro_ui_3d_brain.js)

(function () {
    'use strict';

    const GreenhouseGeneticBrain = {
        _vertexPool: [],
        _facePool: [],
        _precomputedBoundaries: null,

        drawTargetView(ctx, x, y, w, h, activeGene, activeGeneIndex, brainShell, drawPiPFrameCallback, cameraState) {
            if (drawPiPFrameCallback) drawPiPFrameCallback(ctx, x, y, w, h, "Target: Brain Region");
            if (!brainShell || !cameraState || !cameraState.camera) return;

            const targetCamera = cameraState.camera;
            const projection = { width: w, height: h, near: 10, far: 5000 };

            ctx.save();
            ctx.translate(x, y);
            ctx.beginPath();
            ctx.rect(0, 0, w, h);
            ctx.clip();

            if (window.GreenhouseModels3DMath && window.GreenhouseGeneticLighting) {
                this.drawBrainShell(ctx, brainShell, targetCamera, projection, w, h, activeGene);
            }
            ctx.restore();
        },

        drawBrainShell(ctx, brainShell, camera, projection, width, height, activeGene = null) {
            const targetRegion = activeGene ? activeGene.region : null;
            if (!brainShell) return;

            const projectedVertices = [];
            for (let i = 0; i < brainShell.vertices.length; i++) {
                const v = brainShell.vertices[i];
                const p = GreenhouseModels3DMath.project3DTo2D(v.x, -v.y, v.z, camera, projection);
                projectedVertices.push(p);
            }

            const facesToDraw = [];
            for (let i = 0; i < brainShell.faces.length; i++) {
                const face = brainShell.faces[i];
                const indices = face.indices || face;
                const p1 = projectedVertices[indices[0]], p2 = projectedVertices[indices[1]], p3 = projectedVertices[indices[2]];
                if (p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
                    const cross = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
                    if (cross < 0) {
                        const v1 = brainShell.vertices[indices[0]], v2 = brainShell.vertices[indices[1]], v3 = brainShell.vertices[indices[2]];
                        const normal = GreenhouseModels3DMath.calculateFaceNormal(v1, v2, v3);
                        facesToDraw.push({ indices, p1, p2, p3, depth: (p1.depth + p2.depth + p3.depth) / 3, normal, region: face.region || v1.region });
                    }
                }
            });

            facesToDraw.sort((a, b) => b.depth - a.depth);

            brainShell.faces.forEach(f => {
                const p1 = projectedVertices[f.indices[0]], p2 = projectedVertices[f.indices[1]], p3 = projectedVertices[f.indices[2]];
                if (p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
                    const isFront = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x) < 0;
                    const v1 = brainShell.vertices[f.indices[0]], v2 = brainShell.vertices[f.indices[1]], v3 = brainShell.vertices[f.indices[2]];
                    const normal = GreenhouseModels3DMath.calculateFaceNormal(v1, v2, v3);
                    facesToDraw.push({ p1, p2, p3, depth: (p1.depth + p2.depth + p3.depth) / 3, normal, region: f.region, isFront, indices: f.indices });
                }
            });

            facesToDraw.sort((a, b) => b.depth - a.depth);

            facesToDraw.forEach(f => {
                const material = { baseColor: { r: 160, g: 174, b: 192 }, roughness: 0.5, metalness: 0.1, sss: true, alpha: 0.15 };
                const center = {
                    x: (brainShell.vertices[f.indices[0]].x + brainShell.vertices[f.indices[1]].x + brainShell.vertices[f.indices[2]].x) / 3,
                    y: (brainShell.vertices[f.indices[0]].y + brainShell.vertices[f.indices[1]].y + brainShell.vertices[f.indices[2]].y) / 3,
                    z: (brainShell.vertices[f.indices[0]].z + brainShell.vertices[f.indices[1]].z + brainShell.vertices[f.indices[2]].z) / 3
                };

                const v0 = brainShell.vertices[f.indices[0]];
                const ao = 1.0 - (v0.curvature || 0) * 2.0;

                const color = GreenhouseGeneticLighting.calculateLighting(f.normal, center, camera, material);
                color.r *= ao; color.g *= ao; color.b *= ao;

                const isTarget = targetRegion && (f.region === targetRegion);
                const fog = GreenhouseModels3DMath.applyDepthFog(isTarget ? 0.9 : color.a, f.depth);

                ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${fog})`;
                ctx.beginPath();
                ctx.moveTo(f.p1.x, f.p1.y);
                ctx.lineTo(f.p2.x, f.p2.y);
                ctx.lineTo(f.p3.x, f.p3.y);
                ctx.fill();

                if (isTarget) {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${fog})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            });

            this.drawSurfaceGrid(ctx, projectedVertices);
            this.drawOrientationWidget(ctx, camera, width, height);
        },

        drawSurfaceGrid(ctx, projectedVertices) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            for (let i = 0; i < projectedVertices.length; i += 10) {
                const p = projectedVertices[i];
                if (p && p.scale > 0) {
                    ctx.moveTo(p.x, p.y);
                    ctx.arc(p.x, p.y, 0.5, 0, Math.PI * 2);
                }
            }
            ctx.stroke();
            ctx.restore();
        },

        drawOrientationWidget(ctx, camera, width, height) {
            const size = 60;
            const ox = width - size - 20;
            const oy = size + 20;
            ctx.save();
            ctx.translate(ox, oy);
            const axes = [
                { x: 1, y: 0, z: 0, label: 'L', color: '#ff4444' },
                { x: 0, y: 1, z: 0, label: 'S', color: '#44ff44' },
                { x: 0, y: 0, z: 1, label: 'P', color: '#4444ff' }
            ];
            axes.forEach(axis => {
                const p = GreenhouseModels3DMath.project3DTo2D(axis.x * 30, axis.y * 30, axis.z * 30,
                    { x: 0, y: 0, z: -100, rotationX: camera.rotationX, rotationY: camera.rotationY, rotationZ: camera.rotationZ, fov: 200 },
                    { width: 0, height: 0, near: 1, far: 1000 });
                ctx.beginPath(); ctx.strokeStyle = axis.color; ctx.moveTo(0, 0); ctx.lineTo(p.x, p.y); ctx.stroke();
                ctx.fillStyle = axis.color; ctx.font = '10px Arial'; ctx.fillText(axis.label, p.x, p.y);
            });
            ctx.restore();
        },


        generateCompositeBrainMesh() {
            const vertices = [];
            const faces = [];
            let vIndex = 0;

            // Helper to add mesh
            const addMesh = (vs, fs, colorType) => {
                const offset = vIndex;
                vs.forEach(v => vertices.push(v));
                fs.forEach(f => faces.push([f[0] + offset, f[1] + offset, f[2] + offset, colorType]));
                vIndex += vs.length;
            };

            // 1. Cerebrum (Hemispheres) - Deformed Superellipsoid
            // |x/a|^r + |y/b|^s + |z/c|^t = 1
            // r=2.5 (flat medial), s=2, t=2
            const createHemisphere = (sign) => {
                const vs = [];
                const fs = [];
                const rings = 15;
                const segments = 15;
                const a = 40, b = 50, c = 60; // Dimensions

                for (let i = 0; i <= rings; i++) {
                    const u = (i / rings) * Math.PI; // 0 to PI (Latitude)
                    for (let j = 0; j <= segments; j++) {
                        const v = (j / segments) * Math.PI; // 0 to PI (Longitude - Half sphere)

                        // Superellipsoid coords (simplified)
                        // x = a * sign * cos(v)^r * sin(u)^r
                        // We'll use standard sphere mapping and distort

                        let x = Math.sin(u) * Math.cos(v);
                        let y = Math.cos(u);
                        let z = Math.sin(u) * Math.sin(v);

                        // Apply Superellipsoid flattening for medial wall (x close to 0)
                        // If x is small, flatten it?
                        // Actually, let's just scale.

                        x *= a * sign; // Separate hemispheres
                        y *= b;
                        z *= c;

                        // Medial Flattening: If x is near 0 (medial), clamp or flatten
                        if (Math.abs(x) < 10) x *= 0.5;

                        // Offset
                        x += sign * 5; // Gap

                        vs.push({ x, y, z });
                    }
                }

                // Faces
                for (let i = 0; i < rings; i++) {
                    for (let j = 0; j < segments; j++) {
                        const row1 = i * (segments + 1);
                        const row2 = (i + 1) * (segments + 1);
                        fs.push([row1 + j, row1 + j + 1, row2 + j]);
                        fs.push([row1 + j + 1, row2 + j + 1, row2 + j]);
                    }
                }
                return { vs, fs };
            };

            const leftHemi = createHemisphere(-1);
            addMesh(leftHemi.vs, leftHemi.fs, 'cerebrum');

            const rightHemi = createHemisphere(1);
            addMesh(rightHemi.vs, rightHemi.fs, 'cerebrum');

            // 2. Cerebellum - Flattened Ellipsoid
            // Located below posterior cerebrum
            const createCerebellum = () => {
                const vs = [];
                const fs = [];
                const rings = 10;
                const segments = 20;
                const rx = 30, ry = 15, rz = 20;

                for (let i = 0; i <= rings; i++) {
                    const u = (i / rings) * Math.PI;
                    for (let j = 0; j <= segments; j++) {
                        const v = (j / segments) * 2 * Math.PI;

                        let x = rx * Math.sin(u) * Math.cos(v);
                        let y = ry * Math.cos(u);
                        let z = rz * Math.sin(u) * Math.sin(v);

                        // Position: Posterior (Z+) and Inferior (Y+)
                        y += 40;
                        z += 40;

                        // Folia Texture (Ridges)
                        // Displace along normal based on Y
                        const disp = Math.sin(y * 0.5) * 1.5;
                        x += x / rx * disp;
                        z += z / rz * disp;

                        vs.push({ x, y, z });
                    }
                }
                // Faces
                for (let i = 0; i < rings; i++) {
                    for (let j = 0; j < segments; j++) {
                        const row1 = i * (segments + 1);
                        const row2 = (i + 1) * (segments + 1);
                        fs.push([row1 + j, row1 + j + 1, row2 + j]);
                        fs.push([row1 + j + 1, row2 + j + 1, row2 + j]);
                    }
                }
                return { vs, fs };
            };

            const cerebellum = createCerebellum();
            addMesh(cerebellum.vs, cerebellum.fs, 'cerebellum');

            return { vertices, faces };
        },

        drawNeuron(ctx, p, neuronMeshes, camera, projection) {
            const pyramidalRegions = ['pfc', 'temporalLobe', 'parietalLobe', 'occipitalLobe', 'hippocampus'];
            const type = pyramidalRegions.includes(p.region) ? 'pyramidal' : 'stellate';

            if (neuronMeshes && !neuronMeshes[type]) {
                neuronMeshes[type] = type === 'pyramidal' ?
                    this.generatePyramidalMesh() :
                    this.generateStellateMesh();
            }
            const mesh = neuronMeshes ? neuronMeshes[type] : (type === 'pyramidal' ? this.generatePyramidalMesh() : this.generateStellateMesh());

            const rotX = p.x * 0.01;
            const rotY = p.y * 0.01 + Date.now() * 0.0005;
            const rotZ = p.z * 0.01;

            const transformedVertices = mesh.vertices.map(v => {
                let x = v.x, y = v.y, z = v.z;
                // Rotate Y
                let tx = x * Math.cos(rotY) - z * Math.sin(rotY);
                let tz = x * Math.sin(rotY) + z * Math.cos(rotY);
                x = tx; z = tz;
                // Rotate X
                let ty = y * Math.cos(rotX) - z * Math.sin(rotX);
                tz = y * Math.sin(rotX) + z * Math.cos(rotX);
                y = ty; z = tz;
                // Scale
                const scale = type === 'pyramidal' ? 1.5 : 1.0;
                x *= scale; y *= scale; z *= scale;
                // Translate
                return { x: x + p.x, y: y + p.y, z: z + p.z };
            });

            const projected = transformedVertices.map(v =>
                GreenhouseModels3DMath.project3DTo2D(v.x, v.y, v.z, camera, projection)
            );

            // ... (rest of drawing logic)
            // I need to copy the face sorting and drawing loop.

            // And helpers.

            // Sort faces by average Z-depth for correct rendering order (painter's algorithm)
            const facesWithDepth = mesh.faces.map(faceIndices => {
                const avgDepth = faceIndices.reduce((sum, idx) => sum + projected[idx].depth, 0) / faceIndices.length;
                return { faceIndices, avgDepth };
            }).sort((a, b) => b.avgDepth - a.avgDepth); // Sort from back to front

            facesWithDepth.forEach(({ faceIndices }) => {
                const p0 = projected[faceIndices[0]];
                const p1 = projected[faceIndices[1]];
                const p2 = projected[faceIndices[2]];

                if (p0.scale <= 0 || p1.scale <= 0 || p2.scale <= 0) return; // Don't draw if behind camera

                // Backface culling (simple 2D cross product check)
                const crossProduct = (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
                if (crossProduct >= 0) return; // Only draw front-facing triangles

                ctx.beginPath();
                ctx.moveTo(p0.x, p0.y);
                ctx.lineTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.closePath();

                // Determine color based on neuron's state (e.g., active, inactive)
                let baseColor = p.baseColor || '#A0AEC0';
                if (p.isFocused) {
                    baseColor = this.adjustColor(baseColor, 50); // Brighten if focused
                }

                ctx.fillStyle = baseColor;
                ctx.strokeStyle = this.adjustColor(baseColor, -50); // Darker border
                ctx.lineWidth = 1;

                ctx.fill();
                ctx.stroke();
            });

            // Phase 13: Pulse Effects (Ripple)
            // Simulate firing based on ID and time
            const fireCycle = (Date.now() * 0.001 + (p.id || 0) * 0.1) % 3.0;
            if (fireCycle < 1.0) {
                const t = fireCycle; // 0 to 1
                const radius = (10 + t * 30) * (p.scale || 1);
                const alpha = (1.0 - t) * 0.8;

                ctx.beginPath();
                ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        },

        generatePyramidalMesh() {
            // Anatomically Correct Pyramidal Neuron
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
                [0, 1, 2], [0, 2, 3], [0, 3, 1],
                [4, 0, 1], [4, 1, 3], [4, 3, 0],
                [1, 5, 2], [2, 6, 3], [3, 7, 1]
            ];

            // Add Synaptic Pegs
            this._addSynapticPegs(vertices, faces, [
                { x: 0, y: -h * 1.8, z: 0 },
                { x: r * 0.8, y: h * 0.8, z: r * 0.8 }
            ]);

            return { vertices, faces };
        },

        generateStellateMesh() {
            // Anatomically Correct Stellate Neuron
            const s = 5;
            const vertices = [
                { x: s, y: 0, z: 0 }, { x: -s, y: 0, z: 0 },
                { x: 0, y: s, z: 0 }, { x: 0, y: -s, z: 0 },
                { x: 0, y: 0, z: s }, { x: 0, y: 0, z: -s },
                { x: s * 2, y: s, z: s }, { x: -s * 2, y: -s, z: s },
                { x: s, y: s * 2, z: -s }, { x: -s, y: -s * 2, z: -s }
            ];
            const faces = [
                [2, 0, 4], [2, 4, 1], [2, 1, 5], [2, 5, 0],
                [3, 4, 0], [3, 1, 4], [3, 5, 1], [3, 0, 5],
                [0, 6, 2], [1, 7, 3], [2, 8, 5], [3, 9, 4]
            ];

            // Add Synaptic Pegs
            this._addSynapticPegs(vertices, faces, [
                { x: s * 1.5, y: s * 0.8, z: s * 0.8 }
            ]);

            return { vertices, faces };
        },

        _addSynapticPegs(vertices, faces, positions) {
            positions.forEach(pos => {
                const idx = vertices.length;
                const size = 1.2;
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
        },

        adjustColor(hex, amount) {
            let c = parseInt(hex.substring(1), 16);
            let r = (c >> 16) + amount;
            let g = (c >> 8 & 0x00FF) + amount;
            let b = (c & 0x0000FF) + amount;
            r = Math.min(255, Math.max(0, r));
            g = Math.min(255, Math.max(0, g));
            b = Math.min(255, Math.max(0, b));
            return '#' + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
        },
    };

    window.GreenhouseGeneticBrain = GreenhouseGeneticBrain;
})();
