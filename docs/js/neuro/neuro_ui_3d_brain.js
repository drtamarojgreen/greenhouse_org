// docs/js/neuro/neuro_ui_3d_brain.js
// Enhanced 3D Brain Rendering Engine with Post-processing and advanced Shading

(function () {
    'use strict';

    const GreenhouseNeuroBrain = {
        _vertexPool: [],
        _facePool: [],
        _precomputedBoundaries: null,
        _frameBuffer: null,
        _prevFrameBuffer: null,

        drawBrainShell(ctx, brainShell, camera, projection, width, height, activeGene = null) {
            const targetRegion = activeGene ? activeGene.region : null;
            if (!brainShell) return;

            // Project all vertices
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
                const p1 = projectedVertices[indices[0]];
                const p2 = projectedVertices[indices[1]];
                const p3 = projectedVertices[indices[2]];

                if (p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
                    // Backface Culling
                    const cross = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
                    if (cross < 0) {
                        const v1 = brainShell.vertices[indices[0]];
                        const v2 = brainShell.vertices[indices[1]];
                        const v3 = brainShell.vertices[indices[2]];
                        const normal = GreenhouseModels3DMath.calculateFaceNormal(v1, v2, v3);
                        const depth = (p1.depth + p2.depth + p3.depth) / 3;
                        facesToDraw.push({ indices, p1, p2, p3, depth, normal, region: face.region || v1.region });
                    }
                }
            }

            // Sort by depth (Back to Front)
            facesToDraw.sort((a, b) => b.depth - a.depth);

            const material = (window.GreenhouseNeuroConfig && window.GreenhouseNeuroConfig.get) ?
                window.GreenhouseNeuroConfig.get('materials.brain') :
                { baseColor: { r: 160, g: 174, b: 192 }, roughness: 0.75, metalness: 0.2, alpha: 0.35, sss: true };

            // Draw Faces
            facesToDraw.forEach(f => {
                const center = {
                    x: (brainShell.vertices[f.indices[0]].x + brainShell.vertices[f.indices[1]].x + brainShell.vertices[f.indices[2]].x) / 3,
                    y: (brainShell.vertices[f.indices[0]].y + brainShell.vertices[f.indices[1]].y + brainShell.vertices[f.indices[2]].y) / 3,
                    z: (brainShell.vertices[f.indices[0]].z + brainShell.vertices[f.indices[1]].z + brainShell.vertices[f.indices[2]].z) / 3
                };

                // Item 6: Ambient Occlusion (using Curvature as a proxy for Sulcal Depth)
                const v0 = brainShell.vertices[f.indices[0]];
                const ao = 1.0 - (v0.curvature || 0) * 2.0;

                const color = GreenhouseNeuroLighting.calculateLighting(f.normal, center, camera, material);

                // Apply AO
                color.r *= ao; color.g *= ao; color.b *= ao;

                const isTarget = targetRegion && (f.region === targetRegion);
                const fog = GreenhouseModels3DMath.applyDepthFog(isTarget ? 0.9 : material.alpha, f.depth);

                ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${fog})`;
                ctx.beginPath();
                ctx.moveTo(f.p1.x, f.p1.y);
                ctx.lineTo(f.p2.x, f.p2.y);
                ctx.lineTo(f.p3.x, f.p3.y);
                ctx.fill();

                // Item 20: Clean outline pass for educational segmentation
                if (isTarget) {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${fog})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            });

            // HUD Overlays
            this.drawBoundaries(ctx, brainShell, projectedVertices);
            this.drawRegionLabels(ctx, brainShell, camera, projection);
            this.drawSurfaceGrid(ctx, projectedVertices);
            this.drawOrientationWidget(ctx, camera, width, height);
        },

        drawBoundaries(ctx, brainShell, projectedVertices) {
            if (!brainShell.boundaries) return;
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            brainShell.boundaries.forEach(b => {
                const p1 = projectedVertices[b.i1];
                const p2 = projectedVertices[b.i2];
                if (p1 && p2 && p1.scale > 0 && p2.scale > 0) {
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                }
            });
            ctx.stroke();
            ctx.restore();
        },

        drawRegionLabels(ctx, brainShell, camera, projection) {
            if (!brainShell.regions) return;
            ctx.save();
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            Object.entries(brainShell.regions).forEach(([key, data]) => {
                if (!data.vertices || data.vertices.length === 0) return;

                // Calculate centroid
                let cx = 0, cy = 0, cz = 0;
                data.vertices.forEach(idx => {
                    const v = brainShell.vertices[idx];
                    cx += v.x; cy += v.y; cz += v.z;
                });
                cx /= data.vertices.length;
                cy /= data.vertices.length;
                cz /= data.vertices.length;

                // Project to 2D with deconfliction offset
                const p = GreenhouseModels3DMath.project3DTo2D(cx * 1.2, -cy * 1.2, cz * 1.2, camera, projection);
                if (p.scale > 0.4 && p.x > 0 && p.x < projection.width) {
                    const label = key.charAt(0).toUpperCase() + key.slice(1);

                    // Only draw if not obscured by depth
                    if (p.depth < 1000) {
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                        ctx.fillText(label, p.x + 1, p.y + 1);
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillText(label, p.x, p.y);
                    }
                }
            });
            ctx.restore();
        },

        drawSurfaceGrid(ctx, projectedVertices) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            // Simplified grid rendering
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

        // Item 36: Mini-map orientation widget
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

                ctx.beginPath();
                ctx.strokeStyle = axis.color;
                ctx.moveTo(0, 0);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();

                ctx.fillStyle = axis.color;
                ctx.font = '10px Arial';
                ctx.fillText(axis.label, p.x, p.y);
            });
            ctx.restore();
        }
    };

    window.GreenhouseNeuroBrain = GreenhouseNeuroBrain;
})();
