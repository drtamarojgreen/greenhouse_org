(function () {
    'use strict';

    const GreenhouseNeuroBrain = {
        drawBrainShell(ctx, brainShell, camera, projection, width, height, activeGene = null) {
            const targetRegion = activeGene ? activeGene.region : null;
            if (!brainShell) return;

            // Log camera rotation every 60 calls
            if (!this._drawBrainCallCount) this._drawBrainCallCount = 0;
            this._drawBrainCallCount++;

            if (this._drawBrainCallCount % 60 === 0) {
                console.log('[drawBrainShell] Camera rotation:', {
                    call: this._drawBrainCallCount,
                    rotationX: camera.rotationX?.toFixed(3),
                    rotationY: camera.rotationY?.toFixed(3),
                    rotationZ: camera.rotationZ?.toFixed(3),
                    hasRotation: !!(camera.rotationX || camera.rotationY || camera.rotationZ)
                });
            }

            const vertices = brainShell.vertices;
            const faces = brainShell.faces;
            const regions = brainShell.regions;

            // Light Source
            const lightDir = { x: 0.5, y: -0.5, z: 1 };
            const len = Math.sqrt(lightDir.x * lightDir.x + lightDir.y * lightDir.y + lightDir.z * lightDir.z);
            lightDir.x /= len; lightDir.y /= len; lightDir.z /= len;

            // Project all vertices first
            const projectedVertices = vertices.map(v => {
                return GreenhouseModels3DMath.project3DTo2D(v.x, v.y, v.z, camera, projection);
            });

            // Prepare Faces with Depth and Normals
            const facesToDraw = [];
            faces.forEach((face, index) => {
                const p1 = projectedVertices[face.indices[0]];
                const p2 = projectedVertices[face.indices[1]];
                const p3 = projectedVertices[face.indices[2]];

                if (p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
                    // Backface Culling
                    const dx1 = p2.x - p1.x;
                    const dy1 = p2.y - p1.y;
                    const dx2 = p3.x - p1.x;
                    const dy2 = p3.y - p1.y;

                    if (dx1 * dy2 - dy1 * dx2 > 0) {
                        const depth = (p1.depth + p2.depth + p3.depth) / 3;

                        // Calculate Normal (World Space)
                        // We need rotated vertices for correct lighting if the object rotates
                        // But here the camera rotates around the object.
                        // So the object is static in World Space, camera moves.
                        // Normal is static in World Space.
                        const v1 = vertices[face.indices[0]];
                        const v2 = vertices[face.indices[1]];
                        const v3 = vertices[face.indices[2]];

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
                            region: face.region
                        });
                    }
                }
            });

            // Sort by Depth (Painter's Algorithm)
            facesToDraw.sort((a, b) => b.depth - a.depth);

            // Draw Faces
            facesToDraw.forEach(f => {
                // Lighting (Phong)
                // Diffuse
                const diffuse = Math.max(0, f.nx * lightDir.x + f.ny * lightDir.y + f.nz * lightDir.z);

                // Specular (View Vector is roughly 0,0,1 in camera space, but we are in world space)
                // Camera is at 0,0,-800 (or similar). View vector is roughly towards -Z.
                // Reflected Light
                // R = 2(N.L)N - L
                const rx = 2 * diffuse * f.nx - lightDir.x;
                const ry = 2 * diffuse * f.ny - lightDir.y;
                const rz = 2 * diffuse * f.nz - lightDir.z;

                // View Vector (Approximate towards camera)
                // Since camera rotates, this is tricky without full matrix.
                // Simplified: Specular is high when Normal points towards Camera.
                // Camera vector in World Space depends on rotation.
                // Let's use a simplified Blinn-Phong or just highlight based on Normal Z (if rotated).
                // Actually, since we didn't rotate vertices, the normal is in World Space.
                // The Camera is rotating. We need the Camera Position in World Space.
                // Camera Rotation Y means Camera is at (sin(rotY)*dist, 0, cos(rotY)*dist).

                // Simplified Specular: Just use diffuse power for "shininess" or a fixed highlight
                const specular = Math.pow(diffuse, 30); // Sharp highlight

                // Base Color
                let r = 100, g = 100, b = 100, a = 0.1;
                if (f.region && regions[f.region]) {
                    // Parse rgba
                    const color = regions[f.region].color; // e.g. 'rgba(100, 150, 255, 0.6)'
                    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
                    if (match) {
                        r = parseInt(match[1]);
                        g = parseInt(match[2]);
                        b = parseInt(match[3]);
                        a = parseFloat(match[4] || 1);
                    }
                }

                // If this is the target region, use a bright, glowing color and bypass lighting.
                if (targetRegion && f.region === targetRegion) {
                    const fog = GreenhouseModels3DMath.applyDepthFog(0.9, f.depth);
                    ctx.fillStyle = `rgba(57, 255, 20, ${fog})`; // Neon green for ROI with fog
                } else {
                    // Apply Lighting for all other regions
                    const ambient = 0.2;
                    const lightIntensity = ambient + diffuse * 0.8 + specular * 0.5;

                    const litR = Math.min(255, r * lightIntensity + specular * 255);
                    const litG = Math.min(255, g * lightIntensity + specular * 255);
                    const litB = Math.min(255, b * lightIntensity + specular * 255);

                    // Depth Fog for Alpha
                    const fog = GreenhouseModels3DMath.applyDepthFog(a, f.depth);
                    ctx.fillStyle = `rgba(${litR}, ${litG}, ${litB}, ${fog})`;
                }
                ctx.beginPath();
                ctx.moveTo(f.p1.x, f.p1.y);
                ctx.lineTo(f.p2.x, f.p2.y);
                ctx.lineTo(f.p3.x, f.p3.y);
                ctx.fill();
            });

            // Draw Region Boundaries (Thicker, Brighter)
            if (brainShell.boundaries) {
                ctx.strokeStyle = 'rgba(200, 255, 255, 0.6)'; // Brighter Cyan
                ctx.lineWidth = 2; // Thicker
                ctx.beginPath();
                brainShell.boundaries.forEach(edge => {
                    const p1 = projectedVertices[edge.i1];
                    const p2 = projectedVertices[edge.i2];
                    if (p1.scale > 0 && p2.scale > 0) {
                        // Check if visible (simple depth check or just draw all)
                        // Drawing all might show back-facing boundaries.
                        // We should check if the adjacent faces are visible.
                        // But we don't have easy access to faces here without map.
                        // Simple hack: check if Z is close to front?
                        // Or just draw them. The brain is transparent-ish.
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                    }
                });
                ctx.stroke();
            }
        }
    };

    window.GreenhouseNeuroBrain = GreenhouseNeuroBrain;
})();
