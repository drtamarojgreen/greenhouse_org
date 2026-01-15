(function () {
    'use strict';

    const GreenhouseGeneticBrain = {
        drawTargetView(ctx, x, y, w, h, activeGene, activeGeneIndex, brainShell, drawPiPFrameCallback, cameraState) {
            // Log every call
            if (!this._drawTargetCallCount) this._drawTargetCallCount = 0;
            this._drawTargetCallCount++;

            if (this._drawTargetCallCount % 60 === 0) {
                console.log('[drawTargetView] Called:', {
                    activeGene: JSON.stringify(activeGene, null, 2),
                    call: this._drawTargetCallCount,
                    x, y, w, h,
                    hasBrainShell: !!brainShell,
                    hasCamera: !!(cameraState && cameraState.camera),
                    cameraRotY: cameraState?.camera?.rotationY?.toFixed(3) || cameraState?.rotationY?.toFixed(3)
                });
            }

            if (drawPiPFrameCallback) {
                drawPiPFrameCallback(ctx, x, y, w, h, "Target: Brain Region");
            }

            // Use the same brain rendering as neuro page
            if (!brainShell) {
                // Draw placeholder
                ctx.save();
                ctx.translate(x, y);
                ctx.fillStyle = '#FF0000';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText("No Brain Shell", w / 2, h / 2);
                ctx.restore();
                return;
            }

            // Use the specific camera for this view - no fallback
            if (!cameraState || !cameraState.camera) {
                console.error('[drawTargetView] No camera provided!');
                return;
            }
            const targetCamera = cameraState.camera;

            const projection = { width: w, height: h, near: 10, far: 5000 };

            // Use the new self-contained rendering function
            ctx.save();
            ctx.translate(x, y);
            ctx.beginPath();
            ctx.rect(0, 0, w, h);
            ctx.clip();

            if (window.GreenhouseModels3DMath) {
                this.drawBrainShell(ctx, brainShell, targetCamera, projection, w, h, activeGene);
            }

            ctx.restore();
        },

        drawBrainShell(ctx, brainShell, camera, projection, width, height, activeGene = null) {
            if (!brainShell || !window.GreenhouseModels3DMath) return;
            const targetRegion = activeGene ? activeGene.region : null;
            const regions = brainShell.regions;
            const lightDir = { x: 0.5, y: -0.5, z: 1 };
            const len = Math.sqrt(lightDir.x * lightDir.x + lightDir.y * lightDir.y + lightDir.z * lightDir.z);
            lightDir.x /= len; lightDir.y /= len; lightDir.z /= len;

            const projectedVertices = brainShell.vertices.map(v =>
                GreenhouseModels3DMath.project3DTo2D(v.x, v.y, v.z, camera, projection)
            );

            const facesToDraw = [];
            brainShell.faces.forEach(f => {
                const p1 = projectedVertices[f.indices[0]], p2 = projectedVertices[f.indices[1]], p3 = projectedVertices[f.indices[2]];
                if (p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
                    const isFront = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x) > 0;
                    const v1 = brainShell.vertices[f.indices[0]], v2 = brainShell.vertices[f.indices[1]], v3 = brainShell.vertices[f.indices[2]];
                    const normal = GreenhouseModels3DMath.calculateFaceNormal(v1, v2, v3);
                    facesToDraw.push({ p1, p2, p3, depth: (p1.depth + p2.depth + p3.depth) / 3, normal, region: f.region, isFront });
                }
            });

            facesToDraw.sort((a, b) => b.depth - a.depth);

            facesToDraw.forEach(f => {
                let nx = f.normal.x, ny = f.normal.y, nz = f.normal.z;
                if (!f.isFront) { nx = -nx; ny = -ny; nz = -nz; }
                const diffuse = Math.max(0, nx * lightDir.x + ny * lightDir.y + nz * lightDir.z);
                let r = 100, g = 100, b = 100, a = 0.1;
                if (f.region && regions[f.region]) {
                    const match = regions[f.region].color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
                    if (match) { r = parseInt(match[1]); g = parseInt(match[2]); b = parseInt(match[3]); a = parseFloat(match[4] || 1); }
                }
                const isTarget = (targetRegion && (f.region === targetRegion || (targetRegion === 'pfc' && f.region === 'prefrontalCortex')));
                if (isTarget) {
                    ctx.fillStyle = `rgba(57, 255, 20, ${GreenhouseModels3DMath.applyDepthFog(0.9, f.depth)})`;
                } else {
                    const intensity = 0.3 + diffuse * 0.7;
                    ctx.fillStyle = `rgba(${Math.min(255, r * intensity)}, ${Math.min(255, g * intensity)}, ${Math.min(255, b * intensity)}, ${GreenhouseModels3DMath.applyDepthFog(a, f.depth)})`;
                }
                ctx.beginPath(); ctx.moveTo(f.p1.x, f.p1.y); ctx.lineTo(f.p2.x, f.p2.y); ctx.lineTo(f.p3.x, f.p3.y); ctx.fill();
            });

            // NEW: Topological Projection - Smooth Surface Overlay
            this.drawSurfaceGrid(ctx, projectedVertices, brainShell);
            this.drawTopologicalBoundaries(ctx, projectedVertices, brainShell.vertices, brainShell.faces, brainShell, camera, projection);
        },

        drawSurfaceGrid(ctx, projectedVertices, brainShell) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            const bands = 40;
            for (let lat = 0; lat <= bands; lat += 5) {
                for (let lon = 0; lon <= bands; lon++) {
                    const i = lat * (bands + 1) + lon;
                    const p = projectedVertices[i];
                    if (p && p.scale > 0) {
                        if (lon === 0) ctx.moveTo(p.x, p.y);
                        else ctx.lineTo(p.x, p.y);
                    }
                }
            }
            ctx.stroke();
            ctx.restore();
        },

        drawTopologicalBoundaries(ctx, projectedVertices, vertices, faces, brainShell, camera, projection) {
            if (!brainShell.regionalPlanes) return;
            ctx.save();
            ctx.setLineDash([8, 4]);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(0, 242, 255, 0.4)';
            const radius = 200;

            brainShell.regionalPlanes.forEach(plane => {
                const axis = plane.axis;
                const threshold = plane.value * radius;
                faces.forEach(face => {
                    const idx = face.indices || face;
                    const v1 = vertices[idx[0]], v2 = vertices[idx[1]], v3 = vertices[idx[2]];
                    const s1 = v1[axis] > threshold, s2 = v2[axis] > threshold, s3 = v3[axis] > threshold;

                    if ((s1 !== s2) || (s1 !== s3) || (s2 !== s3)) {
                        const points = [];
                        const checkEdge = (va, vb) => {
                            if ((va[axis] > threshold) !== (vb[axis] > threshold)) {
                                const t = (threshold - va[axis]) / (vb[axis] - va[axis]);
                                const inter = {
                                    x: va.x + t * (vb.x - va.x),
                                    y: va.y + t * (vb.y - va.y),
                                    z: va.z + t * (vb.z - va.z)
                                };
                                const proj = GreenhouseModels3DMath.project3DTo2D(inter.x, inter.y, inter.z, camera, projection);
                                if (proj.scale > 0 && proj.depth < 0.8) points.push(proj);
                            }
                        };
                        checkEdge(v1, v2); checkEdge(v2, v3); checkEdge(v3, v1);
                        if (points.length === 2) {
                            ctx.beginPath();
                            ctx.moveTo(points[0].x, points[0].y);
                            ctx.lineTo(points[1].x, points[1].y);
                            // Sharper depth clipping to keep lines internal
                            const opacity = GreenhouseModels3DMath.applyDepthFog(1, points[0].depth, 0.2, 0.7);
                            ctx.globalAlpha = 0.5 * opacity;
                            ctx.stroke();
                        }
                    }
                });
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
                let baseColor = p.baseColor || '#00FFFF'; // Default to cyan
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
            const r = 6;
            const h = 12;
            const vertices = [
                { x: 0, y: -h, z: 0 },
                { x: r, y: r, z: r },
                { x: -r, y: r, z: r },
                { x: 0, y: r, z: -r }
            ];
            const faces = [
                [0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2]
            ];
            return { vertices, faces };
        },

        generateStellateMesh() {
            const s = 4;
            const p = 8;
            const vertices = [
                { x: -s, y: -s, z: -s }, { x: s, y: -s, z: -s }, { x: s, y: s, z: -s }, { x: -s, y: s, z: -s },
                { x: -s, y: -s, z: s }, { x: s, y: -s, z: s }, { x: s, y: s, z: s }, { x: -s, y: s, z: s },
                { x: 0, y: 0, z: -s - p }, { x: 0, y: 0, z: s + p },
                { x: 0, y: -s - p, z: 0 }, { x: s + p, y: 0, z: 0 },
                { x: -s - p, y: 0, z: 0 }, { x: s + p, y: 0, z: 0 }
            ];
            const faces = [];
            faces.push([10, 0, 1], [10, 1, 5], [10, 5, 4], [10, 4, 0]);
            faces.push([11, 3, 2], [11, 2, 6], [11, 6, 7], [11, 7, 3]);
            faces.push([9, 4, 5], [9, 5, 6], [9, 6, 7], [9, 7, 4]);
            faces.push([8, 1, 0], [8, 0, 3], [8, 3, 2], [8, 2, 1]);
            faces.push([12, 0, 4], [12, 4, 7], [12, 7, 3], [12, 3, 0]);
            faces.push([13, 5, 1], [13, 1, 2], [13, 2, 6], [13, 6, 5]);
            return { vertices, faces };
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
