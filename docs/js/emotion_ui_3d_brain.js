(function () {
    'use strict';

    const GreenhouseEmotionBrain = {
        drawBrainShell(ctx, brainShell, camera, projection, width, height, activeROI = null) {
            const targetRegion = activeROI ? activeROI.region : null;
            if (!brainShell) return;

            const vertices = brainShell.vertices;
            const faces = brainShell.faces;
            const regions = brainShell.regions;

            // Light Source
            const lightDir = { x: 0.5, y: -0.5, z: 1 };
            const len = Math.sqrt(lightDir.x * lightDir.x + lightDir.y * lightDir.y + lightDir.z * lightDir.z);
            lightDir.x /= len; lightDir.y /= len; lightDir.z /= len;

            // Project all vertices first
            const projectedVertices = vertices.map(v => {
                return GreenhouseModels3DMath.project3DTo2D(v.x, -v.y, v.z, camera, projection);
            });

            // Prepare Faces with Depth and Normals
            const facesToDraw = [];
            faces.forEach((face, index) => {
                // Support both object and array formats for face indices
                const indices = face.indices || (Array.isArray(face) ? face : null);
                if (!indices) return;

                const p1 = projectedVertices[indices[0]];
                const p2 = projectedVertices[indices[1]];
                const p3 = projectedVertices[indices[2]];

                if (p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
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
                            region: face.region || v1.region
                        });
                    }
                }
            });

            // Sort by Depth (Painter's Algorithm)
            facesToDraw.sort((a, b) => b.depth - a.depth);

            // Draw Faces
            facesToDraw.forEach(f => {
                // Lighting (Phong)
                const diffuse = Math.max(0, f.nx * lightDir.x + f.ny * lightDir.y + f.nz * lightDir.z);
                const specular = Math.pow(diffuse, 30); // Sharp highlight

                // Base Color
                let r = 100, g = 100, b = 100, a = 0.1;
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

                // Multi-region highlighting support
                const isTarget = targetRegion && (f.region === targetRegion || (Array.isArray(targetRegion) && targetRegion.includes(f.region)));

                if (isTarget) {
                    const fog = GreenhouseModels3DMath.applyDepthFog(0.9, f.depth);
                    ctx.fillStyle = `rgba(57, 255, 20, ${fog})`; // Neon green for ROI with fog
                } else {
                    // Apply Lighting for all other regions
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

            // Surface details
            this.drawSurfaceGrid(ctx, projectedVertices, brainShell);
            this.drawTopologicalBoundaries(ctx, projectedVertices, vertices, faces, brainShell, camera, projection);
        },

        drawSurfaceGrid(ctx, projectedVertices, brainShell) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
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
                                const proj = GreenhouseModels3DMath.project3DTo2D(inter.x, inter.y, inter.z, camera, projection);
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
        }
    };

    window.GreenhouseEmotionBrain = GreenhouseEmotionBrain;
})();
