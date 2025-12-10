(function () {
    'use strict';

    const GreenhouseNeuroSynapse = {

        drawConnections(ctx, connections, neurons, camera, projection, width, height) {
            // Draw Connections (True 3D Tubes)
            const lightDir = { x: 0.5, y: -0.5, z: 1 };
            const len = Math.sqrt(lightDir.x * lightDir.x + lightDir.y * lightDir.y + lightDir.z * lightDir.z);
            lightDir.x /= len; lightDir.y /= len; lightDir.z /= len;

            // Batching Arrays for LOD Lines
            const batchCyan = [];
            const batchPink = [];

            connections.forEach(conn => {
                if (!conn.mesh) return;

                // LOD Check
                const p1 = GreenhouseModels3DMath.project3DTo2D(conn.from.x, conn.from.y, conn.from.z, camera, projection);
                const p2 = GreenhouseModels3DMath.project3DTo2D(conn.to.x, conn.to.y, conn.to.z, camera, projection);

                if (p1.scale <= 0 && p2.scale <= 0) return; // Culling

                const avgScale = (Math.max(0, p1.scale) + Math.max(0, p2.scale)) / 2;

                if (avgScale < 0.5) {
                    // Low Detail: Add to batch
                    const alpha = GreenhouseModels3DMath.applyDepthFog(0.5, (p1.depth + p2.depth) / 2);
                    // We can't batch alpha easily in 2D context without separate passes or just using average alpha?
                    // Or we just use a fixed alpha for LOD lines to be fast.
                    // Let's use the calculated alpha but we have to draw individually if alpha varies.
                    // True batching (one path) requires same state.
                    // If we want performance, we can group by alpha buckets? Or just draw individually but simple lines.
                    // Actually, `ctx.beginPath` + `ctx.moveTo` + `ctx.lineTo` ... `ctx.stroke` IS batching if we do it for many lines.
                    // But we need to change color/alpha.

                    // Optimization: Group by "High Alpha" (>0.5) and "Low Alpha" (<0.5)?
                    // Or just draw them. The bottleneck is usually switching state.
                    // Let's try to batch by color, and ignore per-line alpha (use distance fog on the batch?).
                    // Or just use the average depth of the whole brain? No.

                    // Let's stick to individual strokes for now but optimized (no save/restore if possible).
                    // The previous code used save/restore. Let's remove that.

                    ctx.strokeStyle = conn.weight > 0 ? `rgba(76, 201, 240, ${alpha})` : `rgba(247, 37, 133, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                    return;
                }

                // Transform Vertices
                // The tube mesh is already in World Space (generated between n1 and n2).
                // We DO NOT need to rotate it again, unless we want the whole brain to spin.
                // The brain spinning is handled by the Camera rotation in project3DTo2D.
                // So we just pass the vertices as is!

                const transformedVertices = conn.mesh.vertices; // Already in World Space

                const projected = transformedVertices.map(v =>
                    GreenhouseModels3DMath.project3DTo2D(v.x, v.y, v.z, camera, projection)
                );

                // Sort Faces
                const facesWithDepth = conn.mesh.faces.map(face => {
                    const v1 = projected[face[0]];
                    const v2 = projected[face[1]];
                    const v3 = projected[face[2]];

                    if (v1.scale > 0 && v2.scale > 0 && v3.scale > 0) {
                        return {
                            face,
                            depth: (v1.depth + v2.depth + v3.depth) / 3,
                            vertices: [v1, v2, v3],
                            origVertices: [transformedVertices[face[0]], transformedVertices[face[1]], transformedVertices[face[2]]]
                        };
                    }
                    return null;
                }).filter(f => f !== null).sort((a, b) => b.depth - a.depth);

                const alpha = GreenhouseModels3DMath.applyDepthFog(0.8, facesWithDepth[0]?.depth || 1);

                facesWithDepth.forEach(({ vertices, origVertices }) => {
                    const [v1, v2, v3] = vertices;
                    const [ov1, ov2, ov3] = origVertices;

                    // Backface Culling
                    const dx1 = v2.x - v1.x;
                    const dy1 = v2.y - v1.y;
                    const dx2 = v3.x - v1.x;
                    const dy2 = v3.y - v1.y;
                    const cross = dx1 * dy2 - dy1 * dx2;

                    if (cross > 0) {
                        // Calculate Normal
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

                        let intensity = 0.5;
                        if (nLen > 0) {
                            nx /= nLen; ny /= nLen; nz /= nLen;
                            const diffuse = Math.max(0, nx * lightDir.x + ny * lightDir.y + nz * lightDir.z);
                            intensity += diffuse * 0.5;
                        }

                        // Color based on weight
                        const baseColor = conn.weight > 0 ? { r: 100, g: 200, b: 255 } : { r: 255, g: 100, b: 100 };
                        const litR = Math.min(255, baseColor.r * intensity);
                        const litG = Math.min(255, baseColor.g * intensity);
                        const litB = Math.min(255, baseColor.b * intensity);

                        ctx.fillStyle = `rgba(${litR}, ${litG}, ${litB}, ${alpha})`;
                        ctx.beginPath();
                        ctx.moveTo(v1.x, v1.y);
                        ctx.lineTo(v2.x, v2.y);
                        ctx.lineTo(v3.x, v3.y);
                        ctx.fill();
                    }
                });

                // Traveling Pulse (Action Potential)
                // Use connection ID to seed the offset so it's consistent but different per connection
                const seed = (conn.from.id + conn.to.id) * 0.1;
                const speed = 0.001; // Speed of pulse
                const t = (Date.now() * speed + seed) % 1.0;

                // Only draw if within range (0 to 1) - modulo handles this, but we might want gaps
                // Let's add a "gap" by using modulo > 1.0
                const cycle = (Date.now() * speed + seed) % 2.0; // 50% duty cycle

                if (cycle < 1.0) {
                    const t = cycle; // 0 to 1
                    const mt = 1 - t;

                    // Bezier Point
                    const sparkP = {
                        x: mt * mt * conn.from.x + 2 * mt * t * conn.controlPoint.x + t * t * conn.to.x,
                        y: mt * mt * conn.from.y + 2 * mt * t * conn.controlPoint.y + t * t * conn.to.y,
                        z: mt * mt * conn.from.z + 2 * mt * t * conn.controlPoint.z + t * t * conn.to.z
                    };

                    const sparkProj = GreenhouseModels3DMath.project3DTo2D(sparkP.x, sparkP.y, sparkP.z, camera, projection);

                    if (sparkProj.scale > 0) {
                        // Glow Effect
                        const size = 4 * sparkProj.scale;
                        const alpha = GreenhouseModels3DMath.applyDepthFog(1, sparkProj.depth);

                        ctx.save();
                        ctx.globalAlpha = alpha;

                        // Core
                        ctx.fillStyle = '#FFF';
                        ctx.beginPath();
                        ctx.arc(sparkProj.x, sparkProj.y, size * 0.5, 0, Math.PI * 2);
                        ctx.fill();

                        // Outer Glow
                        const grad = ctx.createRadialGradient(sparkProj.x, sparkProj.y, size * 0.5, sparkProj.x, sparkProj.y, size * 2);
                        grad.addColorStop(0, 'rgba(255, 255, 100, 0.8)');
                        grad.addColorStop(1, 'rgba(255, 255, 100, 0)');
                        ctx.fillStyle = grad;
                        ctx.beginPath();
                        ctx.arc(sparkProj.x, sparkProj.y, size * 2, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.restore();
                    }
                }
            });
        },

        drawSynapsePiP(ctx, x, y, w, h, connection, synapseMeshes, isMainView = false) {
            // Draw Frame (Only if PiP)
            if (!isMainView) {
                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.strokeStyle = '#4ca1af';
                ctx.lineWidth = 2;
                ctx.fillRect(x, y, w, h);
                ctx.strokeRect(x, y, w, h);

                // Clip to frame
                ctx.beginPath();
                ctx.rect(x, y, w, h);
                ctx.clip();

                // Label
                ctx.fillStyle = '#4ca1af';
                ctx.font = '12px Arial';
                ctx.fillText("Synapse View", x + 10, y + 20);
            } else {
                ctx.save(); // Save for restore later
                // No frame, no clip, no label for main view (or maybe a floating label?)
            }

            if (!connection || !synapseMeshes) {
                ctx.fillStyle = '#666';
                ctx.textAlign = 'center';
                ctx.fillText("No Connection Selected", x + w / 2, y + h / 2);
                ctx.restore();
                return;
            }

            // 3D Synapse Rendering
            // We render the pre-synaptic bulb (top) and post-synaptic cup (bottom)
            // Rotating slowly

            const time = Date.now() * 0.001;
            const rotationY = time * 0.5;

            const synapseCamera = {
                x: 0, y: 0, z: -200,
                rotationX: 0.2,
                rotationY: rotationY,
                rotationZ: 0,
                fov: 400
            };

            const drawMesh = (mesh, offsetY, color) => {
                const projectedFaces = [];
                const lightDir = { x: 0.5, y: -0.5, z: 1 };
                const len = Math.sqrt(lightDir.x * lightDir.x + lightDir.y * lightDir.y + lightDir.z * lightDir.z);
                lightDir.x /= len; lightDir.y /= len; lightDir.z /= len;

                mesh.faces.forEach(face => {
                    const v1 = mesh.vertices[face[0]];
                    const v2 = mesh.vertices[face[1]];
                    const v3 = mesh.vertices[face[2]];

                    // Transform & Project
                    const transform = (v) => {
                        let vx = v.x, vy = v.y + offsetY, vz = v.z;
                        // Rotate Y
                        let tx = vx * Math.cos(rotationY) - vz * Math.sin(rotationY);
                        let tz = vx * Math.sin(rotationY) + vz * Math.cos(rotationY);
                        vx = tx; vz = tz;

                        return GreenhouseModels3DMath.project3DTo2D(vx, vy, vz, synapseCamera, { width: w, height: h, near: 10, far: 1000 });
                    };

                    const p1 = transform(v1);
                    const p2 = transform(v2);
                    const p3 = transform(v3);

                    if (p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
                        const depth = (p1.depth + p2.depth + p3.depth) / 3;

                        // Calculate Normal (World Space, rotated)
                        // We need rotated vertices for normal calc
                        const rotate = (v) => {
                            let vx = v.x, vy = v.y + offsetY, vz = v.z;
                            let tx = vx * Math.cos(rotationY) - vz * Math.sin(rotationY);
                            let tz = vx * Math.sin(rotationY) + vz * Math.cos(rotationY);
                            return { x: tx, y: vy, z: tz };
                        };
                        const rv1 = rotate(v1);
                        const rv2 = rotate(v2);
                        const rv3 = rotate(v3);

                        const ux = rv2.x - rv1.x;
                        const uy = rv2.y - rv1.y;
                        const uz = rv2.z - rv1.z;
                        const vx = rv3.x - rv1.x;
                        const vy = rv3.y - rv1.y;
                        const vz = rv3.z - rv1.z;

                        let nx = uy * vz - uz * vy;
                        let ny = uz * vx - ux * vz;
                        let nz = ux * vy - uy * vx;
                        const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);

                        if (nLen > 0) {
                            nx /= nLen; ny /= nLen; nz /= nLen;

                            // Backface Culling
                            // View vector is roughly 0,0,1 (towards camera)
                            // If Normal.Z > 0, it faces camera
                            if (nz > 0) {
                                // Phong Shading
                                const diffuse = Math.max(0, nx * lightDir.x + ny * lightDir.y + nz * lightDir.z);
                                const specular = Math.pow(diffuse, 20); // Shininess

                                projectedFaces.push({ p1, p2, p3, depth, diffuse, specular });
                            }
                        }
                    }
                });

                projectedFaces.sort((a, b) => b.depth - a.depth);

                projectedFaces.forEach(f => {
                    // Parse base color
                    let r = 100, g = 100, b = 100;
                    if (color === '#FF6464') { r = 255; g = 100; b = 100; }
                    else if (color === '#64FF96') { r = 100; g = 255; b = 150; }

                    const ambient = 0.3;
                    const intensity = ambient + f.diffuse * 0.7 + f.specular * 0.6;

                    const litR = Math.min(255, r * intensity + f.specular * 255);
                    const litG = Math.min(255, g * intensity + f.specular * 255);
                    const litB = Math.min(255, b * intensity + f.specular * 255);

                    ctx.fillStyle = `rgb(${litR}, ${litG}, ${litB})`;
                    ctx.beginPath();
                    ctx.moveTo(f.p1.x + x, f.p1.y + y);
                    ctx.lineTo(f.p2.x + x, f.p2.y + y);
                    ctx.lineTo(f.p3.x + x, f.p3.y + y);
                    ctx.fill();
                });
            };

            // Draw Pre-synaptic (Top) - Cyan/Blue (Axonal)
            drawMesh(synapseMeshes.pre, -60, '#4CC9F0');

            // Draw Post-synaptic (Bottom) - Orange/Gold (Dendritic)
            drawMesh(synapseMeshes.post, 60, '#F72585');

            // Initialize Synapse Details (Vesicles, Mitochondria) if not present
            if (!connection.synapseDetails) {
                connection.synapseDetails = {
                    vesicles: [],
                    mitochondria: [],
                    particles: []
                };

                // Generate Vesicles (Pre-synaptic only)
                for (let i = 0; i < 30; i++) {
                    connection.synapseDetails.vesicles.push({
                        x: (Math.random() - 0.5) * 60,
                        y: (Math.random() * -40) - 10, // Top half
                        z: (Math.random() - 0.5) * 60
                    });
                }

                // Generate Mitochondria
                // Pre-synaptic
                connection.synapseDetails.mitochondria.push({ x: -20, y: -50, z: 10, rot: Math.random() });
                // Post-synaptic
                connection.synapseDetails.mitochondria.push({ x: 20, y: 50, z: -10, rot: Math.random() });
            }

            // Draw Internal Structures (Projected)
            const drawInternal = (obj, type) => {
                const p = GreenhouseModels3DMath.project3DTo2D(obj.x, obj.y + (type === 'post' ? 60 : -60), obj.z, synapseCamera, { width: w, height: h, near: 10, far: 1000 });
                if (p.scale > 0) {
                    if (type === 'vesicle') {
                        const size = 3 * p.scale;
                        ctx.fillStyle = 'rgba(255, 255, 200, 0.6)';
                        ctx.beginPath();
                        ctx.arc(p.x + x, p.y + y, size, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (type === 'mito') {
                        const size = 8 * p.scale;
                        ctx.save();
                        ctx.translate(p.x + x, p.y + y);
                        ctx.rotate(obj.rot);
                        ctx.fillStyle = 'rgba(100, 200, 100, 0.5)';
                        ctx.beginPath();
                        ctx.ellipse(0, 0, size * 2, size, 0, 0, Math.PI * 2);
                        ctx.fill();
                        // Internal folds (cristae)
                        ctx.strokeStyle = 'rgba(150, 255, 150, 0.7)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(-size, -size / 2); ctx.lineTo(-size / 2, size / 2);
                        ctx.moveTo(-size / 4, -size / 2); ctx.lineTo(size / 4, size / 2);
                        ctx.moveTo(size / 2, -size / 2); ctx.lineTo(size, size / 2);
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            };

            // Draw Vesicles
            connection.synapseDetails.vesicles.forEach(v => drawInternal(v, 'vesicle'));

            // Draw Mitochondria
            connection.synapseDetails.mitochondria.forEach(m => drawInternal(m, 'mito'));

            // Draw Neurotransmitters (Particles)
            // Update Particles
            if (connection.synapseDetails.particles.length < 20 && Math.random() < 0.1) {
                connection.synapseDetails.particles.push({
                    x: (Math.random() - 0.5) * 40,
                    y: -20, // Start at cleft top
                    z: (Math.random() - 0.5) * 40,
                    life: 1.0
                });
            }

            connection.synapseDetails.particles.forEach((p, i) => {
                p.y += 1.0; // Move down
                p.life -= 0.02;

                const proj = GreenhouseModels3DMath.project3DTo2D(p.x, p.y, p.z, synapseCamera, { width: w, height: h, near: 10, far: 1000 });
                if (proj.scale > 0 && p.life > 0) {
                    const alpha = p.life;
                    ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(proj.x + x, proj.y + y, 2 * proj.scale, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Cleanup dead particles
            connection.synapseDetails.particles = connection.synapseDetails.particles.filter(p => p.life > 0);

            ctx.restore();
        }
    };

    window.GreenhouseNeuroSynapse = GreenhouseNeuroSynapse;
})();
