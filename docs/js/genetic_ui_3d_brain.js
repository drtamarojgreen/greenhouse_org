(function () {
    'use strict';

    const GreenhouseGeneticBrain = {
        drawTargetView(ctx, x, y, w, h, activeGene, activeGeneIndex, brainShell, drawPiPFrameCallback, cameraState) {
            // Log every call
            if (!this._drawTargetCallCount) this._drawTargetCallCount = 0;
            this._drawTargetCallCount++;
            
            if (this._drawTargetCallCount % 60 === 0) {
                console.log('[drawTargetView] Called:', {
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

            this.drawBrainShell(ctx, brainShell, targetCamera, projection, w, h);

            ctx.restore();
        },

        drawBrainShell(ctx, brainShell, camera, projection, width, height) {
            if (!brainShell) return;

            const vertices = brainShell.vertices;
            const faces = brainShell.faces;

            // Simplified lighting and color for the genetic brain
            const lightDir = { x: 0.5, y: -0.5, z: 1 };
            const len = Math.sqrt(lightDir.x**2 + lightDir.y**2 + lightDir.z**2);
            lightDir.x /= len; lightDir.y /= len; lightDir.z /= len;

            const projectedVertices = vertices.map(v =>
                GreenhouseModels3DMath.project3DTo2D(v.x, v.y, v.z, camera, projection)
            );

            const facesToDraw = [];
            faces.forEach(face => {
                const p1 = projectedVertices[face[0]];
                const p2 = projectedVertices[face[1]];
                const p3 = projectedVertices[face[2]];

                if (p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
                    const dx1 = p2.x - p1.x, dy1 = p2.y - p1.y;
                    const dx2 = p3.x - p1.x, dy2 = p3.y - p1.y;

                    if ((dx1 * dy2 - dy1 * dx2) > 0) {
                        const depth = (p1.depth + p2.depth + p3.depth) / 3;

                        const v1 = vertices[face[0]], v2 = vertices[face[1]], v3 = vertices[face[2]];
                        const ux = v2.x - v1.x, uy = v2.y - v1.y, uz = v2.z - v1.z;
                        const vx = v3.x - v1.x, vy = v3.y - v1.y, vz = v3.z - v1.z;

                        let nx = uy * vz - uz * vy;
                        let ny = uz * vx - ux * vz;
                        let nz = ux * vy - uy * vx;
                        const nLen = Math.sqrt(nx**2 + ny**2 + nz**2);
                        if (nLen > 0) {
                            nx /= nLen; ny /= nLen; nz /= nLen;
                        }

                        facesToDraw.push({ p1, p2, p3, depth, nx, ny, nz });
                    }
                }
            });

            facesToDraw.sort((a, b) => b.depth - a.depth);

            facesToDraw.forEach(f => {
                const diffuse = Math.max(0, f.nx * lightDir.x + f.ny * lightDir.y + f.nz * lightDir.z);
                const specular = Math.pow(diffuse, 30);
                
                // Default color for genetic brain parts
                let r = 120, g = 140, b = 160, a = 0.6;
                
                const ambient = 0.2;
                const lightIntensity = ambient + diffuse * 0.8 + specular * 0.5;
                const litR = Math.min(255, r * lightIntensity + specular * 255);
                const litG = Math.min(255, g * lightIntensity + specular * 255);
                const litB = Math.min(255, b * lightIntensity + specular * 255);
                
                const fog = GreenhouseModels3DMath.applyDepthFog(a, f.depth);

                ctx.fillStyle = `rgba(${litR}, ${litG}, ${litB}, ${fog})`;
                ctx.beginPath();
                ctx.moveTo(f.p1.x, f.p1.y);
                ctx.lineTo(f.p2.x, f.p2.y);
                ctx.lineTo(f.p3.x, f.p3.y);
                ctx.fill();
            });
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
