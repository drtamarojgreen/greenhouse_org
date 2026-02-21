// docs/js/neuro_ui_3d_synapse.js
// Molecular Synapse Visualization for Neuro GA - Optimized with Vertex Pre-projection

(function () {
    'use strict';

    const GreenhouseNeuroSynapse = {
        synapseCameraController: null,
        _vertexPool: [],
        _facePool: [],

        _getProjectedVertex(index) {
            if (!this._vertexPool[index]) {
                this._vertexPool[index] = { x: 0, y: 0, depth: 0, scale: 0 };
            }
            return this._vertexPool[index];
        },

        _getFaceObj(index) {
            if (!this._facePool[index]) {
                this._facePool[index] = { depth: 0, vertices: null, origVertices: null };
            }
            return this._facePool[index];
        },

        drawConnections(ctx, connections, neurons, camera, projection, width, height) {
            const now = Date.now();
            const lightDir = { x: 0.5, y: -0.5, z: 1 };
            const len = Math.sqrt(lightDir.x * lightDir.x + lightDir.y * lightDir.y + lightDir.z * lightDir.z);
            lightDir.x /= len; lightDir.y /= len; lightDir.z /= len;

            // Optimization: Pre-project all neuron positions once
            const nodeProjMap = new Map();
            for (let i = 0; i < neurons.length; i++) {
                const n = neurons[i];
                nodeProjMap.set(n.id, GreenhouseModels3DMath.project3DTo2D(n.x, n.y, n.z, camera, projection));
            }

            const batches = {};

            for (let cIdx = 0; cIdx < connections.length; cIdx++) {
                const conn = connections[cIdx];
                if (!conn.mesh) continue;

                const p1 = nodeProjMap.get(conn.from.id);
                const p2 = nodeProjMap.get(conn.to.id);

                if (!p1 || !p2 || (p1.scale <= 0 && p2.scale <= 0)) return;

                const avgScale = (Math.max(0, p1.scale) + Math.max(0, p2.scale)) / 2;

                if (avgScale < 0.5) {
                    const alphaRaw = GreenhouseModels3DMath.applyDepthFog(0.5, (p1.depth + p2.depth) / 2);
                    const alpha = Math.round(alphaRaw * 10) / 10;
                    if (alpha <= 0) continue;

                    const colorType = conn.weight > 0 ? 'gold' : 'silver';
                    const key = `${colorType}_${alpha}`;

                    if (!batches[key]) batches[key] = new Path2D();
                    batches[key].moveTo(p1.x, p1.y);
                    batches[key].lineTo(p2.x, p2.y);
                    continue;
                }

                // Optimization: Pre-project mesh vertices (using pooling)
                const meshVertices = conn.mesh.vertices;
                const projected = [];
                for (let i = 0; i < meshVertices.length; i++) {
                    const v = meshVertices[i];
                    const p = GreenhouseModels3DMath.project3DTo2D(v.x, v.y, v.z, camera, projection);
                    const poolV = this._getProjectedVertex(i);
                    poolV.x = p.x; poolV.y = p.y; poolV.depth = p.depth; poolV.scale = p.scale;
                    projected.push(poolV);
                }

                const facesWithDepth = [];
                let faceCount = 0;
                const meshFaces = conn.mesh.faces;
                for (let i = 0; i < meshFaces.length; i++) {
                    const face = meshFaces[i];
                    const v1 = projected[face[0]];
                    const v2 = projected[face[1]];
                    const v3 = projected[face[2]];

                    if (v1.scale > 0 && v2.scale > 0 && v3.scale > 0) {
                        const fObj = this._getFaceObj(faceCount++);
                        fObj.depth = (v1.depth + v2.depth + v3.depth) / 3;
                        fObj.vertices = [v1, v2, v3];
                        fObj.origVertices = [meshVertices[face[0]], meshVertices[face[1]], meshVertices[face[2]]];
                        facesWithDepth.push(fObj);
                    }
                }
                facesWithDepth.sort((a, b) => b.depth - a.depth);

                const alpha = GreenhouseModels3DMath.applyDepthFog(0.8, facesWithDepth[0]?.depth || 1);
                const colorBatches = {};

                for (let i = 0; i < facesWithDepth.length; i++) {
                    const { vertices, origVertices } = facesWithDepth[i];
                    const [v1, v2, v3] = vertices;
                    const [ov1, ov2, ov3] = origVertices;

                    const dx1 = v2.x - v1.x;
                    const dy1 = v2.y - v1.y;
                    const dx2 = v3.x - v1.x;
                    const dy2 = v3.y - v1.y;
                    const cross = dx1 * dy2 - dy1 * dx2;

                    if (cross > 0) {
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

                        // Quantize intensity for batching (10 levels)
                        const qInt = Math.round(intensity * 10) / 10;
                        const baseColor = conn.weight > 0 ? { r: 255, g: 215, b: 0 } : { r: 176, g: 196, b: 222 };
                        const litR = Math.floor(Math.min(255, baseColor.r * qInt));
                        const litG = Math.floor(Math.min(255, baseColor.g * qInt));
                        const litB = Math.floor(Math.min(255, baseColor.b * qInt));
                        const colorKey = `rgba(${litR}, ${litG}, ${litB}, ${alpha})`;

                        if (!colorBatches[colorKey]) colorBatches[colorKey] = new Path2D();
                        colorBatches[colorKey].moveTo(v1.x, v1.y);
                        colorBatches[colorKey].lineTo(v2.x, v2.y);
                        colorBatches[colorKey].lineTo(v3.x, v3.y);
                        colorBatches[colorKey].closePath();
                    }
                }

                for (const color in colorBatches) {
                    ctx.fillStyle = color;
                    ctx.fill(colorBatches[color]);
                }

                const seed = (conn.from.id + conn.to.id) * 0.1;
                const cycle = (now * 0.001 + seed) % 2.0;

                if (cycle < 1.0) {
                    const t = cycle;
                    const mt = 1 - t;

                    const adhdActive = window.GreenhouseNeuroApp?.ga?.adhdConfig?.activeEnhancements || new Set();

                    const sparkP = {
                        x: mt * mt * conn.from.x + 2 * mt * t * conn.controlPoint.x + t * t * conn.to.x,
                        y: mt * mt * conn.from.y + 2 * mt * t * conn.controlPoint.y + t * t * conn.to.y,
                        z: mt * mt * conn.from.z + 2 * mt * t * conn.controlPoint.z + t * t * conn.to.z
                    };

                    const sparkProj = GreenhouseModels3DMath.project3DTo2D(sparkP.x, sparkP.y, sparkP.z, camera, projection);

                    if (sparkProj.scale > 0) {
                        const size = 4 * sparkProj.scale;
                        const alpha = GreenhouseModels3DMath.applyDepthFog(1, sparkProj.depth);

                        ctx.save();
                        ctx.globalAlpha = alpha;

                        ctx.fillStyle = '#FFF';
                        ctx.beginPath();
                        ctx.arc(sparkProj.x, sparkProj.y, size * 0.5, 0, Math.PI * 2);
                        ctx.fill();

                        const grad = ctx.createRadialGradient(sparkProj.x, sparkProj.y, size * 0.5, sparkProj.x, sparkProj.y, size * 2);

                        let glowColor = '255, 255, 100';
                        if (adhdActive.has(16) && conn.weight < 0) {
                            glowColor = '255, 50, 50';
                        }

                        grad.addColorStop(0, `rgba(${glowColor}, 0.8)`);
                        grad.addColorStop(1, `rgba(${glowColor}, 0)`);
                        ctx.fillStyle = grad;
                        ctx.beginPath();
                        ctx.arc(sparkProj.x, sparkProj.y, size * 2, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.restore();
                    }
                }
            }

            ctx.lineWidth = 1;
            for (const key in batches) {
                const [colorType, alpha] = key.split('_');
                const color = colorType === 'gold' ? `rgba(255, 215, 0, ${alpha})` : `rgba(176, 196, 222, ${alpha})`;
                ctx.strokeStyle = color;
                ctx.stroke(batches[key]);
            }
        },

        drawSynapsePiP(ctx, x, y, w, h, connection, synapseMeshes, isMainView = false, externalCamera = null) {
            const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
            const adhdActive = window.GreenhouseNeuroApp?.ga?.adhdConfig?.activeEnhancements || new Set();
            const adhdConfig = window.GreenhouseNeuroApp?.ga?.adhdConfig;

            // ADHD: Attentional Blink (1)
            if (adhdActive.has(1) && adhdConfig?.blinkCooldown > 0) {
                if (!isMainView) {
                    ctx.fillStyle = 'rgba(0,0,0,0.5)';
                    ctx.fillRect(x, y, w, h);
                }
                return;
            }

            if (!this.synapseCameraController && window.NeuroSynapseCameraController) {
                this.synapseCameraController = new window.NeuroSynapseCameraController();
            }

            if (!isMainView) {
                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.strokeStyle = '#4ca1af';
                ctx.lineWidth = 2;
                ctx.fillRect(x, y, w, h);
                ctx.strokeRect(x, y, w, h);
                ctx.beginPath();
                ctx.rect(x, y, w, h);
                ctx.clip();
                ctx.fillStyle = '#4ca1af';
                ctx.font = '800 10px Quicksand, sans-serif';
                ctx.textBaseline = 'top';
                ctx.fillText(t('synapse_view_title').toUpperCase(), x + 15, y + 15);
            } else {
                ctx.save();
            }

            if (!connection || !synapseMeshes) {
                ctx.fillStyle = '#666';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = '14px Quicksand, sans-serif';
                ctx.fillText(t('no_connection_selected'), x + w / 2, y + h / 2);
                ctx.restore();
                return;
            }

            let synapseCamera;
            if (externalCamera) {
                synapseCamera = externalCamera;
            } else if (this.synapseCameraController) {
                this.synapseCameraController.update();
                synapseCamera = this.synapseCameraController.getCamera();
            } else {
                synapseCamera = { x: 0, y: 0, z: -200, rotationX: 0.2, rotationY: Date.now() * 0.0003, rotationZ: 0, fov: 400 };
            }

            // ADHD: Hyperfocus Tunneling (20)
            if (adhdActive.has(20)) {
                synapseCamera.fov = 800; // Zoom in
            }

            const drawMesh = (mesh, offsetY, color) => {
                const projectedFaces = [];
                const lightDir = { x: 0.5, y: -0.5, z: 1 };
                const len = Math.sqrt(lightDir.x * lightDir.x + lightDir.y * lightDir.y + lightDir.z * lightDir.z);
                lightDir.x /= len; lightDir.y /= len; lightDir.z /= len;

                // Optimization: Pre-project all vertices once per mesh (using pooling)
                const meshVertices = mesh.vertices;
                const projectedVertices = [];
                for (let i = 0; i < meshVertices.length; i++) {
                    const v = meshVertices[i];
                    const p = GreenhouseModels3DMath.project3DTo2D(v.x, v.y + offsetY, v.z, synapseCamera, { width: w, height: h, near: 10, far: 1000 });
                    const poolV = this._getProjectedVertex(i + 1000); // Offset pool for PIP
                    poolV.x = p.x; poolV.y = p.y; poolV.depth = p.depth; poolV.scale = p.scale;
                    projectedVertices.push(poolV);
                }

                for (let i = 0; i < mesh.faces.length; i++) {
                    const face = mesh.faces[i];
                    const p1 = projectedVertices[face[0]];
                    const p2 = projectedVertices[face[1]];
                    const p3 = projectedVertices[face[2]];

                    if (p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
                        const v1 = mesh.vertices[face[0]];
                        const v2 = mesh.vertices[face[1]];
                        const v3 = mesh.vertices[face[2]];

                        const depth = (p1.depth + p2.depth + p3.depth) / 3;
                        const worldV1 = { x: v1.x, y: v1.y + offsetY, z: v1.z };
                        const worldV2 = { x: v2.x, y: v2.y + offsetY, z: v2.z };
                        const worldV3 = { x: v3.x, y: v3.y + offsetY, z: v3.z };
                        const normal = GreenhouseModels3DMath.calculateFaceNormal(worldV1, worldV2, worldV3);

                        // Backface culling
                        if (p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y) + p1.x * (p2.y - p3.y) > 0) {
                            const diffuse = Math.max(0, normal.x * lightDir.x + normal.y * lightDir.y + normal.z * lightDir.z);
                            const specular = Math.pow(diffuse, 20);
                            projectedFaces.push({ p1, p2, p3, depth, diffuse, specular });
                        }
                    }
                }

                projectedFaces.sort((a, b) => b.depth - a.depth);

                for (let i = 0; i < projectedFaces.length; i++) {
                    const f = projectedFaces[i];
                    let r = 150, g = 150, b = 150;
                    if (color.startsWith('#')) {
                        const hex = color.slice(1);
                        r = parseInt(hex.slice(0, 2), 16);
                        g = parseInt(hex.slice(2, 4), 16);
                        b = parseInt(hex.slice(4, 6), 16);
                    }
                    const ambient = 0.3;
                    const intensity = ambient + f.diffuse * 0.7 + f.specular * 0.6;
                    ctx.fillStyle = `rgb(${Math.min(255, r * intensity)}, ${Math.min(255, g * intensity)}, ${Math.min(255, b * intensity)})`;
                    ctx.beginPath();
                    ctx.moveTo(f.p1.x + x, f.p1.y + y);
                    ctx.lineTo(f.p2.x + x, f.p2.y + y);
                    ctx.lineTo(f.p3.x + x, f.p3.y + y);
                    ctx.fill();
                }
            };

            let connectionColor = connection.weight > 0 ? '#FFD700' : '#E0E0E0';
            const postColor = '#C0C0C0';

            // ADHD: Nutritional Deficiency (81) / Lead Toxicity (79) / Hypoxia (86)
            if (adhdActive.has(79)) connectionColor = '#777';

            // ADHD: Motor Restlessness (14) / Jitters (47)
            let terminalJitter = (adhdActive.has(14) || adhdActive.has(47)) ? (Math.random() - 0.5) * 5 : 0;

            // ADHD: PFC Thinning (72) / HPA Axis (96)
            let terminalScale = 1.0;
            if (adhdActive.has(72) || adhdActive.has(96)) terminalScale = 0.7;

            ctx.save();
            ctx.scale(terminalScale, terminalScale);

            drawMesh(synapseMeshes.pre, -150 + terminalJitter, connectionColor);
            this.drawSynapticCleft(ctx, x, y, w, h, synapseCamera);
            drawMesh(synapseMeshes.post, 150, postColor);

            // Alzheimer's: Amyloid Plaque Accumulation (103)
            if (adhdActive.has(103)) {
                this.drawAmyloidPlaques(ctx, x, y, w, h, synapseCamera);
            }

            // ADHD: TBI (88) - Cracks
            if (adhdActive.has(88)) {
                ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x + w/2 - 20, y + h/2 - 20); ctx.lineTo(x + w/2 + 20, y + h/2 + 20);
                ctx.stroke();
            }

            if (!connection.synapseDetails) {
                connection.synapseDetails = { vesicles: [], mitochondria: [], particles: [] };
                for (let i = 0; i < 30; i++) {
                    connection.synapseDetails.vesicles.push({
                        x: (Math.random() - 0.5) * 60,
                        y: (Math.random() * -60) - 100,
                        z: (Math.random() - 0.5) * 60
                    });
                }
                connection.synapseDetails.mitochondria.push({ x: -20, y: -200, z: 10, rot: Math.random() });
                connection.synapseDetails.mitochondria.push({ x: 20, y: 200, z: -10, rot: Math.random() });
            }

            const drawInternal = (obj, type) => {
                const p = GreenhouseModels3DMath.project3DTo2D(obj.x, obj.y + (type === 'post' ? 60 : -60), obj.z, synapseCamera, { width: w, height: h, near: 10, far: 1000 });
                if (p.scale > 0) {
                    if (type === 'vesicle') {
                        // ADHD: Dietary Omega-3 Fluidity (37)
                        const glow = adhdActive.has(37) ? 'rgba(200, 255, 255, 0.8)' : 'rgba(255, 255, 200, 0.6)';
                        ctx.fillStyle = glow;
                        ctx.beginPath();
                        ctx.arc(p.x + x, p.y + y, 3 * p.scale, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (type === 'mito') {
                        // ADHD: Exercise-Induced BDNF (36)
                        if (adhdActive.has(36)) {
                            ctx.shadowBlur = 10;
                            ctx.shadowColor = 'lime';
                        }
                        const size = 8 * p.scale;
                        ctx.save();
                        ctx.translate(p.x + x, p.y + y);
                        ctx.rotate(obj.rot);
                        ctx.fillStyle = 'rgba(100, 200, 100, 0.5)';
                        ctx.beginPath();
                        ctx.ellipse(0, 0, size * 2, size, 0, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                        ctx.shadowBlur = 0;
                    }
                }
            };

            connection.synapseDetails.vesicles.forEach(v => {
                // ADHD: Hyperactive Firing (3) / Procrastination (22) / Amphetamine (28) / LC Instability (74)
                let vSpeed = 0.5;
                if (adhdActive.has(3)) vSpeed = 1.2;
                if (adhdActive.has(28)) vSpeed = 1.5;
                if (adhdActive.has(22)) vSpeed = 0.1;
                if (adhdActive.has(74)) vSpeed *= (0.5 + Math.random());

                // ADHD: Epigenetic Methylation (84) - Locked vesicles
                if (adhdActive.has(84) && Math.random() < 0.1) vSpeed = 0;

                v.y += vSpeed;

                if (v.y > -150) {
                    v.y = -240 - Math.random() * 30;
                    // ADHD: Working Memory Overflow (9)
                    const count = adhdActive.has(9) && Math.random() < 0.5 ? 1 : 5;
                    for (let k = 0; k < count; k++) {
                        connection.synapseDetails.particles.push({
                            x: v.x + (Math.random() - 0.5) * 5,
                            y: -150, z: v.z + (Math.random() - 0.5) * 5,
                            life: 1.2, hasBound: false,
                            age: 0
                        });
                    }
                }
                drawInternal(v, 'vesicle');
            });

            connection.synapseDetails.mitochondria.forEach(m => drawInternal(m, 'mito'));

            // ADHD: SNR (2) - Add static noise particles
            if (adhdActive.has(2) && Math.random() < 0.2) {
                connection.synapseDetails.particles.push({
                    x: (Math.random() - 0.5) * 100,
                    y: (Math.random() - 0.5) * 100,
                    z: (Math.random() - 0.5) * 100,
                    life: 0.5, hasBound: false, isNoise: true
                });
            }

            connection.synapseDetails.particles.forEach((p, i) => {
                p.age = (p.age || 0) + 1;
                let stability = adhdActive.has(30) ? 0.3 : 1.0;
                if (adhdActive.has(8)) stability *= 2.5; // Interference (8)
                if (adhdActive.has(61)) stability *= 3.0; // Thalamic (61)

                p.x += (Math.random() - 0.5) * 1.5 * stability;
                p.z += (Math.random() - 0.5) * 1.5 * stability;

                let driftY = 1.8;
                let fadeRate = 0.003;
                if (adhdActive.has(12)) driftY *= (0.5 + Math.sin(Date.now() * 0.01)); // Time (12)
                if (adhdActive.has(51)) fadeRate *= 2.0;
                if (adhdActive.has(23)) fadeRate *= 3.0; // Forgetfulness (23)
                if (adhdActive.has(26)) fadeRate *= 0.5;
                if (adhdActive.has(66)) fadeRate *= 0.3; // Astrocyte (66)

                // ADHD: COMT (69) / MAO-A (70)
                if (adhdActive.has(69)) fadeRate *= (adhdConfig?.comtRate || 2.0);
                if (adhdActive.has(70)) fadeRate *= (adhdConfig?.maoActivity || 2.5);

                // ADHD: Social Support (41) - Longer life
                if (adhdActive.has(41)) fadeRate *= 0.8;

                const globalSlow = adhdActive.has(19) ? 0.5 : 1.0; // Fatigue (19)
                p.y += driftY * globalSlow;

                // ADHD: DMN Intrusion (58) - Ghost drift
                if (adhdActive.has(58) && Math.random() < 0.05) p.y -= 5.0;

                p.life -= fadeRate * globalSlow;

                const proj = GreenhouseModels3DMath.project3DTo2D(p.x, p.y, p.z, synapseCamera, { width: w, height: h, near: 10, far: 1000 });
                if (proj.scale > 0 && p.life > 0) {
                    let bindingThreshold = 150;
                    if (adhdActive.has(77)) bindingThreshold = 180;
                    if (p.y > bindingThreshold && !p.hasBound) {
                        p.hasBound = true;
                        p.life = 0.5;
                        // ADHD: Reward Delay Discounting (5)
                        const flashAlpha = adhdActive.has(5) ? Math.max(0.1, 1 - p.age/200) : 0.9;
                        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
                        ctx.beginPath();
                        ctx.arc(proj.x + x, proj.y + y, 8 * proj.scale, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    const alpha = p.life;
                    let particleColor = p.hasBound ? `rgba(50, 255, 50, ${alpha})` : `rgba(255, 255, 100, ${alpha})`;

                    // ADHD: Amygdala (73) / Imbalance (55)
                    if (p.hasBound && adhdActive.has(73)) particleColor = `rgba(255, 0, 0, ${alpha})`;
                    if (p.hasBound && adhdActive.has(55)) particleColor = `rgba(255, 0, 255, ${alpha})`;

                    if (adhdActive.has(11) && !p.hasBound) { // Emotional (11)
                        particleColor = `hsla(${(Date.now() * 0.1) % 360}, 100%, 70%, ${alpha})`;
                    }
                    if (p.isNoise) particleColor = `rgba(200, 200, 200, ${alpha})`;

                    // ADHD: Lead Toxicity (79)
                    if (adhdActive.has(79)) particleColor = `rgba(100, 100, 100, ${alpha})`;

                    let pSize = 3;
                    if (adhdActive.has(21)) pSize = 1 + Math.random() * 5; // Disorganization (21)
                    if (adhdActive.has(71)) pSize = 1.5; // VMAT2 (71)
                    if (adhdActive.has(94)) pSize *= (0.5 + Math.random()); // Gut-Brain (94)

                    ctx.fillStyle = particleColor;
                    ctx.beginPath();
                    ctx.arc(proj.x + x, proj.y + y, pSize * proj.scale, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            connection.synapseDetails.particles = connection.synapseDetails.particles.filter(p => p.life > 0);

            // Labels
            ctx.font = 'bold 12px Quicksand, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            // 1. Pre-Synaptic Terminal (Top)
            const preLabelPos = GreenhouseModels3DMath.project3DTo2D(0, -180, 0, synapseCamera, { width: w, height: h, near: 10, far: 1000 });
            if (preLabelPos.scale > 0) {
                ctx.fillStyle = '#FFD700';
                // ADHD: EF Gating (10)
                if (adhdActive.has(10) && Math.random() < 0.1) {
                    ctx.fillStyle = 'red';
                    ctx.fillText(t('gating_failure').toUpperCase(), preLabelPos.x + x, preLabelPos.y + y - 20);
                }
                ctx.fillText(t('pre_synaptic_terminal').toUpperCase(), preLabelPos.x + x, preLabelPos.y + y);
            }

            // 2. Synaptic Cleft (Middle)
            const cleftLabelPos = GreenhouseModels3DMath.project3DTo2D(0, 0, 0, synapseCamera, { width: w, height: h, near: 10, far: 1000 });
            if (cleftLabelPos.scale > 0) {
                ctx.fillStyle = 'rgba(0, 136, 255, 0.9)';
                ctx.fillText(t('synaptic_cleft').toUpperCase(), cleftLabelPos.x + x, cleftLabelPos.y + y);
            }

            // 3. Post-Synaptic Density (Bottom)
            const postLabelPos = GreenhouseModels3DMath.project3DTo2D(0, 180, 0, synapseCamera, { width: w, height: h, near: 10, far: 1000 });
            if (postLabelPos.scale > 0) {
                ctx.fillStyle = '#C0C0C0';
                ctx.fillText(t('post_synaptic_density').toUpperCase(), postLabelPos.x + x, postLabelPos.y + y);
            }

            ctx.restore();
        },

        drawAmyloidPlaques(ctx, x, y, w, h, synapseCamera) {
            const plaqueCount = 5;
            ctx.fillStyle = 'rgba(200, 180, 150, 0.7)';
            for (let i = 0; i < plaqueCount; i++) {
                const px = Math.sin(i + Date.now() * 0.001) * 40;
                const py = (i - 2) * 40;
                const pz = Math.cos(i) * 40;
                const proj = GreenhouseModels3DMath.project3DTo2D(px, py, pz, synapseCamera, { width: w, height: h, near: 10, far: 1000 });
                if (proj.scale > 0) {
                    ctx.beginPath();
                    ctx.arc(proj.x + x, proj.y + y, 15 * proj.scale, 0, Math.PI * 2);
                    ctx.fill();
                    // Plaque texture
                    ctx.strokeStyle = 'rgba(100, 80, 50, 0.4)';
                    ctx.beginPath();
                    ctx.moveTo(proj.x + x - 5, proj.y + y);
                    ctx.lineTo(proj.x + x + 5, proj.y + y);
                    ctx.stroke();
                }
            }
        },

        drawSynapticCleft(ctx, x, y, w, h, synapseCamera) {
            const adhdActive = window.GreenhouseNeuroApp?.ga?.adhdConfig?.activeEnhancements || new Set();

            // ADHD: Alpha-2 (31)
            if (adhdActive.has(31)) {
                const gatePos = GreenhouseModels3DMath.project3DTo2D(0, -150, 0, synapseCamera, { width: w, height: h, near: 10, far: 1000 });
                if (gatePos.scale > 0) {
                    ctx.save();
                    ctx.strokeStyle = 'cyan';
                    ctx.lineWidth = 4 * gatePos.scale;
                    ctx.beginPath();
                    ctx.arc(gatePos.x + x, gatePos.y + y, 80 * gatePos.scale, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            }

            // ADHD: Vigilance (13)
            let cleftAlpha = 0.4;
            if (adhdActive.has(13)) cleftAlpha *= (0.5 + 0.5 * Math.sin(Date.now() * 0.002));

            const cleftWidth = 160, cleftHeight = 300, cleftDepth = 160;
            const halfW = cleftWidth / 2, halfH = cleftHeight / 2, halfD = cleftDepth / 2;

            const vertices = [
                { x: -halfW, y: -halfH, z: -halfD }, { x: halfW, y: -halfH, z: -halfD },
                { x: halfW, y: halfH, z: -halfD }, { x: -halfW, y: halfH, z: -halfD },
                { x: -halfW, y: -halfH, z: halfD }, { x: halfW, y: -halfH, z: halfD },
                { x: halfW, y: halfH, z: halfD }, { x: -halfW, y: halfH, z: halfD }
            ];

            const faces = [
                [[4, 5, 6], [4, 6, 7]], [[1, 0, 3], [1, 3, 2]], [[7, 6, 2], [7, 2, 3]],
                [[0, 1, 5], [0, 5, 4]], [[5, 1, 2], [5, 2, 6]], [[0, 4, 7], [0, 7, 3]]
            ];

            const projected = vertices.map(v => ({
                proj: GreenhouseModels3DMath.project3DTo2D(v.x, v.y, v.z, synapseCamera, { width: w, height: h, near: 10, far: 1000 }),
                world: v
            }));

            faces.forEach(face => {
                face.forEach(tri => {
                    const v0 = projected[tri[0]], v1 = projected[tri[1]], v2 = projected[tri[2]];
                    if (v0.proj.scale > 0 && v1.proj.scale > 0 && v2.proj.scale > 0) {
                        if ((v1.proj.x - v0.proj.x) * (v2.proj.y - v0.proj.y) - (v1.proj.y - v0.proj.y) * (v2.proj.x - v0.proj.x) > 0) {
                            ctx.fillStyle = `rgba(0, 136, 255, ${cleftAlpha})`;
                            ctx.beginPath();
                            ctx.moveTo(v0.proj.x + x, v0.proj.y + y);
                            ctx.lineTo(v1.proj.x + x, v1.proj.y + y);
                            ctx.lineTo(v2.proj.x + x, v2.proj.y + y);
                            ctx.fill();
                        }
                    }
                });
            });
        },

        checkSynapseHover(x, y, w, h, synapseCamera, adhdActive) {
            const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
            const data = window.GreenhouseADHDData;
            if (!data) return null;

            // Collision check using projected areas of pre-terminal, cleft, and post-terminal
            const prePos = GreenhouseModels3DMath.project3DTo2D(0, -150, 0, synapseCamera, { width: w, height: h, near: 10, far: 1000 });
            const postPos = GreenhouseModels3DMath.project3DTo2D(0, 150, 0, synapseCamera, { width: w, height: h, near: 10, far: 1000 });
            const cleftPos = GreenhouseModels3DMath.project3DTo2D(0, 0, 0, synapseCamera, { width: w, height: h, near: 10, far: 1000 });

            // Pre-Terminal (-200 range)
            const preDist = prePos.scale > 0 ? Math.sqrt(Math.pow(prePos.x - x, 2) + Math.pow(prePos.y - y, 2)) : Infinity;
            if (preDist < 100 * prePos.scale) {
                const ids = [3, 9, 10, 14, 22, 28, 57, 72, 74, 84, 88, 96, 99];
                const active = ids.filter(id => adhdActive.has(id));
                if (active.length > 0) {
                    const e = data.getEnhancementById(active[0]);
                    return `<strong>${t('adhd_enh_' + e.id + '_name')} (Axon Terminal)</strong><br>${t('adhd_enh_' + e.id + '_desc')}<br><em>Synaptic Dynamic: Altered vesicle docking and release mechanics.</em>`;
                }
            }

            // Synaptic Cleft (0 range)
            const cleftDist = cleftPos.scale > 0 ? Math.sqrt(Math.pow(cleftPos.x - x, 2) + Math.pow(cleftPos.y - y, 2)) : Infinity;
            if (cleftDist < 120 * cleftPos.scale) {
                const ids = [1, 2, 8, 11, 12, 13, 18, 23, 26, 30, 31, 34, 41, 51, 61, 65, 66, 69, 70, 79, 82, 85, 87];
                const active = ids.filter(id => adhdActive.has(id));
                if (active.length > 0) {
                    const e = data.getEnhancementById(active[0]);
                    return `<strong>${t('adhd_enh_' + e.id + '_name')} (Synaptic Cleft)</strong><br>${t('adhd_enh_' + e.id + '_desc')}<br><em>Synaptic Dynamic: Modulation of neurotransmitter flux and degradation.</em>`;
                }
            }

            // Post-Terminal (200 range)
            const postDist = postPos.scale > 0 ? Math.sqrt(Math.pow(postPos.x - x, 2) + Math.pow(postPos.y - y, 2)) : Infinity;
            if (postDist < 100 * postPos.scale) {
                const ids = [5, 29, 32, 55, 68, 73, 77];
                const active = ids.filter(id => adhdActive.has(id));
                if (active.length > 0) {
                    const e = data.getEnhancementById(active[0]);
                    return `<strong>${t('adhd_enh_' + e.id + '_name')} (Dendritic Spine)</strong><br>${t('adhd_enh_' + e.id + '_desc')}<br><em>Synaptic Dynamic: Receptor sensitivity and signal transduction changes.</em>`;
                }
            }

            return null;
        }
    };

    window.GreenhouseNeuroSynapse = GreenhouseNeuroSynapse;
})();
