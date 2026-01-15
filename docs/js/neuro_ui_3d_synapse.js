(function () {
    'use strict';

    const GreenhouseNeuroSynapse = {

        drawConnections(ctx, connections, neurons, camera, projection, width, height) {
            // Draw Connections (True 3D Tubes)
            const lightDir = { x: 0.5, y: -0.5, z: 1 };
            const len = Math.sqrt(lightDir.x * lightDir.x + lightDir.y * lightDir.y + lightDir.z * lightDir.z);
            lightDir.x /= len; lightDir.y /= len; lightDir.z /= len;

            // Batching Arrays for LOD Lines
            // Key: "color_alpha" -> Path2D
            const batches = {};

            connections.forEach(conn => {
                if (!conn.mesh) return;

                // LOD Check
                const p1 = GreenhouseModels3DMath.project3DTo2D(conn.from.x, conn.from.y, conn.from.z, camera, projection);
                const p2 = GreenhouseModels3DMath.project3DTo2D(conn.to.x, conn.to.y, conn.to.z, camera, projection);

                if (p1.scale <= 0 && p2.scale <= 0) return; // Culling

                const avgScale = (Math.max(0, p1.scale) + Math.max(0, p2.scale)) / 2;

                if (avgScale < 0.5) {
                    // Low Detail: Batching
                    const alphaRaw = GreenhouseModels3DMath.applyDepthFog(0.5, (p1.depth + p2.depth) / 2);
                    // Quantize alpha to 0.1 steps for batching
                    const alpha = Math.round(alphaRaw * 10) / 10;
                    if (alpha <= 0) return;

                    const colorType = conn.weight > 0 ? 'gold' : 'silver';
                    const key = `${colorType}_${alpha}`;

                    if (!batches[key]) batches[key] = new Path2D();

                    batches[key].moveTo(p1.x, p1.y);
                    batches[key].lineTo(p2.x, p2.y);
                    return;
                }

                // High Detail (Tube Mesh) - Draw Individually
                // ... (Keep existing high detail logic)
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

                        // Color based on weight: Gold (Excitatory) vs Silver (Inhibitory)
                        const baseColor = conn.weight > 0 ? { r: 255, g: 215, b: 0 } : { r: 176, g: 196, b: 222 };
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

            // Execute Batches
            ctx.lineWidth = 1;
            for (const key in batches) {
                const [colorType, alpha] = key.split('_');
                const color = colorType === 'gold' ? `rgba(255, 215, 0, ${alpha})` : `rgba(176, 196, 222, ${alpha})`;

                ctx.strokeStyle = color;
                ctx.stroke(batches[key]);
            }
        },

        drawSynapsePiP(ctx, x, y, w, h, connection, synapseMeshes, isMainView = false, externalCamera = null) {
            // Initialize camera controller if not exists
            if (!this.synapseCameraController && window.NeuroSynapseCameraController) {
                this.synapseCameraController = new window.NeuroSynapseCameraController();
            }

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
                ctx.fillText("Synapse View (Drag: Rotate, Shift+Drag: Pan, Wheel: Zoom)", x + 10, y + 20);

                // Reset button
                ctx.fillStyle = 'rgba(76, 161, 175, 0.8)';
                ctx.fillRect(x + w - 60, y + 5, 50, 20);
                ctx.fillStyle = '#fff';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText("Reset", x + w - 35, y + 17);
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
            // Use camera controller if available, otherwise use external camera or default
            let synapseCamera;
            if (externalCamera) {
                synapseCamera = externalCamera;
            } else if (this.synapseCameraController) {
                this.synapseCameraController.update();
                synapseCamera = this.synapseCameraController.getCamera();
            } else {
                synapseCamera = {
                    x: 0, y: 0, z: -200,
                    rotationX: 0.2,
                    rotationY: Date.now() * 0.001,
                    rotationZ: 0,
                    fov: 400
                };
            }

            const drawMesh = (mesh, offsetY, color) => {
                const projectedFaces = [];
                const lightDir = { x: 0.5, y: -0.5, z: 1 };
                const len = Math.sqrt(lightDir.x * lightDir.x + lightDir.y * lightDir.y + lightDir.z * lightDir.z);
                lightDir.x /= len; lightDir.y /= len; lightDir.z /= len;

                mesh.faces.forEach(face => {
                    const v1 = mesh.vertices[face[0]];
                    const v2 = mesh.vertices[face[1]];
                    const v3 = mesh.vertices[face[2]];

                    // Transform & Project using standard world coordinates
                    const transform = (v) => {
                        return GreenhouseModels3DMath.project3DTo2D(v.x, v.y + offsetY, v.z, synapseCamera, { width: w, height: h, near: 10, far: 1000 });
                    };

                    const p1 = transform(v1);
                    const p2 = transform(v2);
                    const p3 = transform(v3);

                    if (p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
                        const depth = (p1.depth + p2.depth + p3.depth) / 3;

                        // Calculate Normal in World Space for consistent lighting
                        const worldV1 = { x: v1.x, y: v1.y + offsetY, z: v1.z };
                        const worldV2 = { x: v2.x, y: v2.y + offsetY, z: v2.z };
                        const worldV3 = { x: v3.x, y: v3.y + offsetY, z: v3.z };
                        const normal = GreenhouseModels3DMath.calculateFaceNormal(worldV1, worldV2, worldV3);

                        // Backface culling in view space (approximate)
                        if (p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y) + p1.x * (p2.y - p3.y) < 0) {
                            const diffuse = Math.max(0, normal.x * lightDir.x + normal.y * lightDir.y + normal.z * lightDir.z);
                            const specular = Math.pow(diffuse, 20);
                            projectedFaces.push({ p1, p2, p3, depth, diffuse, specular });
                        }
                    }
                });

                projectedFaces.sort((a, b) => b.depth - a.depth);

                projectedFaces.forEach(f => {
                    // Dynamic Color Parsing
                    let r = 150, g = 150, b = 150;
                    if (color.startsWith('#')) {
                        const hex = color.slice(1);
                        r = parseInt(hex.slice(0, 2), 16);
                        g = parseInt(hex.slice(2, 4), 16);
                        b = parseInt(hex.slice(4, 6), 16);
                    } else if (color.startsWith('rgb')) {
                        const match = color.match(/(\d+),\s*(\d+),\s*(\d+)/);
                        if (match) { r = parseInt(match[1]); g = parseInt(match[2]); b = parseInt(match[3]); }
                    }

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

            // Determine colors
            // Pre-synaptic matches signal weight (Gold/Silver)
            const connectionColor = connection.weight > 0 ? '#FFD700' : '#E0E0E0';
            // Post-synaptic is consistent Silver/Grey
            const postColor = '#C0C0C0';

            // Draw Pre-synaptic (Top) - Offset upwards to +/- 150 gap
            drawMesh(synapseMeshes.pre, -150, connectionColor);

            // Draw Synaptic Cleft (Blue rectangular box between synapses)
            this.drawSynapticCleft(ctx, x, y, w, h, synapseCamera);

            // Draw Axon Shaft (Extending Upwards)
            const drawShaft = (startY, endY, color) => {
                const pStart = GreenhouseModels3DMath.project3DTo2D(0, startY, 0, synapseCamera, { width: w, height: h, near: 10, far: 1000 });
                const pEnd = GreenhouseModels3DMath.project3DTo2D(0, endY, 0, synapseCamera, { width: w, height: h, near: 10, far: 1000 });

                if (pStart.scale > 0 && pEnd.scale > 0) {
                    const radius = 60 * ((pStart.scale + pEnd.scale) / 2); // Match neckRadius

                    // Create Gradient for 3D Pipe Effect
                    const grad = ctx.createLinearGradient(pStart.x + x - radius, pStart.y + y, pStart.x + x + radius, pStart.y + y);
                    const match = color.match(/#([a-fA-F0-9]{6})/);
                    let rgb = { r: 200, g: 200, b: 200 };
                    if (color === '#FFD700') rgb = { r: 255, g: 215, b: 0 };
                    else if (color === '#B0C4DE') rgb = { r: 176, g: 196, b: 222 };
                    else if (color === '#E0E0E0') rgb = { r: 224, g: 224, b: 224 };

                    const baseR = rgb.r, baseG = rgb.g, baseB = rgb.b;
                    grad.addColorStop(0, `rgb(${Math.floor(baseR * 0.4)}, ${Math.floor(baseG * 0.4)}, ${Math.floor(baseB * 0.4)})`); // Shadow
                    grad.addColorStop(0.3, color); // Main
                    grad.addColorStop(0.7, color); // Main
                    grad.addColorStop(1, `rgb(${Math.min(255, baseR + 50)}, ${Math.min(255, baseG + 50)}, ${Math.min(255, baseB + 50)})`); // Highlight

                    ctx.strokeStyle = grad;
                    ctx.lineWidth = radius * 2;
                    ctx.lineCap = 'round'; // Seamless connection
                    ctx.beginPath();
                    ctx.moveTo(pStart.x + x, pStart.y + y);
                    ctx.lineTo(pEnd.x + x, pEnd.y + y);
                    ctx.stroke();

                    // Specular Highlight
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.lineWidth = radius * 0.2;
                    ctx.beginPath();
                    ctx.moveTo(pStart.x + x - radius * 0.4, pStart.y + y);
                    ctx.lineTo(pEnd.x + x - radius * 0.4, pEnd.y + y);
                    ctx.stroke();
                }
            };

            // Draw Axon (Up) - Matches Pre Terminal Color, starts at neck (-150 offset - 90 neck = -240)
            drawShaft(-240, -1000, connectionColor);

            // Draw Post-synaptic (Bottom) - Offset upwards to +/- 150 gap
            drawMesh(synapseMeshes.post, 150, postColor);

            // Draw Dendrite (Down) - Matches Post Terminal Color, starts at neck (150 offset + 90 neck = 240)
            drawShaft(240, 1000, postColor);

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
                        y: (Math.random() * -60) - 100, // Inside top terminal (-180 to -90 range)
                        z: (Math.random() - 0.5) * 60
                    });
                }

                // Generate Mitochondria
                // Pre-synaptic
                connection.synapseDetails.mitochondria.push({ x: -20, y: -200, z: 10, rot: Math.random() });
                // Post-synaptic
                connection.synapseDetails.mitochondria.push({ x: 20, y: 200, z: -10, rot: Math.random() });
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

            // Draw Labels
            ctx.save();
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFD700'; // Gold for Pre

            // Project label positions
            const preLabelPos = GreenhouseModels3DMath.project3DTo2D(0, -280, 0, synapseCamera, { width: w, height: h, near: 10, far: 1000 });
            if (preLabelPos.scale > 0) {
                ctx.fillText("Pre-Synaptic Terminal", preLabelPos.x, preLabelPos.y);
            }

            ctx.fillStyle = '#87CEEB'; // SkyBlue for Post
            const postLabelPos = GreenhouseModels3DMath.project3DTo2D(0, 280, 0, synapseCamera, { width: w, height: h, near: 10, far: 1000 });
            if (postLabelPos.scale > 0) {
                ctx.fillText("Post-Synaptic Terminal", postLabelPos.x, postLabelPos.y);
            }

            ctx.fillStyle = '#FFFFFF';
            const cleftLabelPos = GreenhouseModels3DMath.project3DTo2D(50, 0, 0, synapseCamera, { width: w, height: h, near: 10, far: 1000 });
            if (cleftLabelPos.scale > 0) {
                ctx.fillText("Neurotransmitters", cleftLabelPos.x, cleftLabelPos.y);
            }
            ctx.restore();

            // Draw Vesicles (Phase 7: Vesicle Fusion)
            connection.synapseDetails.vesicles.forEach(v => {
                // Animate Vesicle moving towards cleft
                v.y += 0.5;
                if (v.y > -150) {
                    // Fusion Event!
                    // Reset vesicle to top terminal interior
                    v.y = -240 - Math.random() * 30;
                    v.x = (Math.random() - 0.5) * 50;
                    v.z = (Math.random() - 0.5) * 50;

                    // Release Neurotransmitters (Spawn Particles at pre-face)
                    for (let k = 0; k < 5; k++) {
                        connection.synapseDetails.particles.push({
                            x: v.x + (Math.random() - 0.5) * 5,
                            y: -150,
                            z: v.z + (Math.random() - 0.5) * 5,
                            life: 1.2,
                            hasBound: false
                        });
                    }
                }
                drawInternal(v, 'vesicle');
            });

            // Draw Mitochondria
            connection.synapseDetails.mitochondria.forEach(m => drawInternal(m, 'mito'));

            // Draw Neurotransmitters (Particles)
            // Phase 6: Liquid Cleft Dynamics (Brownian Motion)

            // Ensure some particles exist if none (background activity)
            if (connection.synapseDetails.particles.length < 5 && Math.random() < 0.05) {
                connection.synapseDetails.particles.push({
                    x: (Math.random() - 0.5) * 40,
                    y: -150,
                    z: (Math.random() - 0.5) * 40,
                    life: 1.2,
                    hasBound: false
                });
            }

            connection.synapseDetails.particles.forEach((p, i) => {
                // Brownian Motion + Viscous Drift
                p.x += (Math.random() - 0.5) * 1.5; // Random jitter X
                p.z += (Math.random() - 0.5) * 1.5; // Random jitter Z
                p.y += 1.8 + (Math.random() - 0.5) * 0.5; // Faster drift to reach post-synaptic terminal
                p.life -= 0.003; // Slower fade for longer transit visibility

                const proj = GreenhouseModels3DMath.project3DTo2D(p.x, p.y, p.z, synapseCamera, { width: w, height: h, near: 10, far: 1000 });
                if (proj.scale > 0 && p.life > 0) {
                    // Phase 7: Receptor Binding
                    if (p.y > 150 && !p.hasBound) {
                        p.hasBound = true;
                        p.life = 0.5; // Quick flash fade

                        // Binding Flash Effect
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                        ctx.beginPath();
                        ctx.arc(proj.x + x, proj.y + y, 8 * proj.scale, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    const alpha = p.life;
                    // Color change on binding (Yellow -> Green)
                    ctx.fillStyle = p.hasBound ? `rgba(50, 255, 50, ${alpha})` : `rgba(255, 255, 100, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(proj.x + x, proj.y + y, 3 * proj.scale, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Cleanup dead particles
            connection.synapseDetails.particles = connection.synapseDetails.particles.filter(p => p.life > 0);

            ctx.restore();
        },

        /**
         * Draw synaptic cleft - blue rectangular box between pre and post-synaptic terminals
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {number} x - X offset
         * @param {number} y - Y offset
         * @param {number} w - Width
         * @param {number} h - Height
         * @param {Object} synapseCamera - Camera object
         */
        drawSynapticCleft(ctx, x, y, w, h, synapseCamera) {
            // Cleft dimensions
            const cleftWidth = 160;
            const cleftHeight = 300; // Matches terminal gap (-150 to 150)
            const cleftDepth = 160;
            const cleftY = 0;

            // Define 8 vertices of the rectangular box
            const halfW = cleftWidth / 2;
            const halfH = cleftHeight / 2;
            const halfD = cleftDepth / 2;

            const vertices = [
                { x: -halfW, y: cleftY - halfH, z: -halfD }, // 0: back-bottom-left
                { x: halfW, y: cleftY - halfH, z: -halfD },  // 1: back-bottom-right
                { x: halfW, y: cleftY + halfH, z: -halfD },  // 2: back-top-right
                { x: -halfW, y: cleftY + halfH, z: -halfD }, // 3: back-top-left
                { x: -halfW, y: cleftY - halfH, z: halfD },  // 4: front-bottom-left
                { x: halfW, y: cleftY - halfH, z: halfD },   // 5: front-bottom-right
                { x: halfW, y: cleftY + halfH, z: halfD },   // 6: front-top-right
                { x: -halfW, y: cleftY + halfH, z: halfD }   // 7: front-top-left
            ];

            // Define 6 faces (each face is 2 triangles)
            const faces = [
                // Front face
                [[4, 5, 6], [4, 6, 7]],
                // Back face
                [[1, 0, 3], [1, 3, 2]],
                // Top face
                [[7, 6, 2], [7, 2, 3]],
                // Bottom face
                [[0, 1, 5], [0, 5, 4]],
                // Right face
                [[5, 1, 2], [5, 2, 6]],
                // Left face
                [[0, 4, 7], [0, 7, 3]]
            ];

            // Transform and project vertices using standard world space
            const projectedVertices = vertices.map(v => {
                return {
                    projected: GreenhouseModels3DMath.project3DTo2D(v.x, v.y, v.z, synapseCamera, { width: w, height: h, near: 10, far: 1000 }),
                    world: { x: v.x, y: v.y, z: v.z }
                };
            });

            // Draw each face
            const cleftColor = { r: 0, g: 136, b: 255 }; // Distinct Blue
            const alpha = 0.4; // More transparent for "liquid" look

            faces.forEach(face => {
                face.forEach(triangle => {
                    const v0 = projectedVertices[triangle[0]];
                    const v1 = projectedVertices[triangle[1]];
                    const v2 = projectedVertices[triangle[2]];

                    if (v0.projected.scale > 0 && v1.projected.scale > 0 && v2.projected.scale > 0) {
                        // Backface culling
                        const dx1 = v1.projected.x - v0.projected.x;
                        const dy1 = v1.projected.y - v0.projected.y;
                        const dx2 = v2.projected.x - v0.projected.x;
                        const dy2 = v2.projected.y - v0.projected.y;
                        const cross = dx1 * dy2 - dy1 * dx2;

                        if (cross > 0) {
                            // Calculate normal for lighting
                            const ux = v1.world.x - v0.world.x;
                            const uy = v1.world.y - v0.world.y;
                            const uz = v1.world.z - v0.world.z;
                            const vx = v2.world.x - v0.world.x;
                            const vy = v2.world.y - v0.world.y;
                            const vz = v2.world.z - v0.world.z;

                            let nx = uy * vz - uz * vy;
                            let ny = uz * vx - ux * vz;
                            let nz = ux * vy - uy * vx;
                            const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);

                            let intensity = 0.5;
                            if (nLen > 0) {
                                nx /= nLen; ny /= nLen; nz /= nLen;
                                const lightDir = { x: 0.5, y: -0.5, z: 1 };
                                const lLen = Math.sqrt(lightDir.x * lightDir.x + lightDir.y * lightDir.y + lightDir.z * lightDir.z);
                                const diffuse = Math.max(0, (nx * lightDir.x + ny * lightDir.y + nz * lightDir.z) / lLen);
                                intensity = 0.3 + diffuse * 0.7;
                            }

                            const litR = Math.min(255, cleftColor.r * intensity);
                            const litG = Math.min(255, cleftColor.g * intensity);
                            const litB = Math.min(255, cleftColor.b * intensity);

                            ctx.fillStyle = `rgba(${litR}, ${litG}, ${litB}, ${alpha})`;
                            ctx.beginPath();
                            ctx.moveTo(v0.projected.x + x, v0.projected.y + y);
                            ctx.lineTo(v1.projected.x + x, v1.projected.y + y);
                            ctx.lineTo(v2.projected.x + x, v2.projected.y + y);
                            ctx.closePath();
                            ctx.fill();

                            // Add subtle edge highlight
                            ctx.strokeStyle = `rgba(${Math.min(255, litR + 50)}, ${Math.min(255, litG + 50)}, ${Math.min(255, litB + 50)}, ${alpha * 0.5})`;
                            ctx.lineWidth = 0.5;
                            ctx.stroke();
                        }
                    }
                });
            });
        }
    };

    window.GreenhouseNeuroSynapse = GreenhouseNeuroSynapse;
})();
