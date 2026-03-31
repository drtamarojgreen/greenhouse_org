(function () {
    'use strict';

    const GreenhouseNeuroBrain = {
        _vertexPool: [],
        _facePool: [],
        _precomputedBoundaries: null,

        _getProjectedVertex(index) {
            if (!this._vertexPool[index]) {
                this._vertexPool[index] = { x: 0, y: 0, depth: 0, scale: 0 };
            }
            return this._vertexPool[index];
        },

        _getFaceObj(index) {
            if (!this._facePool[index]) {
                this._facePool[index] = { face: null, p1: null, p2: null, p3: null, depth: 0, nx: 0, ny: 0, nz: 0, region: null };
            }
            return this._facePool[index];
        },

        drawBrainShell(ctx, brainShell, camera, projection, width, height, activeGene = null) {
            const targetRegion = activeGene ? activeGene.region : null;
            if (!brainShell) return;

            const vertices = brainShell.vertices;
            const faces = brainShell.faces;
            const regions = brainShell.regions;

            // Light Source
            const lightDir = { x: 0.5, y: -0.5, z: 1 };
            const len = Math.sqrt(lightDir.x * lightDir.x + lightDir.y * lightDir.y + lightDir.z * lightDir.z);
            lightDir.x /= len; lightDir.y /= len; lightDir.z /= len;

            // Project all vertices first (using object pooling)
            const projectedVertices = [];
            for (let i = 0; i < vertices.length; i++) {
                const v = vertices[i];
                const p = GreenhouseModels3DMath.project3DTo2D(v.x, -v.y, v.z, camera, projection);
                const poolV = this._getProjectedVertex(i);
                poolV.x = p.x; poolV.y = p.y; poolV.depth = p.depth; poolV.scale = p.scale;
                projectedVertices.push(poolV);
            }

            // Prepare Faces with Depth and Normals
            let faceCount = 0;
            const facesToDraw = [];
            for (let i = 0; i < faces.length; i++) {
                const face = faces[i];
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

                        const fObj = this._getFaceObj(faceCount++);
                        fObj.face = face;
                        fObj.p1 = p1; fObj.p2 = p2; fObj.p3 = p3;
                        fObj.depth = depth;
                        fObj.nx = nx; fObj.ny = ny; fObj.nz = nz;
                        fObj.region = face.region;
                        facesToDraw.push(fObj);
                    }
                }
            }

            // Sort by Depth
            facesToDraw.sort((a, b) => b.depth - a.depth);

            // Draw Faces
            for (let i = 0; i < facesToDraw.length; i++) {
                const f = facesToDraw[i];
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

                // If this is the target region, use a bright, monochromatic glow and bypass lighting.
                if (targetRegion && f.region === targetRegion) {
                    const fog = GreenhouseModels3DMath.applyDepthFog(0.95, f.depth);
                    ctx.fillStyle = `rgba(255, 255, 255, ${fog})`; // Bright white for high-contrast ROI
                    ctx.beginPath();
                    ctx.moveTo(f.p1.x, f.p1.y);
                    ctx.lineTo(f.p2.x, f.p2.y);
                    ctx.lineTo(f.p3.x, f.p3.y);
                    ctx.fill();

                    // Add Stronger Highlight Outline
                    ctx.strokeStyle = `rgba(255, 255, 255, ${fog})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                } else {
                    // Apply Lighting for all other regions - Standardized Neutral Gray (#A0AEC0)
                    const ambient = 0.2;
                    const lightIntensity = ambient + diffuse * 0.8 + specular * 0.5;

                    const litR = Math.min(255, 160 * lightIntensity + specular * 255);
                    const litG = Math.min(255, 174 * lightIntensity + specular * 255);
                    const litB = Math.min(255, 192 * lightIntensity + specular * 255);

                    // Depth Fog for Alpha
                    const fog = GreenhouseModels3DMath.applyDepthFog(0.15, f.depth);

                    // --- Structural Shading (Intrinsic Signatures) ---
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(f.p1.x, f.p1.y);
                    ctx.lineTo(f.p2.x, f.p2.y);
                    ctx.lineTo(f.p3.x, f.p3.y);
                    ctx.closePath();

                    if (f.region === 'pfc' || f.region === 'prefrontalCortex') {
                        // PFC - Executive Grid Pattern with high-frequency noise
                        ctx.fillStyle = `rgba(${litR}, ${litG}, ${litB}, ${fog})`; ctx.fill();
                        ctx.strokeStyle = `rgba(255, 255, 255, ${fog * 0.4})`; ctx.lineWidth = 0.5;
                        ctx.setLineDash([1, 2]); ctx.stroke();
                    } else if (f.region === 'cerebellum') {
                        // Cerebellum - Foliated Parallel Hatching
                        ctx.fillStyle = `rgba(${litR}, ${litG}, ${litB}, ${fog})`; ctx.fill();
                        ctx.strokeStyle = `rgba(255, 255, 255, ${fog * 0.3})`; ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(f.p1.x, f.p1.y); ctx.lineTo(f.p2.x, f.p2.y);
                        ctx.moveTo(f.p1.x + 2, f.p1.y + 2); ctx.lineTo(f.p2.x + 2, f.p2.y + 2);
                        ctx.stroke();
                    } else if (f.region === 'temporalLobe') {
                        // Temporal Lobe - Dotted Wave
                        ctx.fillStyle = `rgba(${litR}, ${litG}, ${litB}, ${fog})`; ctx.fill();
                        ctx.setLineDash([1, 3]);
                        ctx.strokeStyle = `rgba(255, 255, 255, ${fog * 0.6})`; ctx.stroke();
                    } else if (f.region === 'amygdala') {
                        // Amygdala - Grainy Stippling (Salience)
                        ctx.fillStyle = `rgba(${litR}, ${litG}, ${litB}, ${fog})`; ctx.fill();
                        for(let k=0; k<2; k++) {
                            const sx = f.p1.x + Math.random()*(f.p2.x - f.p1.x);
                            const sy = f.p1.y + Math.random()*(f.p2.y - f.p1.y);
                            ctx.fillStyle = `rgba(255, 255, 255, ${fog * 0.5})`;
                            ctx.fillRect(sx, sy, 1, 1);
                        }
                    } else {
                        // Standard shaded fill
                        ctx.fillStyle = `rgba(${litR}, ${litG}, ${litB}, ${fog})`;
                        ctx.fill();
                    }
                    ctx.restore();
                }
            }

            // NEW: Topological Projection - Smooth Surface Overlay
            this.drawSurfaceGrid(ctx, projectedVertices, brainShell);
            this.drawTopologicalBoundaries(ctx, projectedVertices, vertices, faces, brainShell, camera, projection);
        },

        // Draws a subtle Lat/Lon grid to give a 'generic' scientific look
        drawSurfaceGrid(ctx, projectedVertices, brainShell) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.lineWidth = 0.3;
            ctx.beginPath();

            // Assuming vertex ordering matches the latitude/longitude bands from generator
            const latitudeBands = 40;
            const longitudeBands = 40;

            for (let lat = 0; lat <= latitudeBands; lat += 5) { // Draw every 5th band
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

        // Draws smooth, non-jagged boundaries using plane intersection - High Contrast for Grayscale
        drawTopologicalBoundaries(ctx, projectedVertices, vertices, faces, brainShell, camera, projection) {
            if (!brainShell.regionalPlanes) return;

            const segments = this._getPrecomputedBoundaries(brainShell);

            ctx.save();
            ctx.setLineDash([]); // Solid lines for defined borders
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';

            for (let i = 0; i < segments.length; i++) {
                const seg = segments[i];
                const p1 = GreenhouseModels3DMath.project3DTo2D(seg[0].x, seg[0].y, seg[0].z, camera, projection);
                const p2 = GreenhouseModels3DMath.project3DTo2D(seg[1].x, seg[1].y, seg[1].z, camera, projection);

                if (p1.scale > 0 && p2.scale > 0 && p1.depth < 0.8) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.globalAlpha = 0.6 * GreenhouseModels3DMath.applyDepthFog(1, p1.depth, 0.3, 0.8);
                    ctx.stroke();
                }
            }
            ctx.restore();
        },

        _getPrecomputedBoundaries(brainShell) {
            if (this._precomputedBoundaries) return this._precomputedBoundaries;

            const segments = [];
            const radius = 200;
            const vertices = brainShell.vertices;
            const faces = brainShell.faces;

            if (!brainShell.regionalPlanes) return [];

            brainShell.regionalPlanes.forEach(plane => {
                const axis = plane.axis;
                const threshold = plane.value * radius;

                faces.forEach(face => {
                    const v1 = vertices[face.indices[0]];
                    const v2 = vertices[face.indices[1]];
                    const v3 = vertices[face.indices[2]];

                    const s1 = v1[axis] > threshold;
                    const s2 = v2[axis] > threshold;
                    const s3 = v3[axis] > threshold;

                    if ((s1 !== s2) || (s1 !== s3) || (s2 !== s3)) {
                        const points = [];
                        const checkEdge = (va, vb) => {
                            if ((va[axis] > threshold) !== (vb[axis] > threshold)) {
                                const t = (threshold - va[axis]) / (vb[axis] - va[axis]);
                                points.push({
                                    x: va.x + t * (vb.x - va.x),
                                    y: va.y + t * (vb.y - va.y),
                                    z: va.z + t * (vb.z - va.z)
                                });
                            }
                        };
                        checkEdge(v1, v2);
                        checkEdge(v2, v3);
                        checkEdge(v3, v1);
                        if (points.length === 2) segments.push(points);
                    }
                });
            });
            this._precomputedBoundaries = segments;
            return segments;
        }
    };

    window.GreenhouseNeuroBrain = GreenhouseNeuroBrain;
})();
