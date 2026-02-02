(function () {
    'use strict';

    /**
     * GreenhouseCognitionBrain
     * Specialized 3D renderer for the Cognition model.
     * Includes support for realistic brain meshes with polymorphic face structures.
     */
    const GreenhouseCognitionBrain = {
        drawBrainShell(ctx, brainShell, camera, projection, width, height, activeItem = null, options = {}) {
            const targetRegion = activeItem ? activeItem.region : null;
            const glassBrain = options.glassBrain || false;
            if (!brainShell) return;

            const vertices = brainShell.vertices;
            const faces = brainShell.faces;
            const regions = brainShell.regions || {};

            // Light Source
            const lightDir = { x: 0.5, y: -0.5, z: 1 };
            const len = Math.sqrt(lightDir.x * lightDir.x + lightDir.y * lightDir.y + lightDir.z * lightDir.z);
            lightDir.x /= len; lightDir.y /= len; lightDir.z /= len;

            // Project all vertices first
            const projectedVertices = vertices.map(v => {
                // Using GreenhouseModels3DMath which should be globally available
                return GreenhouseModels3DMath.project3DTo2D(v.x, -v.y, v.z, camera, projection);
            });

            // Prepare Faces with Depth and Normals
            const facesToDraw = [];
            faces.forEach((face, index) => {
                // Support both {indices: [0,1,2]} and direct array [0,1,2]
                const indices = face.indices || (Array.isArray(face) ? face : null);
                if (!indices) return;

                const p1 = projectedVertices[indices[0]];
                const p2 = projectedVertices[indices[1]];
                const p3 = projectedVertices[indices[2]];

                // Safety check for projection results
                if (p1 && p2 && p3 && p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
                    // Backface Culling
                    const dx1 = p2.x - p1.x;
                    const dy1 = p2.y - p1.y;
                    const dx2 = p3.x - p1.x;
                    const dy2 = p3.y - p1.y;

                    if (dx1 * dy2 - dy1 * dx2 > 0) {
                        const depth = (p1.depth + p2.depth + p3.depth) / 3;

                        // Calculate Normal (World Space)
                        const v1 = vertices[indices[0]];
                        const v2 = vertices[indices[1]];
                        const v3 = vertices[indices[2]];

                        const ux = v2.x - v1.x;
                        const uy = v2.y - v1.y;
                        const uz = v2.z - v1.z;
                        const vx = v3.x - v1.x;
                        const vy = v3.y - v1.y;
                        const vz = v3.z - v1.z;

                        let nx = uy * vz - uz * vy;
                        let ny = uz * vx - ux * vz;
                        let nz = ux * vy - uy * vx;
                        const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);

                        if (nLen > 0) {
                            nx /= nLen; ny /= nLen; nz /= nLen;
                        }

                        facesToDraw.push({
                            face,
                            p1, p2, p3,
                            depth,
                            nx, ny, nz,
                            // Priority: face region > vertex region fallback
                            region: face.region || v1.region || v2.region || v3.region
                        });
                    }
                }
            });

            // Sort by Depth (Painter's Algorithm)
            facesToDraw.sort((a, b) => b.depth - a.depth);

            // Draw Faces
            facesToDraw.forEach(f => {
                // Lighting (Phong-like)
                const diffuse = Math.max(0, f.nx * lightDir.x + f.ny * lightDir.y + f.nz * lightDir.z);
                const specular = Math.pow(diffuse, 30);

                // Base Color
                let r = 100, g = 100, b = 100, a = glassBrain ? 0.03 : 0.1;
                if (f.region && regions[f.region]) {
                    const color = regions[f.region].color;
                    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
                    if (match) {
                        r = parseInt(match[1]);
                        g = parseInt(match[2]);
                        b = parseInt(match[3]);
                        a = parseFloat(match[4] || 1);
                    }
                }

                // Highlighting Active Region
                if (targetRegion && f.region === targetRegion) {
                    const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 400);
                    const fog = GreenhouseModels3DMath.applyDepthFog(pulse, f.depth);
                    ctx.fillStyle = `rgba(57, 255, 20, ${fog})`; // Neon green

                    // Additive Glow Effect
                    ctx.save();
                    ctx.globalCompositeOperation = 'lighter';
                    ctx.shadowBlur = 10 * pulse;
                    ctx.shadowColor = 'rgba(57, 255, 20, 0.8)';
                    ctx.beginPath();
                    ctx.moveTo(f.p1.x, f.p1.y);
                    ctx.lineTo(f.p2.x, f.p2.y);
                    ctx.lineTo(f.p3.x, f.p3.y);
                    ctx.fill();
                    ctx.restore();
                } else {
                    const ambient = 0.2;
                    const lightIntensity = ambient + diffuse * 0.8 + specular * 0.5;
                    const litR = Math.min(255, r * lightIntensity + specular * 255);
                    const litG = Math.min(255, g * lightIntensity + specular * 255);
                    const litB = Math.min(255, b * lightIntensity + specular * 255);
                    const fog = GreenhouseModels3DMath.applyDepthFog(a, f.depth);
                    ctx.fillStyle = `rgba(${litR}, ${litG}, ${litB}, ${fog})`;
                }

                ctx.beginPath();
                ctx.moveTo(f.p1.x, f.p1.y);
                ctx.lineTo(f.p2.x, f.p2.y);
                ctx.lineTo(f.p3.x, f.p3.y);
                ctx.fill();
            });

            // Topological Overlays
            this.drawSurfaceGrid(ctx, projectedVertices, brainShell, glassBrain);
            this.drawTopologicalBoundaries(ctx, projectedVertices, vertices, faces, brainShell, camera, projection);
        },

        /**
         * Identifies which region is at the given screen coordinates.
         */
        pickRegion(mouseX, mouseY, brainShell, camera, projection) {
            if (!brainShell) return null;

            const vertices = brainShell.vertices;
            const faces = brainShell.faces;

            const projectedVertices = vertices.map(v => {
                return GreenhouseModels3DMath.project3DTo2D(v.x, -v.y, v.z, camera, projection);
            });

            const hits = [];

            faces.forEach(face => {
                const indices = face.indices || (Array.isArray(face) ? face : null);
                if (!indices) return;

                const p1 = projectedVertices[indices[0]];
                const p2 = projectedVertices[indices[1]];
                const p3 = projectedVertices[indices[2]];

                if (p1 && p2 && p3 && p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
                    // Inside-triangle check
                    if (this.isPointInTriangle(mouseX, mouseY, p1, p2, p3)) {
                        // Backface culling for picking too
                        const dx1 = p2.x - p1.x;
                        const dy1 = p2.y - p1.y;
                        const dx2 = p3.x - p1.x;
                        const dy2 = p3.y - p1.y;

                        if (dx1 * dy2 - dy1 * dx2 > 0) {
                            const depth = (p1.depth + p2.depth + p3.depth) / 3;
                            hits.push({
                                region: face.region || vertices[indices[0]].region,
                                depth
                            });
                        }
                    }
                }
            });

            if (hits.length === 0) return null;
            hits.sort((a, b) => a.depth - b.depth);
            return hits[0].region;
        },

        isPointInTriangle(px, py, p1, p2, p3) {
            const area = 0.5 * (-p2.y * p3.x + p1.y * (-p2.x + p3.x) + p1.x * (p2.y - p3.y) + p2.x * p3.y);
            const s = 1 / (2 * area) * (p1.y * p3.x - p1.x * p3.y + (p3.y - p1.y) * px + (p1.x - p3.x) * py);
            const t = 1 / (2 * area) * (p1.x * p2.y - p1.y * p2.x + (p1.y - p2.y) * px + (p2.x - p1.x) * py);
            return s >= 0 && t >= 0 && (s + t) <= 1;
        },

        drawSurfaceGrid(ctx, projectedVertices, brainShell, glassBrain) {
            ctx.save();
            ctx.strokeStyle = glassBrain ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)';
            ctx.lineWidth = 0.3;
            ctx.beginPath();
            const latitudeBands = 40;
            const longitudeBands = 40;
            for (let lat = 0; lat <= latitudeBands; lat += 5) {
                for (let lon = 0; lon <= longitudeBands; lon++) {
                    const i = lat * (longitudeBands + 1) + lon;
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

            const radius = 200;
            brainShell.regionalPlanes.forEach(plane => {
                const axis = plane.axis;
                const threshold = plane.value * radius;

                faces.forEach(face => {
                    const indices = face.indices || (Array.isArray(face) ? face : null);
                    if (!indices) return;

                    const v1 = vertices[indices[0]];
                    const v2 = vertices[indices[1]];
                    const v3 = vertices[indices[2]];

                    const s1 = v1[axis] > threshold;
                    const s2 = v2[axis] > threshold;
                    const s3 = v3[axis] > threshold;

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
                                const proj = GreenhouseModels3DMath.project3DTo2D(inter.x, -inter.y, inter.z, camera, projection);
                                if (proj.scale > 0 && proj.depth < 0.8) {
                                    points.push(proj);
                                }
                            }
                        };
                        checkEdge(v1, v2);
                        checkEdge(v2, v3);
                        checkEdge(v3, v1);
                        if (points.length === 2) {
                            ctx.beginPath();
                            ctx.moveTo(points[0].x, points[0].y);
                            ctx.lineTo(points[1].x, points[1].y);
                            ctx.globalAlpha = 0.6 * GreenhouseModels3DMath.applyDepthFog(1, points[0].depth, 0.3, 0.8);
                            ctx.stroke();
                        }
                    }
                });
            });
            ctx.restore();
        },

        calculateCentroids(brainShell) {
            const centroids = {};
            const counts = {};
            if (!brainShell || !brainShell.vertices) return centroids;

            brainShell.vertices.forEach(v => {
                const r = v.region;
                if (!r) return;
                if (!centroids[r]) {
                    centroids[r] = { x: 0, y: 0, z: 0 };
                    counts[r] = 0;
                }
                centroids[r].x += v.x;
                centroids[r].y += v.y;
                centroids[r].z += v.z;
                counts[r]++;
            });

            for (const region in centroids) {
                centroids[region].x /= counts[region];
                centroids[region].y /= counts[region];
                centroids[region].z /= counts[region];
            }
            return centroids;
        },

        drawConnections(ctx, centroids, regions, camera, projection, color = '57, 255, 20') {
            ctx.save();
            ctx.strokeStyle = `rgba(${color}, 0.4)`;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 5]);

            for (let i = 0; i < regions.length; i++) {
                for (let j = i + 1; j < regions.length; j++) {
                    const from = centroids[regions[i]];
                    const to = centroids[regions[j]];
                    if (from && to) {
                        const p1 = GreenhouseModels3DMath.project3DTo2D(from.x, -from.y, from.z, camera, projection);
                        const p2 = GreenhouseModels3DMath.project3DTo2D(to.x, -to.y, to.z, camera, projection);
                        if (p1.scale > 0 && p2.scale > 0) {
                            ctx.beginPath();
                            ctx.moveTo(p1.x, p1.y);
                            ctx.lineTo(p2.x, p2.y);
                            ctx.stroke();

                            // Glowing endpoints
                            ctx.fillStyle = `rgba(${color}, 0.8)`;
                            ctx.beginPath();
                            ctx.arc(p1.x, p1.y, 2, 0, Math.PI * 2);
                            ctx.arc(p2.x, p2.y, 2, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                }
            }
            ctx.restore();
        },

        drawLabels(ctx, centroids, config, camera, projection) {
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            for (const regionId in centroids) {
                const center = centroids[regionId];
                const proj = GreenhouseModels3DMath.project3DTo2D(center.x, -center.y, center.z, camera, projection);

                // Only draw labels for the front half of the brain
                if (proj.scale > 0 && proj.depth < 0.6) {
                    const regionConfig = config.regions[regionId];
                    if (!regionConfig) continue;

                    const alpha = GreenhouseModels3DMath.applyDepthFog(0.7, proj.depth, 0.2, 0.6);
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.font = `bold ${Math.max(8, Math.floor(10 * proj.scale))}px Arial`;

                    // Shadow/Outline for readability
                    ctx.shadowBlur = 4;
                    ctx.shadowColor = 'black';
                    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
                    ctx.fillText(t(regionConfig.name).toUpperCase(), proj.x, proj.y);
                    ctx.shadowBlur = 0;

                    // Connector dot
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
                    ctx.beginPath();
                    ctx.arc(proj.x, proj.y, 1.5 * proj.scale, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();
        },

        drawPulses(ctx, pulses, camera, projection) {
            ctx.save();
            pulses.forEach(p => {
                const proj = GreenhouseModels3DMath.project3DTo2D(p.x, -p.y, p.z, camera, projection);
                if (proj.scale > 0) {
                    const size = (p.size || 3) * proj.scale;
                    const alpha = (p.alpha || 1.0) * GreenhouseModels3DMath.applyDepthFog(1, proj.depth);

                    // Core
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(proj.x, proj.y, size, 0, Math.PI * 2);
                    ctx.fill();

                    // Outer Glow
                    const grad = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, size * 4);
                    const color = p.color || '57, 255, 20';
                    grad.addColorStop(0, `rgba(${color}, ${alpha * 0.6})`);
                    grad.addColorStop(1, `rgba(${color}, 0)`);
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(proj.x, proj.y, size * 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            ctx.restore();
        }
    };

    window.GreenhouseCognitionBrain = GreenhouseCognitionBrain;
})();
