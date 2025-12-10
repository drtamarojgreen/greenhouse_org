(function () {
    'use strict';

    const GreenhouseGeneticChromosome = {
        drawChromatinStructure(ctx, x, y, w, h, activeGene, drawPiPFrameCallback) {
            if (drawPiPFrameCallback) {
                drawPiPFrameCallback(ctx, x, y, w, h, "Chromatin Structure");
            }

            if (!activeGene) return;

            const time = Date.now() * 0.001;
            const rotationY = time * 0.2;

            const camera = {
                x: 0, y: 0, z: -300,
                rotationX: 0.3,
                rotationY: rotationY,
                rotationZ: 0,
                fov: 500
            };

            // Generate or Retrieve Chromosome Mesh
            if (!this.chromosomeMesh && window.GreenhouseGeneticGeometry) {
                this.chromosomeMesh = window.GreenhouseGeneticGeometry.generateChromosomeMesh();
            }

            if (this.chromosomeMesh) {
                // Render Mesh
                const { vertices, faces } = this.chromosomeMesh;

                // Project Vertices
                const projected = vertices.map(v => {
                    // Rotate
                    let vx = v.x, vy = v.y, vz = v.z;
                    // Rot Y
                    let tx = vx * Math.cos(camera.rotationY) - vz * Math.sin(camera.rotationY);
                    let tz = vx * Math.sin(camera.rotationY) + vz * Math.cos(camera.rotationY);
                    vx = tx; vz = tz;
                    // Rot X
                    let ty = vy * Math.cos(camera.rotationX) - vz * Math.sin(camera.rotationX);
                    tz = vy * Math.sin(camera.rotationX) + vz * Math.cos(camera.rotationX);
                    vy = ty; vz = tz;

                    const p = GreenhouseModels3DMath.project3DTo2D(vx, vy, vz, camera, { width: w, height: h, near: 10, far: 5000 });
                    return { x: p.x + x, y: p.y + y, z: p.depth, scale: p.scale };
                });

                // Sort Faces by Depth (Painter's Algorithm)
                const sortedFaces = faces.map(face => {
                    const p1 = projected[face[0]];
                    const p2 = projected[face[1]];
                    const p3 = projected[face[2]];
                    const z = (p1.z + p2.z + p3.z) / 3;
                    return { face, z, p1, p2, p3 };
                }).sort((a, b) => b.z - a.z);

                // Draw Faces
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 0.5;

                sortedFaces.forEach(f => {
                    if (f.p1.scale > 0 && f.p2.scale > 0 && f.p3.scale > 0) {
                        // Lighting
                        // Calculate Normal
                        const v1 = vertices[f.face[0]];
                        const v2 = vertices[f.face[1]];
                        const v3 = vertices[f.face[2]];

                        // Simple flat shading based on normal.z (facing camera)
                        // We need rotated normal
                        // ... (Skipping full normal calc for speed, using depth cue)

                        const depthAlpha = Math.min(1, Math.max(0.2, 1 - f.z / 1000));
                        const shade = Math.floor(100 + depthAlpha * 100);
                        ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade + 50}, ${depthAlpha})`;

                        ctx.beginPath();
                        ctx.moveTo(f.p1.x, f.p1.y);
                        ctx.lineTo(f.p2.x, f.p2.y);
                        ctx.lineTo(f.p3.x, f.p3.y);
                        ctx.closePath();
                        ctx.fill();
                        // ctx.stroke(); // Wireframe optional
                    }
                });
            }
        }
    };

    window.GreenhouseGeneticChromosome = GreenhouseGeneticChromosome;
})();
